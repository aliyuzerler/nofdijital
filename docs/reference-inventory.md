# Referans Envanteri — `reference/nof_digital.html`

Faz 0 çıktısı. Kaynak dosya SHA-256 `d21d1c181ca17211fe543c511aede4e24078f6c7d72a5288c4414e5680ada8cb` — `docs/REFERENCE-HASH.txt` ile doğrulandı (2026-11-09).

## Genel
- Dil `tr`; başlık `NOF DİJİTAL — Yaratıcı Prodüksiyon & Performans Pazarlama`; meta description sabit.
- Fontlar: Bricolage Grotesque (opsz,wght@12..96, 500/700/800) + DM Sans (400/500/700) — Google Fonts CDN.
- Tek dosya; CSS `<style>` (~19.4 KB), JS `<script>` (~19.8 KB), varlıklar Base64 gömülü (14 webp + logo png).
- Breakpoint'ler: `1024px` ve `700px`; `prefers-reduced-motion: reduce` desteği.
- İçerik genişliği: `.wrap{width:min(1320px,100% - 48px)}`; section padding `clamp(80px,11vw,160px)`.
- Hash tabanlı routing: `#/` (ana sayfa + `#hizmetler` vb. anchor'lar), `#/blog`, `#/blog/[slug]`; `history.pushState` + `popstate`.

## Tokenlar (birebir)
`--p:#8254D8; --pd:#58349D; --pl:#B9A0EF; --w:#fff; --bg:#F7F6FA; --dk:#15131B; --tx:#211D28; --mu:#77717F; --ln:rgba(33,29,40,.12); --e:cubic-bezier(.2,.7,.2,1)`
- Canvas arka plan zemini: `#E9E5F2`; footer `#0E0C12`.
- Bölüm zeminleri (yarı saydam, canvas üstüne bindirme): `.sec.dark{rgba(21,19,27,.9)}` `.sec.light{rgba(247,246,250,.86)}` `.sec.white{rgba(255,255,255,.92)}`; hero `rgba(21,19,27,.74)`; work `rgba(21,19,27,.9)`.

## Bölümler (7) + ek görünümler
| Bölüm | Zemin | İçerik |
|---|---|---|
| `#top` hero | koyu | eyebrow, 3 satır maskeli başlık (`.ln`), lead, 2 CTA, 3 polaroid görsel (data-i 7/2/13, `.f1/.f2/.f3`), chip, scroll göstergesi |
| band | mor | 14 span'li sonsuz marquee (`mq 40s`) |
| `#hizmetler` | light | 7 hizmet kartı (`.sv` 12 kolon grid; span sırası c7,c5,c4,c4,c4,c6,c6; varyant `dk`×2, `pu`×1) |
| `#calismalar` | koyu | sticky `100svh` sahne; 3 sahne × 7 foto = 14; yerleşim algoritması `placeScene` (seed 101+si*37, mobil seed +900); `.wpg` ilerleme 01/03 |
| `#hakkimizda` | white | başlık+lead, 3 değer satırı, 2 görsel + performans paneli (`.pan`, bar animasyonu) |
| `#surec` | dark | 5 adım (`.st` grid 150/1fr/1.2fr; sayaç `0N`; alt çizgi scaleX animasyonu) |
| `#blog-ozet` | light | 4 kart (s7,s5,s5,s7) |
| `#iletisim` | dark | 3 bilgi satırı (placeholder "eklenecek"), 3 sosyal buton, form (5 alan, select hizmet) |
| Blog arşiv `v-blog` | light | öne çıkan `.ft`, kategori chips + arama, liste, sayfalama (PS=4) |
| Blog detay `v-post` | white | geri linki, meta, `.bt1` başlık, kapak `.cv` 16/8, gövde `.bd`, `.nt` notu, 3 ilgili yazı |

Footer: 4 kolon (`.fg4`), marka+logo+sosyal, Menü, Hizmetler (JS ile 7), İletişim (placeholder); alt bant `© 2026 NOF DİJİTAL…`.
Sabit katmanlar: `#wa` (sağ alt 62px mor), `#lb` lightbox (önceki/sonraki/kapat, klavye + swipe), `#toast`.

## JS davranışları (port edilecekler)
1. **Servis kartları**: tıkla/Enter → select değeri seçilir → `#iletisim`'e kaydırma.
2. **Reveal**: tek `IntersectionObserver` (threshold .15); `[data-r]`, `.ln>span`, sayaçlar (adım numaraları 0N, 6 frame'de artar); `.in` sınıfı kalıcı.
3. **Galeri**: `SC` sabit 3×7 indeks matrisi; mulberry32 RNG; band bazlı yerleşim + AABB çakışma reddi (lim .05 desktop/.12 mobil); 1500 deneme/parça, %8 küçültme; rotasyon ±5.5° (mobil ±4.5°); sticky scroll `p=(scrollY-offset-H*.2)/range` → `translate3d(-p*2W)`; ilerleme çubuğu + sahne numarası; resize debounce 200ms; `layoutGallery(true)` route dönüşünde.
4. **Lightbox**: 14 görsel döngüsel; opaklık geçişi 120ms; ESC/oklar/touch swipe(50px); caption `CAP[i] · (i+1)/14`.
5. **Canvas**: mulberry32(7); 55 obje (mobil 30) + lens (z=420 r=230 sabit); türler lens/ring/frame/film/panel/play/gauge/bars/dots; kamera `p*(ZT-200)`, lerp .07 (RM:1); fare paralaks ±30/20px; 110 parçacık (mobil 50); DPR ≤ 1.5; mor tonları z%3.
6. **Form**: prototip validasyon + toast; WhatsApp `whatsappNumber` boş → uyarı toast.
7. **Header**: `scrollY>20 || cur!=='home'` → `.sc` (blur+küçülme).
8. **Blog**: kategori filtre + arama (başlık+spot, lowercase) + sayfalama; öne çıkan yalnız 1. sayfa; detay ilgili yazılar aynı kategori öncelikli.

## İçerik envanteri
- 7 hizmet (ikon, metin, span, varyant) — `SV` dizisi; 5 süreç adımı — `PR`; 6 kategori + 7 blog kartı — `PO` (slug, kategori, başlık, spot, tarih TR, kapak indeksi, okuma süresi); tek ortak blog gövdesi şablonu.
- 14 galeri fotoğrafı + caption'lar `CAP` — `asset-manifest.json` ile birebir eşleşti (ar: 13×~0.667 + 1×1.5).
- Logo: `reference-assets/logo.png` (11 500 B, sha256 6af22b8c…) — `upload/logo.png` ile aynı görsel.
- İletişim bilgileri kaynakta placeholder ("eklenecek"); WhatsApp numarası boş.

## Görünüm dökümü (base64'ten çıkarılan)
`reference-assets/` 15 dosya; `public/assets/` altına sha-verified kopyalandı (gallery-01…14.webp, logo.png).
