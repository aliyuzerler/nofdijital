import { requireUser } from "@/server/auth/guards";
import { listGalleryAdmin } from "@/features/admin/portfolio/actions";
import { PortfolioManager } from "@/components/admin/portfolio-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Portfolyo" };

export default async function AdminPortfolioPage() {
  await requireUser();
  const rows = await listGalleryAdmin();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Portfolyo Galerisi</h1>
        <p className="mt-1 text-sm text-neutral-500">Çalışma duvarındaki görsellerin başlık, alt metin ve sırası.</p>
      </header>
      <PortfolioManager rows={rows} />
    </div>
  );
}
