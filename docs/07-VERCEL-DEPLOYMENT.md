# 07 — Vercel Yayınlama ve Kendi Sunucuna Taşıma

## İlk Vercel deploy
1. Git main branch'i temiz build ve testlerle push et.
2. Vercel'e import et; framework Next.js otomatik algılanmalı.
3. Neon Marketplace integration ile DB provision/link et.
4. Vercel Blob store oluştur ve proje scope'una bağla.
5. `Preview` ve `Production` env değerlerini ayrı ayrı tanımla.
6. İlk deploy'dan önce production migration'ı kontrollü çalıştır.
7. Owner admin'i güvenli bootstrap komutuyla oluştur; public register açma.
8. Domain ve DNS; canonical host redirect; HTTPS kontrolü.
9. Search Console için sitemap/robots/canonical; metadata test.
10. Production smoke test ve backup/restore dokümantasyonu.

## Ortamlar
- Local: local PostgreSQL + MinIO (veya ayrı Neon dev branch).
- Preview: preview DB branch, preview Blob store (mümkünse ayrı store), test admin.
- Production: production DB/store, gerçek owner hesabı.
- Production verisini preview/teste kopyalama; gerekirse anonimleştir.

## Migration / deploy kuralı
- Migration dosyaları repository'de version-controlled.
- Production migration otomatik deploy concurrency içinde kontrolsüz çalışmamalı.
- Destructive migration için expand-contract yaklaşımı: önce backward-compatible schema, sonra uygulama deploy, sonra eski kolon temizliği.
- Geri dönüş planı: uygulamayı önceki release'e geri al; migration rollback ancak veri kaybı riski analizinden sonra.

## VPS taşıma planı
1. Downtime penceresi ve DNS TTL düşürme planı.
2. Neon'dan standart `pg_dump -Fc` ile unpooled bağlantı üzerinden export.
3. Kendi PostgreSQL sunucunda uyumlu veya daha yeni major sürümde restore (`pg_restore`).
4. Media inventory: tüm `media_assets` satırları + `storage_key` + checksum listesi export.
5. Vercel Blob dosyalarını S3/MinIO bucket'a kopyala; checksum/byte count doğrula.
6. `StorageProvider` S3/MinIO adapter'ını aktive et ve yeni URL üretim politikasını test et.
7. Environment değişkenlerini VPS secret store'a taşı; hiçbirini Git'e koyma.
8. Docker image build; Nginx reverse proxy; TLS; process restart/health checks.
9. DB cutover: kısa read-only/freeze, son dump veya uygun replication yöntemi, restore, app env switch.
10. DNS switch; smoke test; logs/metrics; geri dönüş süresi boyunca eski kaynakları silme.
11. Her blog/galeri görsel URL'si ve SEO canonical/redirect kontrolü.

## VPS üretim güvenliği
- Reverse proxy (Nginx/Caddy) arkasında çalıştır; Node portunu doğrudan public açma.
- Firewall: yalnızca SSH (tercihen key only), HTTP/HTTPS; DB portu internete kapalı.
- OS/containers güncel, non-root process, secrets outside image, unattended security updates.
- Postgres private network, automated encrypted offsite backups, restore test.
- S3/MinIO credentials least privilege; bucket public policy yalnızca gerekli public media path.
- Log rotation, monitoring, uptime/backup alerts.

## Taşıma kısıtları
- Next.js self-hosting'te ISR/cache, image optimization, cron, edge middleware ve platform entegrasyonlarının davranış farkları kontrol edilmeli.
- Vercel Blob URL'leri değişebilir; DB'deki provider/key alanları sayesinde URL'ler adapter'dan üretilebilmeli.
- Vercel Analytics/Speed Insights gibi ürünler kullanılırsa alternatifleri ve silme/değiştirme adımı belgelenmeli.
