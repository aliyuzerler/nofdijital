import { requireUser } from "@/server/auth/guards";
import { listNavigationAdmin } from "@/features/admin/navigation/actions";
import { NavigationManager } from "@/components/admin/navigation-manager";
import { Forbidden } from "@/components/admin/forbidden";

export const dynamic = "force-dynamic";

export const metadata = { title: "Menü" };

export default async function AdminNavigationPage() {
  const user = await requireUser();
  if (user.role !== "owner") return <Forbidden role={user.role} />;
  const rows = await listNavigationAdmin();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Site Menüsü</h1>
        <p className="mt-1 text-sm text-neutral-500">Üst gezinme öğelerini yönetin.</p>
      </header>
      <NavigationManager rows={rows} />
    </div>
  );
}
