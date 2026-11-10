import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { resolve } from "node:path";
/** Dev verisini temizler (migration bookkeeping korunur). */
const dataDir = resolve(process.cwd(), process.env.PGLITE_DATA_DIR ?? "db/pgdata");
const pg = new PGlite(dataDir);
const tables = [
  "blog_post_tags", "blog_tags", "blog_posts", "blog_categories",
  "portfolio_images", "portfolio_projects", "page_sections", "pages",
  "contact_submissions", "content_revisions", "audit_logs", "url_redirects",
  "services", "process_steps", "navigation_items", "media_assets",
  "site_settings", "session", "account", "verification", "user",
];
for (const t of tables) {
  await pg.exec(`TRUNCATE TABLE ${t} CASCADE;`);
}
await pg.close();
console.log("Dev verisi temizlendi.");
