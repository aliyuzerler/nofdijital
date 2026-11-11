import Link from "next/link";
import { desc, eq, isNull, sql, and } from "drizzle-orm";
import { ArrowRight, FileText, Image as ImageIcon, Layers } from "lucide-react";
import { getDb } from "@/server/db";
import { blogPosts, mediaAssets } from "@/server/db/schema";
import { requireUser } from "@/server/auth/guards";
import { formatTrDate } from "@/server/services/repositories";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function count(db: Awaited<ReturnType<typeof getDb>>, query: Promise<{ n: number }[]>): Promise<number> {
  return (await query)[0]?.n ?? 0;
}

export default async function AdminDashboardPage() {
  const user = await requireUser();
  const db = await getDb();

  const [totalPosts, publishedPosts, draftPosts, mediaCount] = await Promise.all([
    count(db, db.select({ n: sql<number>`count(*)::int` }).from(blogPosts).where(isNull(blogPosts.deletedAt))),
    count(db, db.select({ n: sql<number>`count(*)::int` }).from(blogPosts).where(and(eq(blogPosts.status, "published"), isNull(blogPosts.deletedAt)))),
    count(db, db.select({ n: sql<number>`count(*)::int` }).from(blogPosts).where(and(eq(blogPosts.status, "draft"), isNull(blogPosts.deletedAt)))),
    count(db, db.select({ n: sql<number>`count(*)::int` }).from(mediaAssets).where(isNull(mediaAssets.deletedAt))),
  ]);

  const lastPosts = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      status: blogPosts.status,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(isNull(blogPosts.deletedAt))
    .orderBy(desc(blogPosts.updatedAt))
    .limit(5);

  const metrics = [
    { label: "Toplam Yazı", value: totalPosts, icon: FileText, href: "/admin/blog" },
    { label: "Yayında", value: publishedPosts, icon: Layers, href: "/admin/blog" },
    { label: "Taslak", value: draftPosts, icon: FileText, href: "/admin/blog" },
    { label: "Medya", value: mediaCount, icon: ImageIcon, href: "/admin/media" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Hoş geldiniz, {user.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">Site içeriğinizin genel durumu.</p>
      </header>

      <section aria-label="Metrikler" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.label} href={m.href} className="group">
              <Card className="h-full border-neutral-200 transition-colors group-hover:border-[#9335FF]/50">
                <CardContent className="flex flex-col gap-2 p-4">
                  <Icon className="h-4 w-4 text-[#9335FF]" aria-hidden />
                  <p className="text-2xl font-semibold tabular-nums text-neutral-900">{m.value}</p>
                  <p className="text-xs text-neutral-500">{m.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <Card className="border-neutral-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold text-neutral-900">Son yazılar</CardTitle>
          <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm font-medium text-[#8426F2] hover:underline">
            Tümü <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </CardHeader>
        <CardContent>
          {lastPosts.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">Henüz yazı yok.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {lastPosts.map((p) => (
                <li key={p.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{p.title}</p>
                    <p className="truncate text-sm text-neutral-500">/blog/{p.slug}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-neutral-400">{formatTrDate(p.updatedAt)}</span>
                    <Badge
                      variant="outline"
                      className={
                        p.status === "published"
                          ? "border-[#9335FF]/40 bg-[#9335FF]/10 text-[#8426F2]"
                          : "border-neutral-300 text-neutral-500"
                      }
                    >
                      {p.status === "published" ? "Yayında" : "Taslak"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
