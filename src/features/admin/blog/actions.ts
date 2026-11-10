"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/server/db";
import { blogPosts, urlRedirects } from "@/server/db/schema";
import { logAudit, ok, fail, runAction, saveRevision } from "@/features/admin/shared";

/**
 * Blog yazı yönetimi server actions. Her çağrı: guard + Zod + audit +
 * revizyon snapshot + public sayfa revalidate.
 */

const docSchema = z
  .record(z.string(), z.unknown())
  .refine((d) => d["type"] === "doc", "Geçersiz içerik belgesi.");

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const saveSchema = z.object({
  id: z.string().uuid().nullish(),
  title: z.string().trim().min(2, "Başlık en az 2 karakter olmalı.").max(200),
  slug: z.string().trim().max(220).regex(slugRegex, "Slug yalnızca küçük harf, rakam ve tire içerebilir."),
  excerpt: z.string().trim().min(1, "Spot metni gerekli.").max(600),
  bodyJson: docSchema,
  categoryId: z.string().uuid().nullish(),
  coverMediaId: z.string().uuid().nullish(),
  ogImageId: z.string().uuid().nullish(),
  readingMinutes: z.coerce.number().int().min(1).max(180),
  seoTitle: z.string().trim().max(200).nullish(),
  seoDescription: z.string().trim().max(320).nullish(),
  canonicalUrl: z.string().trim().max(500).nullish(),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  status: z.enum(["draft", "scheduled", "published", "archived"]),
});

export type SavePostInput = z.infer<typeof saveSchema>;

export type SavePostResult = { ok: true; id: string } | { ok: false; error: string };

export async function savePost(raw: unknown): Promise<SavePostResult> {
  return runAction(["owner", "editor"], async (user): Promise<SavePostResult> => {
    const input = saveSchema.parse(raw);
    const db = await getDb();

    // Slug çakışma kontrolü (soft-delete edilenler dahil — unique index).
    const clash = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(input.id ? and(eq(blogPosts.slug, input.slug), ne(blogPosts.id, input.id)) : eq(blogPosts.slug, input.slug))
      .limit(1);
    if (clash[0]) return { ok: false as const, error: "Bu slug başka bir yazıda kullanılıyor." };

    const now = new Date();

    if (!input.id) {
      const id = randomUUID();
      await db.insert(blogPosts).values({
        id,
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        bodyJson: input.bodyJson,
        categoryId: input.categoryId ?? null,
        coverMediaId: input.coverMediaId ?? null,
        ogImageId: input.ogImageId ?? null,
        readingMinutes: input.readingMinutes,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        canonicalUrl: input.canonicalUrl ?? null,
        robotsIndex: input.robotsIndex,
        robotsFollow: input.robotsFollow,
        status: input.status,
        publishedAt: input.status === "published" ? now : null,
        authorId: user.id,
        revisionNumber: 1,
      });
      await saveRevision({
        entityType: "blog_post",
        entityId: id,
        snapshot: { ...input, authorId: user.id },
        revisionNumber: 1,
        createdBy: user.id,
      });
      await logAudit({ actor: user, action: input.status === "published" ? "post.publish" : "post.create", entityType: "blog_post", entityId: id, metadata: { slug: input.slug } });
      revalidatePath("/");
      revalidatePath("/blog");
      return { ok: true, id };
    }

    const prevRows = await db.select().from(blogPosts).where(eq(blogPosts.id, input.id)).limit(1);
    const prev = prevRows[0];
    if (!prev || prev.deletedAt) return { ok: false as const, error: "Yazı bulunamadı." };

    // Yayın akışı: publish → publishedAt yoksa şimdi; draft'a dönüşte publishedAt temizlenir.
    const publishedAt =
      input.status === "published" ? (prev.publishedAt ?? now) : input.status === "draft" ? null : prev.publishedAt;

    const nextRevision = prev.revisionNumber + 1;
    await db
      .update(blogPosts)
      .set({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        bodyJson: input.bodyJson,
        categoryId: input.categoryId ?? null,
        coverMediaId: input.coverMediaId ?? null,
        ogImageId: input.ogImageId ?? null,
        readingMinutes: input.readingMinutes,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        canonicalUrl: input.canonicalUrl ?? null,
        robotsIndex: input.robotsIndex,
        robotsFollow: input.robotsFollow,
        status: input.status,
        publishedAt,
        revisionNumber: nextRevision,
        updatedAt: now,
      })
      .where(eq(blogPosts.id, input.id));

    // Slug değiştiyse eski → yeni yönlendirme kaydet (idempotent).
    if (prev.slug !== input.slug) {
      await db
        .insert(urlRedirects)
        .values({ fromPath: `/blog/${prev.slug}`, toPath: `/blog/${input.slug}` })
        .onConflictDoNothing();
    }

    await saveRevision({
      entityType: "blog_post",
      entityId: input.id,
      snapshot: { ...input, publishedAt: publishedAt?.toISOString() ?? null },
      revisionNumber: nextRevision,
      createdBy: user.id,
    });
    await logAudit({
      actor: user,
      action: input.status === "published" && prev.status !== "published" ? "post.publish" : "post.update",
      entityType: "blog_post",
      entityId: input.id,
      metadata: { slug: input.slug, slugChanged: prev.slug !== input.slug, revision: nextRevision },
    });
    revalidatePath("/");
    revalidatePath("/blog");
    return { ok: true, id: input.id };
  });
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "scheduled", "published", "archived"]),
});

/** Liste sayfası hızlı işlemleri: yayınla / yayından kaldır / arşivle. */
export async function setPostStatus(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = statusSchema.parse(raw);
    const db = await getDb();
    const rows = await db.select().from(blogPosts).where(and(eq(blogPosts.id, input.id), isNull(blogPosts.deletedAt))).limit(1);
    const post = rows[0];
    if (!post) return fail("Yazı bulunamadı.");

    const publishedAt =
      input.status === "published" ? (post.publishedAt ?? new Date()) : input.status === "draft" ? null : post.publishedAt;

    await db
      .update(blogPosts)
      .set({ status: input.status, publishedAt, updatedAt: new Date() })
      .where(eq(blogPosts.id, input.id));
    await logAudit({
      actor: user,
      action: `post.${input.status === "published" ? "publish" : "status"}`,
      entityType: "blog_post",
      entityId: input.id,
      metadata: { from: post.status, to: input.status },
    });
    revalidatePath("/");
    revalidatePath("/blog");
    return ok();
  });
}

export async function deletePost(raw: unknown) {
  return runAction(["owner", "editor"], async (user) => {
    const input = z.object({ id: z.string().uuid() }).parse(raw);
    const db = await getDb();
    const rows = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(and(eq(blogPosts.id, input.id), isNull(blogPosts.deletedAt)))
      .limit(1);
    if (!rows[0]) return fail("Yazı bulunamadı.");
    await db.update(blogPosts).set({ deletedAt: new Date(), status: "archived" }).where(eq(blogPosts.id, input.id));
    await logAudit({ actor: user, action: "post.delete", entityType: "blog_post", entityId: input.id, metadata: { slug: rows[0].slug } });
    revalidatePath("/");
    revalidatePath("/blog");
    return ok();
  });
}
