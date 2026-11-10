import type { Metadata } from "next";
import { BlogArchive } from "@/components/site/blog-archive";
import { getPublishedPosts, toPostItems } from "@/server/services/repositories";

export const metadata: Metadata = {
  title: "Blog — NOF DİJİTAL",
  description: "Sosyal medya, reklam yönetimi ve prodüksiyon üzerine kısa, uygulanabilir notlar.",
};

export default async function BlogPage() {
  const posts = toPostItems(await getPublishedPosts());
  return (
    <div className="pg" id="v-blog">
      <div className="pgsec">
        <div className="wrap">
          <span className="eyb">Blog · Arşiv</span>
          <h1 className="bt1">
            Fikirler, <em>veriler</em> &amp; kareler.
          </h1>
          <p className="lead">Sosyal medya, reklam yönetimi ve prodüksiyon üzerine kısa, uygulanabilir notlar.</p>
          <BlogArchive posts={posts} />
        </div>
      </div>
    </div>
  );
}
