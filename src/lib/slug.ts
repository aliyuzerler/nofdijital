/** Türkçe karakterleri düşüren slugify (seed kurallarıyla aynı). İzomorfik — client/server ortak. */
export function slugifyTr(s: string): string {
  return s
    .toLowerCase()
    .replaceAll("ı", "i").replaceAll("İ", "i")
    .replaceAll("ş", "s").replaceAll("Ş", "s")
    .replaceAll("ğ", "g").replaceAll("Ğ", "g")
    .replaceAll("ü", "u").replaceAll("Ü", "u")
    .replaceAll("ö", "o").replaceAll("Ö", "o")
    .replaceAll("ç", "c").replaceAll("Ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
