import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { blogCategories, blogPosts } from "@/server/db/schema";
import { requireUser } from "@/server/auth/guards";
import { BlogTable, type BlogTableRow } from "@/components/admin/blog-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  await requireUser();
  const db = await getDb();

  const rows = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      readingMinutes: blogPosts.readingMinutes,
      category: blogCategories.name,
    })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(isNull(blogPosts.deletedAt))
    .orderBy(desc(blogPosts.updatedAt));

  const tableRows: BlogTableRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    category: r.category ?? "",
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    updatedAt: r.updatedAt.toISOString(),
    readingMinutes: r.readingMinutes,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Blog</h1>
          <p className="mt-1 text-sm text-neutral-500">Yazıları yönetin; yeni içerik ekleyin.</p>
        </div>
        <Button asChild className="bg-[#8254D8] text-white hover:bg-[#7143C2]">
          <Link href="/admin/blog/new">
            <Plus className="h-4 w-4" aria-hidden /> Yeni Yazı
          </Link>
        </Button>
      </header>
      <BlogTable rows={tableRows} />
    </div>
  );
}
