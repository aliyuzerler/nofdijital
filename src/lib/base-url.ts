/** Sitemap/OG canonical için taban URL (sondaki eğik çizgi temizlenir). */
export function getBaseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Relative URL'i taban ile mutlaklaştırır; zaten mutlaksa olduğu gibi döner. */
export function toAbsoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${getBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}
