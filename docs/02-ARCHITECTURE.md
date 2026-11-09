# 02 — Mimari ve Vercel Dağıtım Tasarımı

## Mimari karar

```text
Visitor Browser
  └─ Vercel Edge/CDN
       └─ Next.js App Router (Node.js runtime)
            ├─ Public pages / SEO / Blog
            ├─ Admin UI (protected)
            ├─ Server Actions / Route Handlers
            │    ├─ Auth + RBAC + Zod validation
            │    ├─ Domain services
            │    ├─ Drizzle ORM
            │    │    └─ Neon PostgreSQL (pooled runtime URL)
            │    └─ StorageProvider
            │         └─ Vercel Blob (initial adapter)
            └─ Observability / structured logs
```

## Seçilen teknoloji
- Next.js App Router + React + TypeScript (strict).
- Neon PostgreSQL: Vercel Marketplace üzerinden bağlı managed PostgreSQL.
- Drizzle ORM + version-controlled migrations.
- Vercel Blob: başlangıç medya deposu. Uygulama kodu doğrudan Blob SDK'ya bağımlı olmamalı; `StorageProvider` arayüzünün arkasında olmalı.
- Admin auth: güncel Next.js uyumluluğu doğrulanmış bir auth kütüphanesi (tercihen Auth.js veya Better Auth; faz 1'de sürüm/API uyumluluğunu araştırıp kararı ADR ile sabitle). Özel kriptografik auth protokolü yazma.
- Form validation: Zod.
- Blog editörü: Tiptap (JSON doküman saklama; public render'da allowlist ve sanitization).
- Test: Vitest + Testing Library + Playwright; Lighthouse CI veya eşdeğeri.
- Docker: Next.js `output: "standalone"`.

## Vercel kurulumu
1. Git deposunu Vercel'e bağla.
2. Neon Postgres Marketplace entegrasyonunu ekle. Uygun pooled bağlantı runtime, unpooled bağlantı migration/administrative görevler için kullanılmalı.
3. Vercel Blob store oluştur; public blog/galeri görselleri için public erişim kullan. Hassas dosyaları public bucket'a yükleme.
4. Environment Variables: Preview ve Production ayrı scope'larda tanımla.
5. Preview deploy her PR için; Production deploy yalnızca ana branch'e merge ile.
6. Migration komutunu kontrollü deployment adımı olarak çalıştır; her preview build'de production DB migration yapma.
7. Custom domain, TLS, redirects, `www`/apex canonical politikası yapılandır.

## Ortam değişkenleri
`infra/.env.example` örnektir. Gizli değerler yalnızca Vercel dashboard veya local secret store'da tutulur.
- `DATABASE_URL`: runtime pooled Postgres URL.
- `DATABASE_URL_UNPOOLED`: migration/backup için unpooled URL.
- `AUTH_SECRET`: güçlü, rastgele secret.
- `APP_URL`: ortamın tam origin'i.
- `BLOB_READ_WRITE_TOKEN`: yalnızca server runtime'da erişilebilir.
- `STORAGE_PROVIDER`: `vercel-blob` veya `s3` gibi adaptör adı.
- `S3_*`: ileride self-hosted S3/MinIO adapter'ı için optional.

## Uygulama klasör önerisi
```text
src/
  app/                 # App Router pages, route handlers
  components/          # shared UI; design-specific components
  features/
    admin/ blog/ media/ homepage/ contact/ settings/
  lib/
    auth/ db/ validation/ seo/ cache/ security/
  server/
    services/ repositories/ storage/
  styles/
  types/
 drizzle/              # schema and migrations
 public/
  brand/                # stable local assets if needed
 tests/
  unit/ integration/ e2e/ visual/
```

## Database/cache akışı
- Public yayın içerikleri server-side okunur.
- Admin mutation sonrası sadece ilgili tag/path invalid edilir.
- Taslaklar için preview sadece authenticated admin session ile kullanılabilir.
- Admin kişisel verisi veya private data cache'e yazılmaz.
- Preview token/secret query string'e açık şekilde eklenmemeli; kısa ömürlü ve imzalı preview akışı uygulanmalı.

## Taşınabilirlik
- Standart Node.js `build`/`start` komutları.
- `output: "standalone"` + Dockerfile.
- PostgreSQL standart SQL; Neon'a özel özellik sadece ADR ile gerekçelendirilir.
- `StorageProvider` adaptörleri: Vercel Blob (ilk), S3-compatible (MinIO/Ceph/Backblaze gibi) (gelecek).
- Host/edge middleware, Vercel Cron, Vercel KV gibi ürünlere iş mantığını bağlama. Gerekirse adapter ve fallback tanımla.
- Vercel'e özel cache/CDN avantajları, Next.js genel cache API'si arkasında tutulur.

## Mimari karar kayıtları
Önemli paket/servis kararlarında `docs/adr/NNNN-title.md` oluştur; gerekçe, alternatifler, trade-off ve taşınma etkisini kaydet.
