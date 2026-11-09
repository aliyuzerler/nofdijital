# Faz 1 — Uygulama Temeli ve Altyapı

## Amaç
Next.js projesini, kalite kapılarını, DB bağlantısını, storage abstraction taslağını ve Docker/Vercel temelini kur.

## Yapılacaklar
1. Next.js App Router + TypeScript strict proje başlat.
2. Paket sürümlerini kurulum anında stable/uyumlu olarak belirle; Node LTS ile uyumu kayıt altına al.
3. ESLint, Prettier (opsiyonel), typecheck, unit test ve Playwright e2e yapılandır.
4. Drizzle ORM, Neon serverless/postgres driver veya resmi önerilen driver ile bağlantı kur; pooled runtime URL kullan.
5. Migration için ayrı unpooled URL ve script tanımla; app startup'ta migration çalıştırma.
6. `StorageProvider` interface ve fake/local adapter oluştur; Vercel Blob adapter ayrı modül olsun.
7. Auth kütüphanesini sürüm/uyumluluk araştırmasıyla seç; auth facade kur, public registration kapalı.
8. `output: "standalone"`, Dockerfile, compose local Postgres + MinIO ve `.env.example` oluştur.
9. Health endpoint; server-only boundary; error handling; structured logs.
10. CI workflow: lint/typecheck/unit/build.

## Çıktılar
- Çalışan local skeleton
- İlk Drizzle migration
- Storage interface + test
- Docker build
- Vercel env ve deploy notları

## Sınırlar
Henüz büyük public UI ve admin CRUD yok. Demo secret veya gerçek credential commit etme.
