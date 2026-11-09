# 04 — Admin CMS Gereksinimleri

## UI
Admin panelinin görsel dili mevcut public web tasarımını zorla taklit etmek zorunda değildir; ancak aynı marka renklerini ve tipografik aileyi kullanmalı. Kurumsal, sade, okunabilir ve içerik üretimine odaklı olmalı. Public sayfa görünümü hiçbir admin UI kararı nedeniyle değişmemeli.

## Admin route haritası
- `/admin/login`
- `/admin` dashboard
- `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]`
- `/admin/categories`, `/admin/tags`
- `/admin/media`
- `/admin/pages/home`
- `/admin/services`
- `/admin/process`
- `/admin/portfolio`
- `/admin/navigation`
- `/admin/messages`
- `/admin/settings/general`, `/admin/settings/seo`
- `/admin/audit-log`

## Blog editörü
- Tiptap: paragraph, heading 2/3, bold, italic, link, ordered/unordered list, blockquote, image, horizontal rule.
- Heading 1, script, iframe, arbitrary HTML, inline style ve raw embed default kapalı.
- Görsel eklenirken medya kütüphanesine yüklenmiş asset seçilir; editor içinde data URI saklanmaz.
- Alt text zorunlu/önerilen; dekoratif görseller için açık `decorative` seçeneği.
- Otomatik slug üretimi; kullanıcı düzenleyebilir; değiştirilirse redirect kaydı.
- Draft, preview, schedule, publish, unpublish, archive durumları.
- Yayın öncesi preview kartı: başlık, slug, kategori, kapak, SEO, alt text, link kontrolü.
- İçerik kaydetme autosave olabilir; server-side rate limit ve dirty-state göstergesi olmalı.

## Medya kütüphanesi
- Sürükle-bırak + dosya seçici.
- Sadece raster image `jpeg`, `png`, `webp`, `avif` (SVG sadece güvenli sanitize işleminden sonra ve ayrıca onaylanır; MVP'de kapalı).
- İlk sınır: 10 MB/dosya, 20 adet/işlem; ihtiyaç olursa config.
- Upload sırasında progress; başarısız dosya için retry.
- Thumbnail, gerçek boyutlar, dosya boyutu, MIME, alt text, başlık, yüklenme tarihi.
- Dosya tekrar yüklenmesi gerekiyorsa checksum ile duplicate uyarısı.
- Kullanımda olan medyayı direkt silme; önce ilişkileri göster ve değişim/çözüm iste.
- Her upload server-side auth + file validation kontrolü yapmalı.

## Ana sayfa düzenleme
- Sabit bölüm anahtarları: hero, services, portfolio/gallery, about, process, blog-preview, contact.
- Her section alanı form alanına çevrilsin: heading, eyebrow, body, CTA label/link, visibility, order.
- Her değişken layout parçalarını admin'in serbestçe bozmasına yol açmasın. Kullanıcı metin ve asset'i değiştirir; section renderer aynı tasarım bileşenini kullanır.
- Bölüm sıralama gerekirse allowlisted order listesiyle; grid/tasarım kıracak arbitrary layout builder yapılmaz.
- Default CTA ve fallback content source HTML'den korunur.

## Audit ve yayın
- Publish/unpublish, slug change, media delete, role change ve setting critical mutations audit log'a yazılır.
- Preview draft'a yalnızca admin erişebilir.
- Public cache sadece publish işleminden sonra invalid edilir.
- Revision snapshot geri yüklemesi admin tarafından onaylanır; restore da audit log'a eklenir.
