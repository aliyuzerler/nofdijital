import { requireUser } from "@/server/auth/guards";
import { listServicesAdmin } from "@/features/admin/services/actions";
import { ServicesManager } from "@/components/admin/services-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Hizmetler" };

export default async function AdminServicesPage() {
  await requireUser();
  const rows = await listServicesAdmin();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Hizmetler</h1>
        <p className="mt-1 text-sm text-neutral-500">Ana sayfadaki hizmet kartlarını yönetin.</p>
      </header>
      <ServicesManager rows={rows} />
    </div>
  );
}
