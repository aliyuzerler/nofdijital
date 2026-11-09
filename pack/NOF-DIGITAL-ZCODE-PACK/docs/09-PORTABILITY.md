# 09 — Platform Bağımsızlığı

Bu proje Vercel'de başlayacak ancak Vercel'e kilitlenmeyecek.

## Zorunlu soyutlamalar
- `StorageProvider`: `upload`, `delete`, `getPublicUrl`, `copy`, `head/metadata` arayüzleri. Provider ve object key DB'de ayrı tutulur.
- `Database`: PostgreSQL standardı + Drizzle. Runtime pooled URL, migration unpooled URL.
- `Auth`: uygulama domain katmanının auth vendor SDK'sını doğrudan import etmesini engelle; server auth facade.
- `Cache`: Next.js cache API kullanımı tek bir `cache/invalidation` modülünde toplanır.
- `Email/notifications`: eklenirse provider adapter.

## Asla yapma
- Bütün görselleri `blob.vercel-storage.com` URL'siyle kalıcı business key sayma.
- Vercel Blob tokenını browser bundle'a koyma.
- Neon'a özgü SQL özelliklerine ihtiyaç yokken bağımlanma.
- Production DB'ye app startup sırasında otomatik schema push.
- Vercel function/edge runtime'a özel process varsayımlarını domain koduna taşıma.

## Taşınabilir runtime
- `output: "standalone"`.
- `npm run build` ve `npm run start` çalışmalı.
- Dockerfile multi-stage, non-root.
- Nginx/Caddy reverse proxy, health endpoint, graceful shutdown.
- PostgreSQL backup/restore ve media copy tatbikatı release öncesi yapılmalı.
