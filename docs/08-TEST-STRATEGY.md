# 08 — Test Stratejisi ve Definition of Done

## Test katmanları
- Static: ESLint, TypeScript strict, dependency/secret scan.
- Unit: slugify, validators, permissions, image metadata validation, SEO metadata, storage adapter.
- Integration: Drizzle repositories, migrations, content status filtering, cache invalidation, auth guards.
- E2E: public navigation, blog, forms, admin login, CRUD, upload, preview/publish, role checks.
- Visual: baseline screenshots at target viewport set; screenshot comparison; manual design review.
- Performance: Lighthouse CI/Web Vitals, JS bundle, LCP image, long tasks.
- Security: anonymous/admin/editor role matrix, IDOR, XSS, CSRF, upload spoofing, rate limit, draft leakage.

## Zorunlu senaryolar
1. Anonymous user `/admin` ve admin API'larına erişemez.
2. Editor owner-only ayarları değiştiremez.
3. Draft blog post slug URL'de public görünmez.
4. Publish sonrası blog listesi, detail, sitemap ve metadata güncellenir.
5. Slug değişiminde eski URL redirect verir.
6. 11 MB dosya ve fake MIME dosyası upload reddedilir.
7. Kullanımdaki medya direkt silinemez.
8. Stored XSS payload'ı render edilmez.
9. Contact form spam/rate limit uygulanır; server-side validation çalışır.
10. Galeri ve blog kapakları tüm viewport'larda doğru crop ve boyutta görünür.
11. Reduced motion açıkken hareketler azaltılır.
12. Docker build ve container start başarıyla tamamlanır.
13. Production env olmadan local/test build güvenli şekilde başarısız/uyarı verir; secrets sızdırılmaz.

## Definition of Done
- Faz test dosyası PASS.
- Görsel regresyon yok veya kayıtlı ve onaylanmış istisna.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` geçer.
- Yeni environment değişkenleri `.env.example` ve deploy docs'a eklenir.
- DB changes migration + seed + rollback/restore notu ile gelir.
- Güvenlik kontrolleri tamam; açık High/Critical bulgu yok.
- Değişen davranış testlerle belgelenir.
