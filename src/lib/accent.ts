/**
 * Bölüm başlığı vurgu (accent) yardımcısı.
 *
 * Amaç: admin > Ana Sayfa > Bölüm kartındaki "Başlık" + "Vurgulu kelime"
 * alanlarından üretilen başlığın sitede HER ZAMAN bir vurgu taşıması.
 * Kullanıcı onayı (12.11.2026):
 *  1) Eşleşme Türkçe harf duyarsızdır (Büyük/küçük, İ/ı, I/ı fark etmez).
 *  2) "Vurgulu kelime" boşsa ya da başlıkta geçmiyorsa başlıktaki SON kelime
 *     (sondaki noktalama hariç) otomatik vurgulanır — düz beyaz başlık imkânsızdır.
 *
 * Bu modül saf fonksiyonlardır; hem server (page.tsx) hem client
 * (work-gallery, stats-band) bileşenlerinde kullanılır. nof.css'e dokunulmaz;
 * renkler (site) layout'taki scoped CSS ile verilir (.acc-pl / .acc-vivid).
 */

export type AccentSegment = { t: string; a: boolean };

/** Bölüm anahtarına göre sitede kullanılan varsayılan vurgu kelimeleri. */
export const DEFAULT_ACCENTS: Record<string, string> = {
  services: "tek çatı altında.",
  gallery: "duvarı",
  stats: "fark edemezler!",
  about: "Yaratıcılığı stratejiyle,",
  process: "net bir yol.",
  "blog-preview": "yazılar",
  contact: "hazır mısınız?",
};

/**
 * bodyJson içindeki accent değerini okur; yoksa bölümün varsayılanını verir.
 * Admin formu da bu haritayı kullanarak alanı her başlıklı bölümde gösterir.
 */
export function sectionAccent(body: unknown, sectionKey: string): string | null {
  if (body && typeof body === "object") {
    const v = (body as Record<string, unknown>).accent;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return DEFAULT_ACCENTS[sectionKey] ?? null;
}

/**
 * Uzunluk korumalı Türkçe harf katlama: dönen folded metin, orijinal metinle
 * AYNI kod noktası sayısına sahiptir; map[i] folded konumunu orijinal UTF-16
 * ofsetine çevirir (İ→i, I→ı özel durumları dahil).
 */
function foldTr(s: string): { folded: string; map: number[] } {
  let folded = "";
  const map: number[] = [];
  let i = 0;
  while (i < s.length) {
    const cp = s.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    let low: string;
    if (ch === "İ") low = "i";
    else if (ch === "I") low = "ı";
    else low = ch.toLocaleLowerCase("tr-TR");
    folded += low;
    for (let k = 0; k < low.length; k++) map.push(i);
    i += ch.length;
  }
  map.push(s.length);
  return { folded, map };
}

const TRAILING_PUNCT = "[\\s.,!?…:;—–··-]*";

/**
 * Başlığı vurgu parçalarına böler. Dönüş: [{ t: "metin", a: vurguluMu }, ...]
 * — vurgu kelimesi başlıkta geçiyorsa o bölüm, geçmiyorsa son kelime vurgulu
 * gelir; tek kelimelik başlıkta vurgu uygulanmaz (görsel denge).
 */
export function accentSegments(text: string, accent?: string | null): AccentSegment[] {
  const t = typeof text === "string" ? text : String(text ?? "");
  if (!t.trim()) return [{ t, a: false }];

  const { folded, map } = foldTr(t);
  const rawAccent = (accent ?? "").toString().trim();

  if (rawAccent) {
    const fa = foldTr(rawAccent).folded;
    const i = fa ? folded.indexOf(fa) : -1;
    if (i >= 0) {
      const start = map[i]!;
      const end = map[i + fa.length]!;
      return [
        { t: t.slice(0, start), a: false },
        { t: t.slice(start, end), a: true },
        { t: t.slice(end), a: false },
      ].filter((s) => s.t.length > 0);
    }
  }

  // Fallback (kullanıcı onaylı): son kelimeyi sondaki noktalamayı ayırarak vurgula.
  const m = t.match(new RegExp("(\\S+?)(" + TRAILING_PUNCT + ")$"));
  if (m && m.index !== undefined && m.index > 0 && /\S/.test(t.slice(0, m.index))) {
    const start = m.index;
    const end = start + m[1]!.length;
    return [
      { t: t.slice(0, start), a: false },
      { t: t.slice(start, end), a: true },
      { t: t.slice(end), a: false },
    ].filter((s) => s.t.length > 0);
  }

  return [{ t, a: false }];
}
