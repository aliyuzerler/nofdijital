import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/site/cards";
import { POSTS, POST_BODY_HTML } from "@/content/reference-data";

interface Props {
  params: Promise<{ slug: string }>;
}

function findPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return { title: "Yazı bulunamadı — NOF DİJİTAL" };
  return {
    title: `${post.title} — NOF DİJİTAL`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const body = POST_BODY_HTML.replace("%LEAD%", post.excerpt);
  const related = POSTS.filter((x) => x.slug !== post.slug)
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
            <img src={`/assets/gallery/gallery-${String(post.cover + 1).padStart(2, "0")}.webp`} alt={post.title} />
          </div>
          {/* Statik fixture gövdesi — Faz 4'te Tiptap JSON + allowlist render ile değişir */}
          <div className="wrap art2 bd" style={{ marginTop: 56 }} dangerouslySetInnerHTML={{ __html: body }} />
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
