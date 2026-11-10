import { requireUser } from "@/server/auth/guards";
import { getGeneralSettings } from "@/features/admin/settings/actions";
import { GeneralSettingsForm } from "@/components/admin/general-settings-form";
import { Forbidden } from "@/components/admin/forbidden";

export const dynamic = "force-dynamic";

export const metadata = { title: "Genel Ayarlar" };

export default async function AdminGeneralSettingsPage() {
  const user = await requireUser();
  if (user.role !== "owner") return <Forbidden role={user.role} />;
  const settings = await getGeneralSettings();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Genel Ayarlar</h1>
        <p className="mt-1 text-sm text-neutral-500">İletişim ve sosyal medya bilgileri; WhatsApp butonu ve footer bu değerleri kullanır.</p>
      </header>
      {settings ? (
        <GeneralSettingsForm initial={settings} />
      ) : (
        <p className="py-12 text-center text-sm text-neutral-500">Ayarlar yüklenemedi.</p>
      )}
    </div>
  );
}
