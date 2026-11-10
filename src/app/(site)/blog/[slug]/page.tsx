import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/site/cards";
import { RenderPostBody } from "@/components/site/render-post-body";
import { getPublishedPost, getPublishedPosts } from "@/server/services/repositories";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Yazı bulunamadı — NOF DİJİTAL" };
  return {
    title: `${post.title} — NOF DİJİTAL`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();

  const all = await getPublishedPosts();
  const related = all
    .filter((x) => x.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 3);

  return (
    <div className="pg" id="v-post">
      <div className="pgsec">
        <article id="pst">
          <div className="wrap art2">
            <Link className="back" href="/blog">
              <svg className="i">
                <use href="#i-l" />
              </svg>{" "}
              Tüm yazılar
            </Link>
            <div className="mt" style={{ marginTop: 34 }}>
              <span className="tag">{post.category}</span>
              <span>
                {post.date} · {post.reading} okuma
              </span>
            </div>
            <h1>{post.title}</h1>
          </div>
          <div className="cv">
            { }
            <img src={post.cover} alt={post.alt} />
          </div>
          <div className="wrap art2 bd" style={{ marginTop: 56 }}>
            <RenderPostBody doc={post.bodyJson} />
          </div>
        </article>
        <div className="wrap" style={{ marginTop: 90 }}>
          <h3 style={{ fontSize: "2rem" }}>İlgili yazılar</h3>
          <div className="bgrid" id="rel">
            {related.map((p) => (
              <PostCard key={p.slug} slug={p.slug} category={p.category} title={p.title} excerpt={p.excerpt} date={p.date} cover={p.cover} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
