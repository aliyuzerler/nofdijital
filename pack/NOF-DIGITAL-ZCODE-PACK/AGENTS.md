# AGENTS.md — NOF DİJİTAL

## Rol ve çalışma biçimi
Kıdemli full-stack mühendis, UI uygulama uzmanı, güvenlik mühendisi ve test mühendisi gibi çalış. Küçük, doğrulanabilir adımlar at. Çalışan tasarımı bozmadan ilerle. Her fazın sonunda ilgili test dosyasındaki kontrolleri çalıştır ve sonucu raporla.

## Kaynak doğruluğu ve tasarım önceliği
- `reference/nof_digital.html` tek görsel ve davranışsal referanstır.
- `reference-assets/asset-manifest.json` ile eşleştirilen görsellerin indeks ve sırasını koru.
- Referans HTML'nin CSS değerlerini, grid/yerleşimini, tipografisini, katmanlarını, animasyonlarını, boşluklarını ve responsive davranışını gerekçe olmadan değiştirme.
- Kullanıcı açıkça tasarım değişikliği istemedikçe yeniden tasarım, renk değişimi, yeni komponent estetiği veya gereksiz UX yorumu yapma.
- Birebir görünüm ile erişilebilirlik/performans arasında çatışma varsa, önce mevcut görünümü koruyan çözümü araştır; görsel fark yaratacak kararları raporla.
- Önce statik HTML/React portu ile görsel eşleşmeyi sağla. CMS ve veri tabanı bundan sonra bağlanır.

## İş sırası
1. `docs/PHASES/00-baseline-and-audit.md`
2. `docs/PHASES/01-foundation-and-infrastructure.md`
3. `docs/PHASES/02-visual-parity-port.md`
4. `docs/PHASES/03-database-and-content-model.md`
5. `docs/PHASES/04-admin-cms-and-media.md`
6. `docs/PHASES/05-homepage-and-site-settings.md`
7. `docs/PHASES/06-seo-contact-and-publishing.md`
8. `docs/PHASES/07-security-performance-and-release.md`

Bir fazın testleri geçmeden sonraki faza geçme. Başarısız testleri gizleme veya atlama.

## Mimari ilkeler
- Next.js App Router, React, TypeScript; PostgreSQL + Drizzle.
- İlk yayın Vercel; Postgres Neon entegrasyonu; medya için Vercel Blob adapter.
- Veritabanı ve dosya depolama uygulama iş mantığından soyutlanmalı.
- `StorageProvider` arabirimi üzerinden Blob ve ileride S3/MinIO adaptörü kullanılabilmeli.
- Standart Node.js ve Docker deployment desteklenmeli (`output: "standalone"`).
- Vercel'e özgü API'leri domain/business logic içine yayma.
- Zamanları UTC sakla; arayüzde `Europe/Istanbul` olarak göster.
- Her admin mutasyonu sunucuda kimlik, rol, input ve kaynak sahipliği kontrolünden geçmeli.

## Kod kalitesi
- `strict: true`; `any` için gerekçe ve dar kapsam şart.
- Server-only modüller `server-only` sınırıyla korunmalı.
- DB sorguları Drizzle parametreli sorgularla yapılmalı; string birleştirme ile SQL üretme.
- Form ve API girdileri Zod ile doğrulanmalı.
- Tekrarlanan UI parçaları ortak bileşenlere ayrılmalı; fakat tasarıma özgü ölçüler merkezi tasarım tokenlarında saklanmalı.
- Client Component yalnızca gerçek client etkileşimi gerekiyorsa kullanılmalı.
- Gizli anahtarlar `NEXT_PUBLIC_` değişkenlerine konulamaz.
- Hata mesajları kullanıcıya gizli veri, SQL, stack trace veya sağlayıcı tokenı göstermemeli.

## Admin güvenliği
- Genel kullanıcı kaydı kapalı; admin hesabı kontrollü bootstrap/seed süreciyle oluşturulur.
- Admin URL'sini gizlemek güvenlik yöntemi değildir.
- Yetki kontrolü sadece menü/arayüz gizleme ile yapılamaz.
- Her Server Action ve Route Handler kendi authorization kontrolünü yapar.
- Taslak içerik public sorgularda asla dönmemeli.
- Dosya upload MIME, gerçek dosya imzası, boyut ve kullanıcı yetkisiyle doğrulanmalı.

## Teslimat disiplini
Her faz sonunda:
1. Yapılan işleri listele.
2. Değişen dosyaları listele.
3. Çalıştırılan komutları ve gerçek sonuçlarını yaz.
4. Başarısız/çalıştırılamayan testleri belirt.
5. Güvenlik ve görsel regresyon kontrolünü belirt.
6. Faz kabul maddelerini tek tek PASS/FAIL olarak raporla.
7. Sonraki faza başlamadan önce mevcut fazın testlerini düzelt.

## İlgili skill dosyaları
- `.agents/skills/design-fidelity/SKILL.md`
- `.agents/skills/nextjs-architecture/SKILL.md`
- `.agents/skills/database-and-drizzle/SKILL.md`
- `.agents/skills/cms-and-content/SKILL.md`
- `.agents/skills/media-storage/SKILL.md`
- `.agents/skills/security-review/SKILL.md`
- `.agents/skills/performance-optimization/SKILL.md`
- `.agents/skills/testing-and-qa/SKILL.md`
- `.agents/skills/vercel-and-self-hosting/SKILL.md`
