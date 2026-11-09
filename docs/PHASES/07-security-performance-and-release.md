# Faz 7 — Güvenlik, Performans ve Production Release

## Amaç
Vercel Production deploy'u güvenli, ölçülebilir ve self-hosting'e hazır hale getir.

## Yapılacaklar
1. Auth/role/IDOR/CSRF/XSS/upload/security audit.
2. Dependency and secret scan; env scope verification.
3. CSP/security headers; CORS allowlist; rate limit.
4. Core Web Vitals and Lighthouse CI; bundle analysis.
5. Font, image, JS, caching, query and layout optimization.
6. `npm run lint`, `typecheck`, unit, integration, e2e, build.
7. Vercel preview deployment and production smoke.
8. DB backup/restore test; media export test.
9. Docker image build + run smoke.
10. VPS migration guide rehearsal in staging (if possible).
11. Release checklist, rollback plan and known limitations.

## Tamamlanma
Critical/High security finding yok; görsel parite kabul; production smoke ve restore tatbikatı PASS.
