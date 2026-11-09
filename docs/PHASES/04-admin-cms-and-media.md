# Faz 4 — Admin, Blog ve Medya Kütüphanesi

## Amaç
Güvenli admin girişi, blog CRUD, rich text ve medya kütüphanesi oluştur.

## Yapılacaklar
1. Admin login/logout, session, role guard; genel kayıt kapalı.
2. Dashboard temel metrikleri.
3. Blog liste/filtre/durum, create/edit/draft/publish/unpublish/archive.
4. Tiptap editor: allowlisted node/mark; JSON body persistence; sanitized render.
5. Preview token kısa ömürlü/imzalı; draft public endpointte görünmez.
6. Media library list/upload/search/filter/metadata/delete-with-reference-check.
7. `StorageProvider` üzerinden Vercel Blob adapter; token server-only.
8. File MIME + magic bytes + size/dimensions + image decode validation.
9. Revisions ve audit logs.
10. Playwright E2E: owner/editor/anonymous role matrix.

## Sınırlar
Admin paneli public sayfa CSS'ini etkilemez. SVG/HTML upload default kapalı.
