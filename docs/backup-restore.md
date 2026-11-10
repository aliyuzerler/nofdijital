# Veritabanı Yedekleme / Restore Tatbikatı ve Rehberi

Tarih: 2026-11-10 · Oturum: FAZ7 · Sonuç: **TATBİKAT PASS**

## 1. PGlite (lokal / self-host) yedekleme

PGlite dosya tabanlıdır; yedek = veri dizininin kopyası. **Yazan süreç yokken** alın
(PGlite tek yazıcıdır — sunucu çalışırken alınan kopya tutarsız olabilir):

```bash
# 1) Uygulamayı durdur (dev/standalone), sonra:
tar -czf /tmp/nof-pgdata-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C db pgdata
sha256sum /tmp/nof-pgdata-backup-*.tar.gz > /tmp/backup.sha   # bütünlük için
```

## 2. Restore tatbikatı (2026-11-10, gerçek koşu)

| Adım | Komut | Sonuç |
|---|---|---|
| Backup | `tar -czf /tmp/nof-pgdata-backup-20261110-075335.tar.gz -C db pgdata` | 4.8 MB, sha256 `1fbb0b61…4cd7b9e` |
| Restore | `tar -xzf … -C /tmp/restore-pgdata --strip-components=1` | dizin yapısı tam |
| Doğrulama | `PORT=3101 APP_URL=http://localhost:3101 PGLITE_DATA_DIR=/tmp/restore-pgdata bun .next/standalone/server.js` | `/api/health` → `{"ok":true}` |
| Veri bütünlüğü | `/blog` 200; DB sorgusu: 7 yazı published, 2 kullanıcı | birebir aynı |
| Medya checksum | `find public/uploads -type f -exec sha256sum {} + > tests/perf/media-checksums.txt` | 15/15 dosya listelendi |

> Not: restore'da `PGLITE_DATA_DIR` **mutlak** verilmiştir — `src/server/db/index.ts`
> mutlak yolu aynen kullanır (HATA-001 düzeltmesi sonrası).

## 3. Neon / PostgreSQL (production) yedekleme

Sandbox'ta `pg_dump` ikilisi yoktur; production'da Neon console veya lokal psql ile:

```bash
# Yedek (lokal makinede psql kuruluysa)
pg_dump "$DATABASE_URL" --format=custom --file nof-db-$(date +%F).dump
# Restore (yeni boş veritabanına)
pg_restore --clean --if-exists --dbname "$NEW_DATABASE_URL" nof-db-YYYY-AA-GG.dump
# Doğrulama
psql "$NEW_DATABASE_URL" -c "select status, count(*) from blog_posts group by status;"
```

Neon branch/PITR: Neon console → Restore → istenen zamana geri dön; `DATABASE_URL`
yeni branch URL'ine çevrilir, yeniden deploy gerekmez (Vercel env güncellemesi).

## 4. Medya (storage) yedekleme

- **local provider**: `public/uploads/` dizinini kopyala + `tests/perf/media-checksums.txt`
  ile sha256 doğrulaması yap (bu depoda örneği var).
- **vercel-blob provider**: Blob store versiyonlanır; media_assets tablosundaki
  `public_url` + `checksum` sütunları ile karşılaştır. Bulk indirme: Blob console veya
  `@vercel/blob` list API.
- DB ile medya bütünlüğü: `media_assets.checksum` × dosyanın gerçek sha256'sı.

## 5. Geri dönüş (rollback) senaryoları

| Senaryo | İşlem |
|---|---|
| Kötü deploy | Vercel → Deployments → son sağlıklı sürüm **Promote to Production** |
| DB bozulması | Yukarıdaki restore akışı; pglite için tar'dan geri aç, postgres için pg_restore |
| Kötü migration | `drizzle` migration'ları ileriye yazılır; acil durumda yedekten restore (migration'ları da geri alır) |
| Medya kaybı | uploads dizini/Blob restore + checksum doğrulaması |
