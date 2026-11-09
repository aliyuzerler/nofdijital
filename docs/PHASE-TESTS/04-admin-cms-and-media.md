# Faz 4 Testi — Admin, Blog ve Medya

- [ ] Anonymous login olmadan admin dashboard ve API erişimi alamıyor.
- [ ] Owner login/logout/session expiry düzgün.
- [ ] Editor owner-only işlemi yapamıyor.
- [ ] Blog create/edit/draft/publish/unpublish/archive çalışıyor.
- [ ] Rich text allowlist çalışıyor; script/iframe/raw HTML engelleniyor veya sanitize ediliyor.
- [ ] Draft post public list/detail/sitemap içinde görünmüyor.
- [ ] Preview sadece admin'e açık ve token kısa ömürlü.
- [ ] MIME spoof, oversize, unsupported image ve SVG upload reddediliyor.
- [ ] Geçerli image yükleniyor; dimensions/alt text metadata kaydediliyor.
- [ ] Storage token client bundle/network'te sızmıyor.
- [ ] Kullanımdaki media silinemiyor; ilişki uyarısı var.
- [ ] Publish invalidation public cache'i güncelliyor.
- [ ] Audit log kritik mutation'ları kaydediyor.

**PASS koşulu:** Auth role matrix + upload abuse + XSS + E2E PASS.
