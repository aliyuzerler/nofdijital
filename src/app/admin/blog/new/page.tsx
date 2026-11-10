import { asc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { blogCategories } from "@/server/db/schema";
import { requireUser } from "@/server/auth/guards";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";

export const metadata = { title: "Yeni Yazı" };

export default async function AdminBlogNewPage() {
  await requireUser();
  const db = await getDb();
  const categories = await db.select({ id: blogCategories.id, name: blogCategories.name }).from(blogCategories).orderBy(asc(blogCategories.position));
  return <PostEditor categories={categories} initial={null} />;
}
