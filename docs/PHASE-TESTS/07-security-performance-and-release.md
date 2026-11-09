# Faz 7 Testi — Güvenlik, Performans ve Release

## Güvenlik
- [ ] Authentication bypass, IDOR, privilege escalation denemeleri başarısız.
- [ ] CSRF, stored/reflected XSS, SQL injection ve open redirect testleri geçiyor.
- [ ] Upload spoof/path traversal/oversize testleri geçiyor.
- [ ] CSP ve security headers üretimde gözlendi.
- [ ] Secret scanning temiz; client JS içinde token/DB URL yok.
- [ ] Dependency audit'te çözülmemiş critical/high yok.

## Performans
- [ ] Mobil/desktop Lighthouse raporu alındı.
- [ ] LCP/INP/CLS hedefleri raporlandı; başarısızlık gerekçeli.
- [ ] Home/blog public bundle'da admin editor paketi yok.
- [ ] Görseller doğru sizes ve lazy/eager stratejisiyle yükleniyor.
- [ ] Galeri ve canvas CPU/memory davranışı ölçüldü.
- [ ] DB query sayısı ve indexler kontrol edildi.

## Release/taşınabilirlik
- [ ] Preview smoke test PASS.
- [ ] Production smoke test PASS.
- [ ] Docker build/run healthcheck PASS.
- [ ] Neon `pg_dump`/restore dokümanı ve test sonucu var.
- [ ] Media export/checksum doğrulaması var.
- [ ] Rollback ve DNS cutover planı var.
- [ ] Açık High/Critical bulgu yok.

**PASS koşulu:** Tüm güvenlik kontrolleri, release smoke ve taşınabilirlik testleri PASS.
