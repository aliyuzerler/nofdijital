import { requireUser } from "@/server/auth/guards";
import { getHomeSectionsAdmin, ensureStatsSection } from "@/features/admin/home/actions";
import { ensureSiteContentSeeded } from "@/features/admin/bootstrap-data";
import { HomeSections } from "@/components/admin/home-sections";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ana Sayfa Bölümleri" };

export default async function AdminHomePageSectionsPage() {
  await requireUser();
  // DB seed edilmemişse (ör. üretimde ilk açılış) sitedeki içerik otomatik yazılır.
  await ensureSiteContentSeeded();
  let data = await getHomeSectionsAdmin();
  // Seed edilmemiş eski DB'lerde stats bölümü yoktur; editörün görünmesi için
  // burada idempotent olarak oluşturulur (admin panelini açan kullanıcı tetikler).
  if (data && !data.sections.some((s) => s.sectionKey === "stats")) {
    await ensureStatsSection();
    data = await getHomeSectionsAdmin();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Ana Sayfa Bölümleri</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Bölüm metinlerini ve istatistik sayaçlarını düzenleyin. Görseller ve sahneler gibi diğer yapısal alanlar korunur.
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
