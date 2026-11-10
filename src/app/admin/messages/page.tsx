import { requireUser } from "@/server/auth/guards";
import { listMessages } from "@/features/admin/messages/actions";
import { MessagesList } from "@/components/admin/messages-list";

export const dynamic = "force-dynamic";

export const metadata = { title: "Mesajlar" };

export default async function AdminMessagesPage() {
  await requireUser();
  const rows = await listMessages();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Mesajlar</h1>
        <p className="mt-1 text-sm text-neutral-500">İletişim formundan gelen talepler. Detay açıldığında okundu sayılır.</p>
      </header>
      <MessagesList rows={rows} />
    </div>
  );
}
