# Faz 1 Testi — Temel Altyapı

- [ ] `npm run dev` localde açılıyor.
- [ ] `npm run lint`, `npm run typecheck`, unit tests ve `npm run build` geçiyor.
- [ ] Drizzle runtime DB connection test geçiyor.
- [ ] Migration unpooled URL ile uygulanıyor; app startup migration yapmıyor.
- [ ] `StorageProvider` interface fake/local adapter ile test ediliyor.
- [ ] Blob token browser bundle içinde yok.
- [ ] Anonymous user admin route'larına erişemiyor (auth guard placeholder dahil).
- [ ] Docker build başarılı; container non-root user ile çalışıyor.
- [ ] `.env.example` secret içermiyor.
- [ ] Production/Preview env scope ayrımı belgelendi.

**PASS koşulu:** Build + test + Docker smoke PASS.
