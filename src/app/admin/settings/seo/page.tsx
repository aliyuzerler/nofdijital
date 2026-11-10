import { requireUser } from "@/server/auth/guards";
import { listPageSeo } from "@/features/admin/settings/actions";
import { PageSeoList } from "@/components/admin/page-seo-list";
import { Forbidden } from "@/components/admin/forbidden";

export const dynamic = "force-dynamic";

export const metadata = { title: "SEO" };

export default async function AdminSeoSettingsPage() {
  const user = await requireUser();
  if (user.role !== "owner") return <Forbidden role={user.role} />;
  const rows = await listPageSeo();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Sayfa SEO</h1>
        <p className="mt-1 text-sm text-neutral-500">Sayfa başlıkları, açıklamaları ve canonical adresleri.</p>
      </header>
      <PageSeoList rows={rows} />
    </div>
  );
}
