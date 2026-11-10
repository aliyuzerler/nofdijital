import { requireUser } from "@/server/auth/guards";
import { getHomeSectionsAdmin } from "@/features/admin/home/actions";
import { HomeSections } from "@/components/admin/home-sections";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ana Sayfa Bölümleri" };

export default async function AdminHomePageSectionsPage() {
  await requireUser();
  const data = await getHomeSectionsAdmin();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Ana Sayfa Bölümleri</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Bölüm metinlerini düzenleyin. Yapısal alanlar (görseller, sahneler, değer listeleri) korunur.
        </p>
      </header>
      {data ? (
        <HomeSections pageId={data.pageId} sections={data.sections} />
      ) : (
        <p className="py-12 text-center text-sm text-neutral-500">Ana sayfa kaydı bulunamadı.</p>
      )}
    </div>
  );
}
