# ADR 0001 — Mimari Kararlar

**Tarih:** 2026-11-09 · **Durum:** Kabul edildi

## Bağlam
`reference/nof_digital.html` (SHA doğrulanmış) tek görsel kaynak; hedef Vercel + Neon + Vercel Blob, taşınabilirlik zorunlu (Docker/VPS). Sandbox ortamında yönetilen PostgreSQL sunucusu ve Docker yok (root yok).

## Kararlar
1. **Framework:** Next.js 16 App Router + React 19 + TypeScript strict (scaffold uyumlu).
2. **ORM/DB:** Drizzle ORM. Sandbox geliştirmesi için **PGlite** (WASM PostgreSQL, dosya tabanlı `db/pgdata`) — gerçek PostgreSQL SQL'i; production için **postgres.js/Neon** sürücü adapter üzerinden. Sürücü seçimi `DATABASE_DRIVER` env ile (varsayılan `pglite`). Gerekçe: sıfır dış süreç (sandbox'ta daemon yok), aynı migration dosyaları her iki sürücüde çalışır. Alternatifler: SQLite (paket şartnamesine aykırı — reddedildi), apt postgres (root gerekli — imkânsız).
3. **Medya:** `StorageProvider` arayüzü (`upload/delete/getPublicUrl/copy/head`); `LocalProvider` (public/uploads altına yazar) + `VercelBlobProvider` (token varsa aktif). Provider + key + checksum DB'de.
4. **Auth:** Better Auth (paket tercihi 2'si Auth.js/Better Auth'dan biri). next-auth v4 Next 16 ile sürüm uyumsuzluğu riskli; Better Auth Drizzle adapter ile tek şema. Genel kayıt kapalı; owner seed script ile.
5. **Editör:** Tiptap (JSON gövde); public render allowlist + sanitize.
6. **Doğrulama:** Zod (scaffold'ta zod v4 mevcut).
7. **Test:** lint + typecheck + build; E2E/visual için Agent Browser ekran görüntüleri (Playwright kurulumu ayrı fazda genişletilebilir).
8. **Stil:** Tailwind 4 + shadcn/ui **yalnızca admin panelde**; public site referans CSS birebir (global stylesheet + BEM benzeri class'lar). Gerekçe: 01-DESIGN-FIDELITY "gerekmedikçe Tailwind ile yeniden tasarlama".
9. **Fontlar:** `next/font/google` (Bricolage Grotesque 500/700/800 + DM Sans 400/500/700), CSS değişkenleri `--fd/--fb`'ye bağlanır.

## Etkiler / Alternatifler
- PGlite dosyası yedeklenebilir (`db/pgdata` kopyası); Neon'a geçişte pg_dump/restore dokümante (docs/07).
- Better Auth kendi tablolarını (`user`, `session`, `account`, `verification`) kullanır; `admin_users` bunlarla eşlenir, ikinci auth DB'si kurulmaz.
