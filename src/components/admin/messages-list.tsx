"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { markMessageArchived, markMessageRead, type MessageRow } from "@/features/admin/messages/actions";
import { formatTrDateSafe } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function StatusBadge({ status }: { status: MessageRow["status"] }) {
  if (status === "new") {
    return (
      <Badge variant="outline" className="border-[#9335FF]/40 bg-[#9335FF]/10 text-[#8426F2]">
        Yeni
      </Badge>
    );
  }
  if (status === "read") {
    return (
      <Badge variant="outline" className="border-neutral-300 text-neutral-500">
        Okundu
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-neutral-200 bg-neutral-50 text-neutral-400">
      Arşiv
    </Badge>
  );
}

export function MessagesList({ rows }: { rows: MessageRow[] }) {
  const router = useRouter();
  const [detail, setDetail] = useState<MessageRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function openDetail(row: MessageRow) {
    setDetail(row);
    if (row.status === "new") void markRead(row.id, false);
  }

  async function markRead(id: string, refresh = true) {
    setBusyId(id);
    try {
      const res = await markMessageRead({ id });
      if (res.ok) {
        if (refresh) toast.success("Mesaj okundu olarak işaretlendi.");
        router.refresh();
        setDetail((d) => (d && d.id === id ? { ...d, status: "read" } : d));
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function archive(row: MessageRow) {
    setBusyId(row.id);
    try {
      const res = await markMessageArchived({ id: row.id });
      if (res.ok) {
        toast.success("Mesaj arşivlendi.");
        setDetail(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="admin-scroll max-h-[36rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-neutral-50">
              <TableRow>
                <TableHead className="min-w-40">Gönderen</TableHead>
                <TableHead className="hidden md:table-cell">Hizmet</TableHead>
                <TableHead className="hidden sm:table-cell">Mesaj</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                    Henüz mesaj yok.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} onClick={() => openDetail(r)} className="cursor-pointer">
                    <TableCell>
                      <p className="font-medium text-neutral-900">{r.name}</p>
                      <p className="text-xs text-neutral-400">{r.email}</p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">{r.serviceName ?? "—"}</TableCell>
                    <TableCell className="hidden max-w-56 truncate text-sm text-neutral-600 sm:table-cell">{r.message}</TableCell>
                    <TableCell className="text-sm text-neutral-600">{formatTrDateSafe(r.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={detail !== null} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>
              {detail?.email}
              {detail?.phone ? ` · ${detail.phone}` : ""}
              {detail?.createdAt ? ` · ${formatTrDateSafe(detail.createdAt)}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-4">
              {detail.serviceName ? (
                <p className="text-sm text-neutral-500">
                  Hizmet: <span className="font-medium text-neutral-700">{detail.serviceName}</span>
                </p>
              ) : null}
              <div className="admin-scroll max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
                {detail.message}
              </div>
              {detail.userAgentSummary ? <p className="truncate text-xs text-neutral-400">Tarayıcı: {detail.userAgentSummary}</p> : null}
            </div>
          ) : null}
          <DialogFooter>
            {detail && detail.status === "new" ? (
              <Button variant="outline" disabled={busyId === detail.id} onClick={() => void markRead(detail.id)}>
                {busyId === detail.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailOpen className="h-4 w-4" />} Okundu işaretle
              </Button>
            ) : null}
            <Button variant="outline" disabled={busyId !== null} onClick={() => detail && void archive(detail)}>
              <Archive className="h-4 w-4" /> Arşivle
            </Button>
            <Button onClick={() => setDetail(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
