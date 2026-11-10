import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { blogCategories, blogPosts, mediaAssets } from "@/server/db/schema";
import { requireUser } from "@/server/auth/guards";
import { PostEditor, type PostInitial } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export const metadata = { title: "Yazıyı Düzenle" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const db = await getDb();
  const [rows, categories] = await Promise.all([
    db
      .select({
        post: blogPosts,
        coverUrl: mediaAssets.publicUrl,
      })
      .from(blogPosts)
      .leftJoin(mediaAssets, eq(blogPosts.coverMediaId, mediaAssets.id))
      .where(eq(blogPosts.id, id))
      .limit(1),
    db.select({ id: blogCategories.id, name: blogCategories.name }).from(blogCategories).orderBy(asc(blogCategories.position)),
  ]);

  const row = rows[0];
  if (!row || row.post.deletedAt) notFound();

  let ogUrl: string | null = null;
  if (row.post.ogImageId) {
    const ogRows = await db.select({ url: mediaAssets.publicUrl }).from(mediaAssets).where(eq(mediaAssets.id, row.post.ogImageId)).limit(1);
    ogUrl = ogRows[0]?.url ?? null;
  }

  const initial: PostInitial = {
    id: row.post.id,
    title: row.post.title,
    slug: row.post.slug,
    excerpt: row.post.excerpt,
    bodyJson: (row.post.bodyJson ?? {}) as Record<string, unknown>,
    categoryId: row.post.categoryId,
    coverMediaId: row.post.coverMediaId,
    coverUrl: row.coverUrl,
    ogImageId: row.post.ogImageId,
    ogUrl: ogUrl,
    readingMinutes: row.post.readingMinutes,
    seoTitle: row.post.seoTitle ?? "",
    seoDescription: row.post.seoDescription ?? "",
    canonicalUrl: row.post.canonicalUrl ?? "",
    robotsIndex: row.post.robotsIndex,
    robotsFollow: row.post.robotsFollow,
    status: row.post.status,
  };

  return <PostEditor categories={categories} initial={initial} />;
}
