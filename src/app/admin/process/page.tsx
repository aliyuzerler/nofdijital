import { requireUser } from "@/server/auth/guards";
import { listProcessAdmin } from "@/features/admin/process/actions";
import { ProcessManager } from "@/components/admin/process-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Süreç" };

export default async function AdminProcessPage() {
  await requireUser();
  const rows = await listProcessAdmin();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Süreç Adımları</h1>
        <p className="mt-1 text-sm text-neutral-500">Ana sayfadaki çalışma süreci adımlarını yönetin.</p>
      </header>
      <ProcessManager rows={rows} />
    </div>
  );
}
