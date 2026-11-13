import { desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { pressItems } from "@/server/db/schema";
import { requireUser } from "@/server/auth/guards";
import { PressManager } from "@/components/admin/press-manager";
import type { PressRow } from "@/features/admin/press/actions";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Basında Biz" };

export default async function AdminPressPage() {
  await requireUser();

  let rows: PressRow[] = [];
  let dbError = false;
  try {
    const db = await getDb();
    const result = await db.select().from(pressItems).orderBy(desc(pressItems.createdAt));
    rows = result.map((r) => ({
      id: r.id,
      url: r.url,
      imageUrl: r.imageUrl,
      description: r.description,
      sourceName: r.sourceName,
      isVisible: r.isVisible,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    // press_items tablosu henüz yok (migration uygulanmamış) — panel yine de açılır.
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Basında Biz</h1>
        <p className="mt-1 text-sm text-neutral-500">
          NOF Digital hakkında çıkan basın haberlerini yönetin; sitede görsel + açıklama kartı olarak paylaşılır.
        </p>
      </header>
      {dbError ? (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-800">
            Veritabanında “press_items” tablosu bulunamadı. Migration henüz uygulanmamış olabilir; önce
            <code className="mx-1 rounded bg-amber-100 px-1">bun scripts/db/migrate-remote.ts</code>
            komutunu canlı veritabanı bağlantısıyla çalıştırın.
          </CardContent>
        </Card>
      ) : (
        <PressManager rows={rows} />
      )}
    </div>
  );
}
