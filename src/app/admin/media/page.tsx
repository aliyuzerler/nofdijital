import { desc, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { mediaAssets } from "@/server/db/schema";
import { requireUser } from "@/server/auth/guards";
import { MediaManager } from "@/components/admin/media-manager";
import type { MediaRow } from "@/features/admin/media/actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Medya" };

export default async function AdminMediaPage() {
  await requireUser();
  const db = await getDb();
  const rows = await db.select().from(mediaAssets).where(isNull(mediaAssets.deletedAt)).orderBy(desc(mediaAssets.createdAt)).limit(200);

  const initialRows: MediaRow[] = rows.map((r) => ({
    id: r.id,
    publicUrl: r.publicUrl,
    originalFilename: r.originalFilename,
    storedFilename: r.storedFilename,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    width: r.width,
    height: r.height,
    altText: r.altText,
    title: r.title,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Medya</h1>
        <p className="mt-1 text-sm text-neutral-500">Görsel kütüphanesi; yüklenen dosyalar public/uploads altında saklanır.</p>
      </header>
      <MediaManager initialRows={initialRows} />
    </div>
  );
}
