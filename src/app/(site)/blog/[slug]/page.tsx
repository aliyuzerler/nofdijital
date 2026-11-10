import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { urlRedirects } from "@/server/db/schema";
import { PostCard } from "@/components/site/cards";
import { RenderPostBody } from "@/components/site/render-post-body";
import { getPublishedPost, getPublishedPosts } from "@/server/services/repositories";
import { toAbsoluteUrl, getBaseUrl } from "@/lib/base-url";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "Yazı bulunamadı — NOF DİJİTAL", robots: { index: false, follow: false } };

  const base = getBaseUrl();
  const title = post.seoTitle || `${post.title} — NOF DİJİTAL`;
  const description = post.seoDescription || post.excerpt;
  const ogImage = toAbsoluteUrl(post.ogImageUrl ?? post.cover);

  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl || `${base}/blog/${post.slug}` },
    robots: { index: post.robotsIndex, follow: post.robotsFollow },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${base}/blog/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  if (!post) {
    // Yayından kaldırılan/slug'ı değişen yazılar için yönlendirme tablosuna bak.
    try {
      const db = await getDb();
      const rows = await db
        .select({ toPath: urlRedirects.toPath })
        .from(urlRedirects)
        .where(eq(urlRedirects.fromPath, `/blog/${slug}`))
        .limit(1);
      if (rows[0]) redirect(rows[0].toPath);
    } catch (e) {
      if (e && typeof e === "object" && "digest" in e && typeof (e as { digest?: unknown }).digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")) {
        throw e;
      }
      // DB hatasında normal 404 akışına devam
    }
    notFound();
  }

  const all = await getPublishedPosts();
  const related = all
    .filter((x) => x.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 3);

  // JSON-LD: yalnızca gerçek veriyle alan doldur.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: toAbsoluteUrl(post.cover),
    mainEntityOfPage: `${getBaseUrl()}/blog/${post.slug}`,
  };
  if (post.publishedAt) jsonLd.datePublished = post.publishedAt.toISOString();
  if (post.authorName) jsonLd.author = { "@type": "Person", name: post.authorName };

  return (
    <div className="pg" id="v-post">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
