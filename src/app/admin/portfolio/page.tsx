import { requireUser } from "@/server/auth/guards";
import { listGalleryAdmin, listGalleryMediaOptions } from "@/features/admin/portfolio/actions";
import { ensureSiteContentSeeded } from "@/features/admin/bootstrap-data";
import { PortfolioManager } from "@/components/admin/portfolio-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Portfolyo" };

export default async function AdminPortfolioPage() {
  await requireUser();
  // DB seed edilmemişse site galerisindeki 14 görsel otomatik yazılır.
  await ensureSiteContentSeeded();
  const [rows, mediaOptions] = await Promise.all([listGalleryAdmin(), listGalleryMediaOptions()]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Portfolyo Galerisi</h1>
        <p className="mt-1 text-sm text-neutral-500">Stüdyo duvarındaki görselleri yönetin: düzenleyin, değiştirin, ekleyin veya çıkarın.</p>
      </header>
      <PortfolioManager rows={rows} mediaOptions={mediaOptions} />
    </div>
  );
}
