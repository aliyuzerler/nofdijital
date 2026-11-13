DROP TABLE "blog_categories" CASCADE;--> statement-breakpoint
DROP TABLE "blog_post_tags" CASCADE;--> statement-breakpoint
DROP TABLE "blog_posts" CASCADE;--> statement-breakpoint
DROP TABLE "blog_tags" CASCADE;--> statement-breakpoint
DROP TYPE "public"."content_status";--> statement-breakpoint
/* Veri geçişi (14.11.2026): ana sayfadaki eski "blog-preview" bölümünün yerine
   "press-preview" (Basında Biz) konur — blog-preview'in pozisyonu devralınır.
   Fresh DB'de (seed) zaten press-preview var; bu ifade NOT EXISTS ile idempotenttir. */
INSERT INTO "page_sections" ("id", "page_id", "section_key", "section_type", "eyebrow", "title", "body_json", "position", "is_visible", "created_at", "updated_at")
SELECT gen_random_uuid(), p.id, 'press-preview', 'press-preview', 'Basında Biz', 'Bizi yazanlar, kaynağından okuyun.',
       '{"cta":{"label":"Tümünü Gör","href":"/basinda-biz"},"count":4}'::jsonb,
       COALESCE((SELECT ps.position FROM "page_sections" ps WHERE ps.page_id = p.id AND ps.section_key = 'blog-preview' LIMIT 1), 7),
       true, now(), now()
FROM "pages" p
WHERE p.slug = 'home'
  AND NOT EXISTS (SELECT 1 FROM "page_sections" ps WHERE ps.page_id = p.id AND ps.section_key = 'press-preview');--> statement-breakpoint
/* Eski blog önizleme bölümü satırı temizlenir (blog tamamen kaldırıldı). */
DELETE FROM "page_sections" WHERE "section_key" = 'blog-preview';
