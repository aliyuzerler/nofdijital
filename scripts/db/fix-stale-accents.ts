/**
 * Prod vurgu mutabakatı (deploy sırasında bir kez etkili, idempotent, güvenli).
 *
 * Ortam değişkenleri: Vercel/Neon gerçek env değişkenleriyle çalışır — bu script
 * BİLİNÇLİ olarak dotenv yüklemez (dotenv package.json'da tanımlı değil; Vercel
 * build'inde "Cannot find module 'dotenv/config'" ile build düşer). Yerel
 * koşumlar env'yi açıkça geçirir (bkz. scripts/verify-accent-migration.mjs).
 *
 * Bağlam (kullanıcı talebi 13.11.2026): canlı DB'de Süreç kartının accent değeri
 * eski "yol" olarak kayıtlı — bu yüzden site "net bir yol." yerine yalnız "yol"
 * kelimesini vurguluyor. Neon'a buradan erişilemediği için düzeltme, Vercel
 * build'inde (DATABASE_DRIVER=postgres + DATABASE_URL mevcut) çalışır.
 *
 * KURALLAR — yalnız BİLİNEN ESKİ/BOŞ değerler düzeltilir, admin'in sonradan
 * girdiği diğer değerler ASLA ezilmez:
 *   process → accent boş veya "yol"/"yol." ise          → "net bir yol."
 *   about   → accent boş veya "stratejiyle"/"stratejiyle," ise
 *                                                      → "Yaratıcılığı stratejiyle,"
 *
 * GÜVENLİK: script HİÇBİR KOŞULDA build'i düşürmez — her hatada uyarı verip
 * exit 0 ile çıkar (modül bulunamazsa bile build adımı "|| echo" ile telafi
 * eder). Yerel/pglite'ta varsayılan olarak sessizce atlar (yerel DB zaten
 * güncel; zorlamak için ACCENT_FIX_FORCE=1 — yalnız test amaçlı).
 */

// Dosyayı TS modülü yapar (dotenv kaldırılınca statik import kalmadı;
// top-level await modül gerektirir).
export {};

const ACCENT_ABOUT = "Yaratıcılığı stratejiyle,";
const ACCENT_PROCESS = "net bir yol.";
const STALE = {
  about: /^\s*stratejiyle\s*,?\s*$/i,
  process: /^\s*yol\s*\.?\s*$/i,
};
const WANT: Record<string, string> = { about: ACCENT_ABOUT, process: ACCENT_PROCESS };

const driver = process.env.DATABASE_DRIVER ?? "pglite";
const force = process.env.ACCENT_FIX_FORCE === "1";

if (driver !== "postgres" && !force) {
  console.log("fix-stale-accents: pglite modu — atlandı (build güvenliği).");
  process.exit(0);
}

try {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const { drizzle: drizzlePgJs } = await import("drizzle-orm/postgres-js");
  const postgres = (await import("postgres")).default;
  const { eq, inArray } = await import("drizzle-orm");
  const { resolve } = await import("node:path");
  const { pages, pageSections } = await import("../../src/server/db/schema");

  type Db = ReturnType<typeof drizzlePglite> | ReturnType<typeof drizzlePgJs>;
  let db: Db;
  let close: () => Promise<void>;

  if (driver === "postgres") {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.warn("fix-stale-accents: DATABASE_URL yok — atlandı.");
      process.exit(0);
    }
    const client = postgres(url, { prepare: false });
    db = drizzlePgJs(client);
    close = async () => client.end();
  } else {
    const dataDir = resolve(process.cwd(), process.env.PGLITE_DATA_DIR ?? "db/pgdata");
    const pg = new PGlite(dataDir);
    db = drizzlePglite(pg);
    close = async () => pg.close();
  }

  const home = (await db.select().from(pages).where(eq(pages.slug, "home")).limit(1))[0];
  if (!home) {
    console.warn("fix-stale-accents: 'home' sayfası yok — atlandı.");
    await close();
    process.exit(0);
  }

  const rows = await db
    .select()
    .from(pageSections)
    .where(inArray(pageSections.sectionKey, Object.keys(WANT)));

  let changed = 0;
  for (const r of rows) {
    const want = WANT[r.sectionKey];
    if (!want) continue;
    const body = (r.bodyJson ?? {}) as Record<string, unknown>;
    const cur = typeof body.accent === "string" ? body.accent.trim() : "";
    const stale = cur === "" || STALE[r.sectionKey]!.test(cur);
    if (!stale || cur === want) {
      console.log(`fix-stale-accents: ${r.sectionKey} korundu ("${cur || "(boş)"}")`);
      continue;
    }
    await db
      .update(pageSections)
      .set({ bodyJson: { ...body, accent: want } })
      .where(eq(pageSections.id, r.id));
    changed++;
    console.log(`fix-stale-accents: ${r.sectionKey} "${cur || "(boş)"}" → "${want}"`);
  }

  await close();
  console.log(`fix-stale-accents: bitti (${changed} satır güncellendi).`);
  process.exit(0);
} catch (err) {
  // Build asla düşmesin: veri düzeltmesi kozmetiktir.
  console.warn("fix-stale-accents: hata — atlandı:", err instanceof Error ? err.message : err);
  process.exit(0);
}
