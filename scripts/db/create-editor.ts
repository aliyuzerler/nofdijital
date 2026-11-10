/**
 * Admin kullanıcı oluşturur (idempotent). Lokal PGlite VE uzak PostgreSQL (Neon) destekler.
 * Kullanım:
 *   bun scripts/db/create-editor.ts [email] [password] [ad] [owner|editor]              (lokal PGlite)
 *   DATABASE_DRIVER=postgres DATABASE_URL="postgresql://..." bun scripts/db/create-editor.ts <mail> <şifre> <ad> owner
 * NOT: PGlite tek yazıcıdır — dev/standalone sunucusu pgdata'yı tutarken ÇALIŞTIRMA (postgres modunda sorun yok).
 */
import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
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

/** PGlite ve postgres.js'i aynı query arayüzüne oturt. */
type Conn = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
  close(): Promise<void>;
};

const driver = process.env.DATABASE_DRIVER ?? "pglite";
let conn: Conn;

if (driver === "postgres") {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL gerekli (DATABASE_DRIVER=postgres).");
    process.exit(1);
  }
  const sql = postgres(url, { prepare: false, max: 1 });
  conn = {
    async query<T>(text: string, params?: unknown[]) {
      const rows = await sql.unsafe(text, (params ?? []) as never[]);
      return { rows: rows as unknown as T[] };
    },
    close: () => sql.end(),
  };
  console.log("postgres modu (DATABASE_URL), max=1, prepare=false");
} else {
  const dataDir = resolve(process.env.PGLITE_DATA_DIR ?? "db/pgdata");
  const pg = new PGlite(dataDir);
  conn = {
    query: (text, params) => pg.query(text, params),
    close: () => pg.close(),
  };
}

try {
  const hash = await hashPassword(password);
  const userId = randomUUID();
  const accountId = randomUUID();

  // Var olan kullanıcıyı temizle (idempotent)
  const old = await conn.query<{ id: string }>("select id from \"user\" where email = $1", [email]);
  if (old.rows.length) {
    await conn.query("delete from \"user\" where id = $1", [old.rows[0]!.id]);
    console.log("eski kullanıcı silindi:", email);
  }

  await conn.query(
    `insert into "user" (id, name, email, email_verified, role, is_active, created_at, updated_at)
     values ($1, $2, $3, true, $4::user_role, true, now(), now())`,
    [userId, name, email, role],
  );
  await conn.query(
    `insert into "account" (id, user_id, account_id, provider_id, password, created_at, updated_at)
     values ($1, $2, $3, 'credential', $4, now(), now())`,
    [accountId, userId, userId, hash], // better-auth credential hesapta accountId = user.id (sign-in.mjs:318)
  );
  console.log("OK kullanıcı oluşturuldu:", email, "| rol:", role, "| sürücü:", driver);
} finally {
  await conn.close();
}
