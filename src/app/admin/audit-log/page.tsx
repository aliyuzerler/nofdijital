import { desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { requireUser } from "@/server/auth/guards";
import { Forbidden } from "@/components/admin/forbidden";
import { formatTrDateSafe } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = { title: "Denetim Kaydı" };

const ACTION_LABEL: Record<string, string> = {
  "post.create": "Yazı oluşturma",
  "post.update": "Yazı güncelleme",
  "post.publish": "Yayınlama",
  "post.status": "Durum değişikliği",
  "post.delete": "Yazı silme",
  "media.update": "Medya güncelleme",
  "media.delete": "Medya silme",
  "section.update": "Bölüm güncelleme",
  "service.update": "Hizmet güncelleme",
  "process.create": "Süreç adımı ekleme",
  "process.update": "Süreç adımı güncelleme",
  "process.delete": "Süreç adımı silme",
  "gallery.update": "Galeri güncelleme",
  "nav.create": "Menü ekleme",
  "nav.update": "Menü güncelleme",
  "nav.delete": "Menü silme",
  "message.read": "Mesaj okundu",
  "message.archive": "Mesaj arşivleme",
  "settings.update": "Ayar güncelleme",
  "page.seo": "Sayfa SEO",
};

export default async function AdminAuditLogPage() {
  const user = await requireUser();
  if (user.role !== "owner") return <Forbidden role={user.role} />;

  const db = await getDb();
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Denetim Kaydı</h1>
        <p className="mt-1 text-sm text-neutral-500">Son 100 yönetim işlemi.</p>
      </header>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="admin-scroll max-h-[40rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-neutral-50">
              <TableRow>
                <TableHead>Zaman</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>İşlem</TableHead>
                <TableHead className="hidden md:table-cell">Varlık</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-neutral-500">
                    Kayıt yok.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm text-neutral-600">{formatTrDateSafe(r.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      <p className="font-medium text-neutral-900">{r.actorEmail ?? "—"}</p>
                      <p className="text-xs text-neutral-400">{r.actorId ?? ""}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#9335FF]/30 bg-[#9335FF]/5 text-[#8426F2]">
                        {ACTION_LABEL[r.action] ?? r.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-neutral-500 md:table-cell">
                      {r.entityType} · {(r.entityId ?? "—").slice(0, 8)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
