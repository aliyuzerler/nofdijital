"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, EyeOff, MoreHorizontal, Pencil, SendToBack, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePost, setPostStatus } from "@/features/admin/blog/actions";
import { formatTrDateSafe } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface BlogTableRow {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "scheduled" | "published" | "archived";
  category: string;
  publishedAt: string | null;
  updatedAt: string;
  readingMinutes: number;
}

const STATUS_LABEL: Record<BlogTableRow["status"], string> = {
  draft: "Taslak",
  scheduled: "Zamanlanmış",
  published: "Yayında",
  archived: "Arşiv",
};

function StatusBadge({ status }: { status: BlogTableRow["status"] }) {
  const cls =
    status === "published"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : status === "draft"
        ? "border-[#8254D8]/40 bg-[#8254D8]/10 text-[#7143C2]"
        : status === "scheduled"
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-neutral-200 bg-neutral-50 text-neutral-500";
  return <Badge variant="outline" className={cls}>{STATUS_LABEL[status]}</Badge>;
}

export function BlogTable({ rows }: { rows: BlogTableRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | BlogTableRow["status"]>("all");
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<BlogTableRow | null>(null);

  const filtered = useMemo(() => (filter === "all" ? rows : rows.filter((r) => r.status === filter)), [rows, filter]);

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success("İşlem tamamlandı.");
        router.refresh();
      } else {
        toast.error(res.error ?? "İşlem başarısız.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="bg-neutral-200/60">
          <TabsTrigger value="all">Tümü ({rows.length})</TabsTrigger>
          <TabsTrigger value="published">Yayında</TabsTrigger>
          <TabsTrigger value="draft">Taslak</TabsTrigger>
          <TabsTrigger value="scheduled">Zamanlanmış</TabsTrigger>
          <TabsTrigger value="archived">Arşiv</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="admin-scroll max-h-[36rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-neutral-50">
              <TableRow>
                <TableHead className="min-w-56">Başlık</TableHead>
                <TableHead className="hidden md:table-cell">Kategori</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="hidden md:table-cell">Yayın tarihi</TableHead>
                <TableHead className="w-12" aria-label="İşlemler" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-neutral-500">
                    Kayıt bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id} className={pending ? "opacity-60" : undefined}>
                    <TableCell className="max-w-72">
                      <p className="truncate font-medium text-neutral-900">{r.title}</p>
                      <p className="truncate text-xs text-neutral-400">/blog/{r.slug}</p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">{r.category || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">
                      {r.publishedAt ? formatTrDateSafe(r.publishedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`${r.title} için işlemler`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/blog/${r.id}`}>
                              <Pencil className="h-4 w-4" /> Düzenle
                            </Link>
                          </DropdownMenuItem>
                          {r.status === "published" ? (
                            <DropdownMenuItem onClick={() => runAction(() => setPostStatus({ id: r.id, status: "draft" }))}>
                              <EyeOff className="h-4 w-4" /> Yayından kaldır
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => runAction(() => setPostStatus({ id: r.id, status: "published" }))}>
                              <SendToBack className="h-4 w-4" /> Yayınla
                            </DropdownMenuItem>
                          )}
                          {r.status !== "archived" ? (
                            <DropdownMenuItem onClick={() => runAction(() => setPostStatus({ id: r.id, status: "archived" }))}>
                              <Archive className="h-4 w-4" /> Arşivle
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(r)}>
                            <Trash2 className="h-4 w-4" /> Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yazıyı sil</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.title}” yazısı silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Vazgeç</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                const target = deleteTarget;
                setDeleteTarget(null);
                if (target) runAction(() => deletePost({ id: target.id }));
              }}
            >
              <Trash2 className="h-4 w-4" /> Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
