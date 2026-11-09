# 06 — Performans ve Core Web Vitals

## Hedefler
- Mobil ve desktop'ta gerçek kullanıcı verisine göre Core Web Vitals iyi aralıkta hedeflenmeli: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (75. persentil).
- Lighthouse mobil performans hedefi ilk sürümde ≥ 90; tasarımın canvas/galeri efektleri nedeniyle düşen kısımlar için ölçüm ve gerekçeli bütçe.
- İlk yüklemede admin/editör kodları ve gereksiz client JS public route'a dahil edilmemeli.

## Uygulama
- Server Components default; client islands yalnızca menü, galeri, lightbox, filtreleme, editör gibi etkileşimli alanlarda.
- Fontlar tercihen `next/font` ile self-host; kaynak font dosyaları lisans/teknik kontrol sonrası. Google Fonts uzak yüklemesi FOUT/bağlantı bağımlılığı yaratır; görsel benzerliği bozmadan font metriklerini eşleştir.
- Hero kritik görsellerinde doğru preload/fetchPriority; ilk ekranda olmayan medyada lazy loading.
- `next/image` width/height veya `fill` + `sizes`; crop/quality optimize. Galeri thumbnail ile lightbox full-size ayrı.
- Source Base64 varlıkları production HTML/JS bundle içine tekrar gömme; dosyaları media storage veya public asset olarak servis et.
- Asset hash/cache immutable; dosya URL'leri versioned.
- CSS ve JS bundle boyutunu analiz et; ağır editor paketini sadece admin route'da yükle.
- `IntersectionObserver` tek instance/reuse; scroll handler throttle veya rAF; event listener cleanup.
- Animasyon `transform`/`opacity` kullanmalı; layout-triggering animation minimize edilmeli.
- Canvas animasyonunda DPR limit, frame scheduling ve tab visibility pause; reduce-motion destekle.
- Gallery packing computation memoize; image dimensions önceden bilinsin. Random seed deterministik ve resize debounce.
- DB index: slug unique, status+published_at, category+status+published_at, created_at, media ilişkileri.
- Blog listesinde pagination server-side; tüm postları client'a gönderme.
- N+1 sorgu yok; public sayfalarda gerekli alanları select et.
- `revalidateTag`/`revalidatePath` mutation sonrası hedefli kullan; admin ve draft verisi cache'lenmez.

## Ölçüm
- Lighthouse CI: homepage desktop/mobile, blog archive, blog detail.
- Playwright performance trace veya Web Vitals instrumentation.
- Bundle analyzer raporu faz çıkışına eklenir.
- Görsel parity screenshot'ları performans optimizasyonundan önce/sonra tutulur; görsel kalite kaybı yok.
