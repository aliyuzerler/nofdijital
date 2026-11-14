/**
 * Uzak DB durumunu inceler (tablo listesi + migration kayıtları).
 * Kullanım: DATABASE_URL="postgresql://..." bun scripts/db/inspect-remote.ts
 */
import "dotenv/config";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL gerekli");
  process.exit(1);
}
// İnceleme için pooled bağlantı sorun değil; read-only sorgular.
const client = postgres(url, { prepare: false, max: 1 });
try {
  const tables = await client`
    select table_schema, table_name from information_schema.tables
    where table_type = 'BASE TABLE'
      and table_schema not in ('pg_catalog', 'information_schema')
    order by table_schema, table_name`;
  console.log("TABLOLAR:", tables.map((t) => `${t.table_schema}.${t.table_name}`).join(", ") || "(yok)");

  const migTable = tables.find((t) => t.table_name === "__drizzle_migrations");
  if (migTable) {
    const qualified = `${migTable.table_schema}.__drizzle_migrations`;
    const migs = await client.unsafe(
      `select to_timestamp((created_at/1000)::double precision) as applied_at, hash from ${qualified} order by created_at asc`,
    );
    console.log(`UYGULANMIS MIGRATION (${qualified}): ${migs.length} adet`);
    for (const m of migs) console.log("  -", m.applied_at?.toISOString?.() ?? m.applied_at, m.hash);
  } else {
    console.log("UYGULANMIS MIGRATION: yok (drizzle tablosu bulunamadi)");
  }

  const hasPress = tables.some((t) => t.table_name === "press_items");
  console.log("press_items tablosu:", hasPress ? "VAR" : "YOK");

  if (hasPress) {
    const secs = await client`
      SELECT ps.section_key, ps.title, ps.position, ps.is_visible
      FROM public.page_sections ps
      JOIN public.pages p ON p.id = ps.page_id
      WHERE p.slug = 'home' AND ps.section_key IN ('blog-preview', 'press-preview')
      ORDER BY ps.position`;
    for (const s of secs) {
      console.log(`ANASAYFA BOLUMU: ${s.section_key} | "${s.title}" | pos=${s.position} | visible=${s.is_visible}`);
    }
    const pressCount = await client`SELECT count(*)::int AS n FROM public.press_items`;
    console.log("press_items kayit sayisi:", pressCount[0].n);
  }
} finally {
  await client.end();
}
