# 03 — Veri Modeli ve İçerik Şeması

## Genel kurallar
- PostgreSQL ilişkisel model; her tablo UUID primary key (gerektiğinde sortable UUID/UUIDv7).
- Tüm tablolar `created_at`, `updated_at`; soft delete gerektirenlerde `deleted_at`.
- Slug unique ve normalize edilmiş Türkçe karakter davranışı test edilmiş olmalı.
- İçerik düzenleme ve yayınlama ayrı durum alanlarıyla yönetilmeli.
- Migration'lar git'e commit edilmeli; elle production tablo düzenleme yasak.

## Tablolar
### `admin_users`
`id`, `email` unique, `name`, `role` (`owner|editor`), `password_hash` yalnızca seçilen auth adapter gerektirirse, `is_active`, `last_login_at`, timestamps. Açık kayıt yok. Auth kütüphanesinin kendi user/session tablolarıyla çakışma varsa onun şemasını kullan; ikinci bir auth veritabanı tasarlama.

### `site_settings`
`key` unique, `value_json`, `updated_by`, timestamps. Yalnızca küçük ayar/veri sözlükleri için. Tüm sayfa içeriğini tek JSON içine yığmak için kullanılmaz.

### `navigation_items`
`id`, `label`, `href`, `position`, `is_visible`, `target`, timestamps.

### `pages`
`id`, `slug` unique, `title`, `status`, `seo_title`, `seo_description`, `canonical_url`, `og_image_id`, `published_at`, timestamps.

### `page_sections`
`id`, `page_id` FK, `section_key` unique per page, `section_type`, `title`, `eyebrow`, `body_json`, `settings_json` (yalnızca section-specific sınırlı ayarlar), `position`, `is_visible`, timestamps. Görsel ilişkisi için ayrı FK veya ilişki tablosu kullan.

### `services`
`id`, `title`, `slug`, `description`, `icon_key`, `style_variant`, `position`, `is_visible`, `seo_title`, `seo_description`, timestamps.

### `process_steps`
`id`, `title`, `description`, `position`, `is_visible`, timestamps.

### `portfolio_projects`
`id`, `title`, `slug`, `description`, `category`, `cover_media_id`, `position`, `is_featured`, `is_visible`, timestamps.

### `portfolio_images`
`id`, `project_id` FK nullable (gallery item generic ise portfolio_media tablosu adı tercih edilebilir), `media_asset_id` FK, `caption`, `alt_text`, `position`, `aspect_ratio`, `crop_position`, `is_visible`, timestamps.

### `blog_categories`
`id`, `name`, `slug` unique, `description`, `position`, timestamps.

### `blog_posts`
`id`, `slug` unique, `title`, `excerpt`, `body_json` (Tiptap document JSON), `body_html_cache` optional sanitized output, `category_id` FK, `cover_media_id` FK, `author_id` FK, `status` (`draft|scheduled|published|archived`), `published_at`, `scheduled_at`, `reading_minutes`, `seo_title`, `seo_description`, `canonical_url`, `og_image_id`, `robots_index`, `robots_follow`, `revision_number`, timestamps.

### `blog_tags`, `blog_post_tags`
N:N tag relationships. Tag slugs unique.

### `media_assets`
`id`, `storage_provider`, `storage_key`, `public_url`, `original_filename`, `stored_filename`, `mime_type`, `size_bytes`, `width`, `height`, `alt_text`, `title`, `caption`, `checksum_sha256`, `uploaded_by`, `created_at`, `deleted_at`. URL tek kaynak gerçekliği olarak değil, provider key + adapter ile yeniden üretilebilir referans olarak ele alın.

### `contact_submissions`
`id`, `name`, `email`, `phone`, `service_id` nullable, `message`, `status` (`new|read|archived`), `ip_hash` (raw IP değil; privacy policy onayıyla), `user_agent_summary`, `created_at`.

### `content_revisions`, `audit_logs`
Önceki yayınlanmış versiyonu ve admin'in kritik işlemlerini sakla. `audit_logs` actor, action, entity, entity_id, safe metadata, timestamp içerir; secret veya tam hassas form mesajı loglanmaz.

## İlişkiler ve kurallar
- Sayfa/section içeriği tek bir JSON mega-kolonuna taşınmaz.
- Media kayıtları silinmeden önce blog cover, body embed, page section veya portfolio ilişkisinde kullanılıyor mu kontrol edilir.
- Public repository yalnızca `published` ve yayın zamanı gelmiş yazıları döndürür.
- Admin repository draft/scheduled dahil tüm yetkili kayıtları döndürebilir.
- Slug değişince eski URL için redirect kaydı oluştur (ör. `url_redirects` tablosu).

## Seed/migration
- Kaynak HTML'deki 7 servis, 5 süreç adımı, 6 blog kategorisi, 7 örnek blog kartı ve 14 galeri görseli import seed ile aktarılır.
- Kaynak HTML blog gövdesi otomatik üretilen şablon içerik barındırır. Bunları gerçek editoryal içerikmiş gibi doğrulanmış kabul etme; `draft`/`needs_review` olarak içe al.
- Tarih ve slug değerlerinin kaynak karşılığı korunur.
- Seed tekrarlı çalıştırıldığında duplicate kayıt oluşturmamalı (idempotent).
