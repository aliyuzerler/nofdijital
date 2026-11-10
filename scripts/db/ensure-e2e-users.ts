/**
 * Playwright E2E için owner + editor test kullanıcılarını idempotent kurar.
 * Tek PGlite oturumuyla ikisini de yaratır (tek-yazıcı kısıtı: KISIT-001).
 * Koşum: sunucu (dev/standalone) KAPALIYKEN: bun scripts/db/ensure-e2e-users.ts
 */
import { PGlite } from "@electric-sql/pglite";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

const USERS = [
  { email: "e2e-owner@nofdigital.local", password: "OwnerE2E123!", name: "E2E Owner", role: "owner" },
  { email: "e2e-editor@nofdigital.local", password: "EditorE2E123!", name: "E2E Editor", role: "editor" },
] as const;

const dataDir = resolve(process.env.PGLITE_DATA_DIR ?? "db/pgdata");
const pg = new PGlite(dataDir);

try {
  for (const u of USERS) {
    const old = await pg.query<{ id: string }>(`select id from "user" where email = $1`, [u.email]);
    if (old.rows.length) {
      const uid = old.rows[0]!.id;
      await pg.query(`delete from "account" where user_id = $1`, [uid]);
      await pg.query(`delete from "user" where id = $1`, [uid]);
    }
    const userId = randomUUID();
    const hash = await hashPassword(u.password);
    await pg.query(
      `insert into "user" (id, name, email, email_verified, role, is_active, created_at, updated_at)
       values ($1, $2, $3, true, $4::user_role, true, now(), now())`,
      [userId, u.name, u.email, u.role],
    );
    // better-auth credential hesapta accountId = user.id (create-editor.ts notu)
    await pg.query(
      `insert into "account" (id, user_id, account_id, provider_id, password, created_at, updated_at)
       values ($1, $2, $3, 'credential', $4, now(), now())`,
      [randomUUID(), userId, userId, hash],
    );
    console.log("OK:", u.email, "→", u.role);
  }
  console.log("E2E kullanıcıları hazır. dataDir:", dataDir);
} finally {
  await pg.close();
}
