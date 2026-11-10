/**
 * Production güvenlik temizliği (idempotent, tek PGlite oturumu).
 * Koşum: sunucu (dev/standalone) KAPALIYKEN → bun scripts/db/prod-cleanup.ts
 * SIRA: ÖNCE bu script, SONRA gerçek admin oluşturma (create-editor.ts).
 *
 * Kaldırır:
 *  - e2e-* test kullanıcıları (+ credential hesapları + oturumları) — bilinen
 *    şifreli test hesapları canlı ortamda güvenlik riskidir
 *  - *@nofdigital.local Adresli ŞİFRELİ hesaplar (oturumla kalan geçici admin'ler;
 *    seed'in şifresiz placeholder'ı owner@nofdigital.local DOKUNULMAZ kalır —
 *    production'da bootstrap yalnız credential hesabı hiç yokken açılır)
 *  - e2e-contact@… test iletişim kayıtları
 *  - e2e-smoke-* test blog yazıları (+ revizyonları)
 * Dokunmaz: seed içeriği (7 hizmet, galeri, süreç, blog içerikleri — site verisi).
 */
import { PGlite } from "@electric-sql/pglite";
import { resolve } from "node:path";

const dataDir = resolve(process.env.PGLITE_DATA_DIR ?? "db/pgdata");
const pg = new PGlite(dataDir);

try {
  // 1) Bilinen/şifreli test ve geçici hesaplar: e2e-* + şifreli *.local hesapları
  const users = await pg.query<{ id: string; email: string }>(
    `select u.id, u.email from "user" u
      where u.email like 'e2e-%'
        or (u.email like '%@nofdigital.local' and exists (
          select 1 from "account" a where a.user_id = u.id and a.provider_id = 'credential'))`,
  );
  for (const u of users.rows) {
    await pg.query(`delete from "session" where user_id = $1`, [u.id]);
    await pg.query(`delete from "account" where user_id = $1`, [u.id]);
    await pg.query(`delete from "user" where id = $1`, [u.id]);
    console.log("test kullanıcısı silindi:", u.email);
  }
  if (!users.rows.length) console.log("e2e test kullanıcısı yok");

  // 2) e2e iletişim formu test kayıtları
  const msgs = await pg.query<{ id: string }>(
    `select id from contact_submissions where email like 'e2e-%'`,
  );
  for (const m of msgs.rows) {
    await pg.query(`delete from contact_submissions where id = $1`, [m.id]);
  }
  console.log("test iletişim kaydı silindi:", msgs.rows.length);

  // 3) e2e-smoke blog yazıları
  const posts = await pg.query<{ id: string; slug: string }>(
    `select id, slug from blog_posts where slug like 'e2e-smoke-%'`,
  );
  for (const p of posts.rows) {
    await pg.query(`delete from blog_revisions where post_id = $1`, [p.id]).catch(() => {});
    await pg.query(`delete from blog_posts where id = $1`, [p.id]);
    console.log("test yazısı silindi:", p.slug);
  }
  if (!posts.rows.length) console.log("e2e-smoke yazısı yok");

  // 4) Özet: kalan şifreli (credential) hesaplar
  const remaining = await pg.query<{ email: string; role: string }>(
    `select u.email, u.role::text as role from "account" a join "user" u on u.id = a.user_id where a.provider_id = 'credential'`,
  );
  console.log("kalan şifreli hesaplar:", remaining.rows.map((r) => `${r.email} (${r.role})`).join(", ") || "YOK");
} finally {
  await pg.close();
}
