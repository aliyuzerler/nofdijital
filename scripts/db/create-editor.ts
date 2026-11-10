/**
 * Admin test kullanıcısı oluşturur (idempotent). Faz 7 RBAC E2E ve lokal kurulum için.
 * Kullanım: bun scripts/db/create-admin-user.ts [email] [password] [ad] [owner|editor]
 * NOT: PGlite tek yazıcıdır — dev/standalone sunucusu pgdata'yı tutarken ÇALIŞTIRMA.
 */
import { PGlite } from "@electric-sql/pglite";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

const email = (process.argv[2] ?? "editor@nofdigital.local").toLowerCase();
const password = process.argv[3] ?? "EditorE2E123!";
const name = process.argv[4] ?? "Editor Test";
const role = process.argv[5] === "owner" ? "owner" : "editor";

if (password.length < 10) {
  console.error("Şifre en az 10 karakter olmalı.");
  process.exit(1);
}

const dataDir = resolve(process.env.PGLITE_DATA_DIR ?? "db/pgdata");
const pg = new PGlite(dataDir);

try {
  const hash = await hashPassword(password);
  const userId = randomUUID();
  const accountId = randomUUID();

  // Var olan editor'ü temizle (idempotent)
  const old = await pg.query<{ id: string }>("select id from \"user\" where email = $1", [email]);
  if (old.rows.length) {
    await pg.query("delete from \"user\" where id = $1", [old.rows[0]!.id]);
    console.log("eski editor silindi:", email);
  }

  await pg.query(
    `insert into "user" (id, name, email, email_verified, role, is_active, created_at, updated_at)
     values ($1, $2, $3, true, $4::user_role, true, now(), now())`,
    [userId, name, email, role],
  );
  await pg.query(
    `insert into "account" (id, user_id, account_id, provider_id, password, created_at, updated_at)
     values ($1, $2, $3, 'credential', $4, now(), now())`,
    [accountId, userId, userId, hash], // better-auth credential hesapta accountId = user.id (sign-in.mjs:318)
  );
  console.log("OK kullanıcı oluşturuldu:", email, "| rol:", role, "| dataDir:", dataDir);
} finally {
  await pg.close();
}
