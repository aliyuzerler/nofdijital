# 05 — Güvenlik Standartları (Zorunlu)

## Kimlik ve oturum
- Admin login ve logout server-side auth library ile.
- Genel kayıt kapalı; admin bootstrap ayrı, kontrollü script ile.
- Session cookie `HttpOnly`, `Secure` (prod), `SameSite=Lax` veya daha sıkı, uygun `Path` ve kısa/uygun TTL.
- Secret en az 32 byte kriptografik rastgele; per environment ayrı.
- Login denemelerinde IP/user bazlı rate limit ve geçici lockout/backoff.
- MFA desteklenebiliyorsa owner/admin için etkinleştirilebilir.
- Auth/session işlemlerinde kullanıcıyı sadece client state'e göre yetkili sayma.

## Yetkilendirme
- En az `owner` ve `editor` rolü; editor kritik site ayarı, admin user ve audit log erişimine sahip olmamalı.
- Her server action, route handler, server-side mutation ve medya upload girişinde auth + role + ownership kontrolü.
- `middleware`/proxy koruması UX katmanıdır; server-side kontrolün yerine geçmez.
- Public API sadece gereken minimum alanları döndürür.

## Veri doğrulama ve injection
- Tüm dış inputlar Zod ile server tarafında doğrulanır.
- Drizzle parametreli query kullan; raw SQL gerekiyorsa parametre binding.
- Rich text sadece izinli node/mark/attribute ile parse/render edilir; kullanıcı HTML'i sanitize edilmeden render edilmez.
- `dangerouslySetInnerHTML` kullanımını minimize et; sanitization sonrası sınırlı bileşen içinde kullan.
- URL alanları scheme allowlist (http/https/mailto/tel); `javascript:` ve `data:` navigation yasak.
- Open redirect, SSRF, path traversal, mass assignment ve prototype pollution risklerine dikkat.

## Upload güvenliği
- Sadece izinli image MIME + magic bytes eşleşmesi.
- Dosya boyutu, dimension ve pixel count limiti.
- SVG default kapalı; executable/HTML dosyası yok.
- Dosya adı kullanıcı girdisinden doğrudan storage key yapılmaz; random ID.
- Görseli decode eden kütüphane güncel tutulur; EXIF metadata gerektiğinde kaldırılır.
- `BLOB_READ_WRITE_TOKEN` yalnızca server tarafı environment'ta; frontend'e gönderilmez.
- Public Blob yalnızca kamuya açık web görselleri için. Özel belgeler/kişisel dosyalar ayrı private storage kullanır.

## Web güvenliği
- CSP (önce report-only, sonra enforce), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, uygun `frame-ancestors`.
- HTTPS zorunlu; prod'da secure cookie.
- CORS default kapalı; sadece gerçekten gereken origin allowlist.
- Cookie tabanlı state change endpointlerde CSRF koruması; Server Actions'in origin kontrollerini devre dışı bırakma.
- Login, iletişim formu, arama ve upload için rate limit/abuse controls.
- Contact form honeypot veya bot kontrolü; form validation; HTML escaping.
- SQL, stack trace, auth internals veya env değerleri client error'da gösterilmez.

## Gizlilik
- İletişim formu için gerekli en az veri topla.
- Log'a mesaj gövdesi, parola, token, cookie, full DB URL yazma.
- Veri saklama süresi ve silme politikası belirle; gizlilik/çerez metinleri gerçek işletme bilgileriyle tamamlanmalı.
- Analytics/marketing tracking açıkça onaylanmamışsa ekleme.

## Production kontrol
- Dependency audit (`npm audit` veya eşdeğer), secret scanning, static type check, lint, unit/integration/E2E.
- Vercel env scope'larını denetle; Preview secrets production'dan ayrılmalı.
- DB least-privilege role; runtime role migration owner yetkisine sahip olmamalı (sağlayıcı/şema buna izin veriyorsa).
- Yedekleme ve restore tatbikatı.
- Admin kullanıcılarının sayısı ve erişimlerinin düzenli kontrolü.
