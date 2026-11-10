# ADMIN-BUILD — Çalışma Kaydı (Faz 4+5+6: Admin Paneli + SEO)

**Tarih:** 2026-11-10 · **Ajan:** main (Z.ai Code) · **Durum:** ✅ tamamlandı, doğrulandı

## Yazılan Dosyalar

### Auth çekirdeği
- `src/server/auth/cached.ts` — createAuth() modül düzeyi Promise cache (createAuth DEĞİŞTİRİLMEDİ)
- `src/server/auth/guards.ts` — getSessionUser (React cache), requireUser (redirect), requireRole (AdminForbiddenError)
- `src/app/api/auth/[...all]/route.ts` — toNextJsHandler + handler cache (GET/POST/PATCH/PUT/DELETE)
- `src/lib/auth-client.ts` — createAuthClient (better-auth/react, relative)
- `src/lib/slug.ts` — izomorfik slugifyTr
- `src/lib/format.ts` — formatTrDateSafe (client)
- `src/lib/base-url.ts` — getBaseUrl / toAbsoluteUrl

### Bootstrap + Medya API
- `src/app/api/admin/bootstrap/route.ts` — şifreli (credential) hesap yoksa çalışır, IP/3-saat rate limit, Zod, signUpEmail + role=owner update
- `src/app/api/admin/media/route.ts` — multipart çoklu yükleme; MIME+magic bytes, ≤10MB, sharp boyut, sha256 duplicate→200 duplicate:true

### Server actions (src/features/admin/**)
- `shared.ts` — ActionResult, runAction<R> (guard+zod+hata sarmalama, NEXT_REDIRECT re-throw), logAudit, saveRevision
- `blog/actions.ts` — savePost (create/update, slug çakışma, urlRedirects insert, revizyon+audit), setPostStatus, deletePost
- `media/actions.ts` — listMedia, updateMediaMeta, deleteMedia (kullanımda engelleme: cover/OG/page OG/portfolio)
- `home/actions.ts` — getHomeSectionsAdmin, saveHomeSection (bodyJson'da yalnız lead/chip/accent/cta* güncellenir; yapısal diziler korunur)
- `services/actions.ts`, `process/actions.ts`, `portfolio/actions.ts`, `navigation/actions.ts`, `messages/actions.ts`, `settings/actions.ts`

### Admin UI (src/app/admin/**, src/components/admin/**)
- `layout.tsx` (+admin.css) — oturum varsa shell, yoksa bare children; metadata robots noindex
- `chrome.tsx` — koyu sidebar (#161022) + mor #8254D8 vurgu, mobil Sheet, UserBox+logout
- `login/page.tsx` + `login-form.tsx`, `forbidden.tsx`
- `page.tsx` (dashboard: 5 metrik + son 5 mesaj), `blog/page.tsx`+`blog-table.tsx`
- `blog/new/page.tsx`, `blog/[id]/page.tsx` + `post-editor.tsx` (Tiptap: StarterKit h2/h3+link, Image; H1 yok; medya seçici diyalog kapak/OG/inline)
- `media/page.tsx` + `media-manager.tsx` (drag&drop, arama, alt/başlık diyalog, URL kopyala, sil)
- `pages/home/page.tsx` + `home-sections.tsx`
- `services/`, `process/`, `portfolio/`, `navigation/`, `messages/` sayfa+manager çiftleri
- `settings/general/`, `settings/seo/`, `audit-log/page.tsx` (owner-only; editor 403 UI)

### SEO
- `src/app/sitemap.ts` (revalidate 3600; statik + posts[robotsIndex] + published pages)
- `src/app/robots.ts` (/admin, /api disallow; sitemap APP_URL) — `public/robots.txt` silindi (çakışma)
- `src/app/(site)/layout.tsx` — generateMetadata pages.home seo alanlarından
- `src/app/(site)/blog/[slug]/page.tsx` — zengin metadata (robots/canonical/OG), JSON-LD Article (yalnız gerçek veri), urlRedirects lookup → redirect, sonra notFound
- `src/server/services/repositories.ts` — getPublishedPost'a SEO alanları + ogMedia alias + user join; BlogListItem'a robotsIndex (mevcut davranış korunarak genişletildi)

### Güvenlik
- `next.config.ts` — headers(): nosniff, Referrer-Policy, X-Frame-Options DENY, Permissions-Policy, CSP **report-only**

## Kararlar / Sapmalar
1. **Bootstrap kilidi**: "hiç user yok" yerine "hiç credential (şifreli) hesap yok" — seed şifresiz placeholder owner (owner@nofdigital.local) oluşturduğu için literal kural bootstrap'ı kalıcı kilitlerdi. Aynı e-postayla şifresiz placeholder varsa güvenle silinip yenisi oluşturulur (blogPosts.authorId FK set null).
2. **middleware yazılmadı** — redirect'ler blog/[slug] içinde DB lookup ile; guard'lar server-side.
3. Drizzle union DB tipinde `.returning(arg)` tip hatası → tüm insert'lerde açık UUID/select-then-update deseni (cast yok).
4. Editor kaydetme/klasör akışı client'tan server action ile; curl ile action çağrısı test edilemediği için kod+tip doğrulaması yapıldı (aşağıda).

## Doğrulama (gerçek çıktılar)
- `bunx tsc --noEmit` → **0 hata** ✅
- `bun run lint` → **0 hata, 0 warning** ✅
- `GET /admin` → **307 → /admin/login** ✅ ; `/admin/login` → 200 (form render) ✅
- `GET /api/auth/ok` → 200 `{"ok":true}` ✅
- Bootstrap 1. → `{"ok":true}` 200; 2. → `{"ok":false,"error":"Kurulum daha önce tamamlanmış."}` **409** ✅
- Login (curl cookie) → user `{role:"owner", emailVerified:true}` ✅
- Cookie ile: /admin, /admin/blog, /admin/blog/new, /admin/blog/{gerçek id}, /admin/media, /admin/services, /admin/process, /admin/portfolio, /admin/navigation, /admin/messages, /admin/settings/general, /admin/settings/seo, /admin/audit-log → **hepsi 200** ✅
- Oturumsuz `POST /api/admin/media` → **401** ✅
- Yükleme: geçerli PNG → 200 ok; aynı dosya tekrar → `duplicate:true` ✅; fake.png (magic byte) → 400 "desteklenmeyen biçim" ✅; yüklenen dosya `/uploads/media/…` → 200 image/png ✅
- Geçersiz uuid/bilinmeyen id editör → 404 ✅
- Blog detay: og:title, canonical, JSON-LD `"@type":"Article"` ✅ ; bilinmeyen slug → 404 ✅
- `/robots.txt` ve `/sitemap.xml` (post linkleriyle) ✅
- Ana sayfa `<title>` pages.home seoTitle'dan; `/` içinde `uploads/gallery` hâlâ render ✅; `/api/health` → `{"ok":true,"db":"pglite"}` ✅
- dev.log: yeni hata yok (mevcut "key prop" uyarıları değişiklik öncesi de vardı — public site bileşenleri)

## Bilinen Eksikler / Notlar
- Slug değişikliği→redirect kaydı ve editor kaydetme e2e olarak tarayıcıda test edilmedi (curl server action çağıramıyor); lookup/insert kod yolları tip güvenli ve redirect lookup yolu 404 akışında çalışırken doğrulandı.
- `scheduled` durum için otomatik yayınlama worker'ı kapsam dışı (durum saklanıyor).
- Medya "kullanımda" kontrolü MVP kapsamı: blogPosts.cover/OG, pages.ogImage, portfolioImages (pageSections bodyJson içi görsel referansları taranmıyor — görev metninde de MVP olarak belirtilmişti).
- Test owner hesabı oluşturuldu: `owner@nofdigital.test` / `TestOwner123!` (bootstrap doğrulaması için; üretimde değiştirilmelidir).
