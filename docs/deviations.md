# Onaylanmış Sapmalar (Deviations)

AGENTS.md: "Kullanıcı açıkça tasarım değişikliği istemedikçe yeniden tasarım yapılmaz." Aşağıdaki sapmalar kullanıcının açık isteğiyle yapılır ve burada kayıt altına alınır.

## DEV-001 — Tek tutarlı tema + kullanıcı seçimli tema düğmesi
- **Talep:** "Gezinirken bir beyaza dönüyor bir koyu temaya dönüyor, çok yorucu; kişinin seçimine kalsın koyu veya açık tema."
- **Kaynak davranış:** Bölümler `light/white/dark` zeminler arasında geçiş yapar (kaynakta sabit).
- **Uygulanan değişiklik:** Sayfa tek temada tutarlı; header + mobil menüde güneş/ay düğmesi; tercih `localStorage` (`nof-theme`) + `prefers-color-scheme` fallback; FOUC önleme head script'i.
- **Kural:** Düz zeminler (gradient yine yasak); mor palet ve tüm ölçüler değişmez; her iki temada referans breakpoint testleri tekrarlanır.
- **Karar:** Kabul — 2026-11-09 kullanıcı talebi.

## DEV-002 — Hash URL → gerçek slug URL
- Kaynak `#/blog/[slug]` kullanır; paket kabul kriteri gerçek `/blog/[slug]` URL'leri ister (00-PROJECT-BRIEF P0). Anchor gezinmesi `/#hizmetler` biçimine çevrilir. (Sapma değil, paket gereksinimi — kayıt amaçlı.)

## DEV-003 — Sandbox altyapı uyarlamaları
- Yönetilen PostgreSQL yerine PGlite (ADR 0001-2); Vercel Blob yerine LocalProvider aktif, Blob adapter hazır. Production env'e geçişte kod değişikliği gerekmez.
