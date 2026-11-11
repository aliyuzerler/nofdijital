"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createService, deleteService, updateService, type ServiceRow } from "@/features/admin/services/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ICON_OPTIONS = [
  { value: "share", label: "Share (Paylaşım)" },
  { value: "search", label: "Search (SEO/Analiz)" },
  { value: "mega", label: "Megaphone (Reklam)" },
  { value: "cam", label: "Camera (Fotoğraf)" },
  { value: "vid", label: "Video (Kurgu)" },
  { value: "film", label: "Film (Prodüksiyon)" },
  { value: "chart", label: "Chart (Performans)" },
];

const SPAN_OPTIONS = [
  { value: "c7", label: "Geniş (c7)" },
  { value: "c5", label: "Orta (c5)" },
  { value: "c4", label: "Kare (c4)" },
  { value: "c6", label: "Dikey (c6)" },
];

const EMPTY_FORM = { title: "", description: "", iconKey: "share", spanClass: "c4", styleVariant: "", position: 0, isVisible: true };

export function ServicesManager({ rows }: { rows: ServiceRow[] }) {
  const router = useRouter();
  // mode null: dialog kapalı; create: yeni hizmet; edit: mevcut satır
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [target, setTarget] = useState<ServiceRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ServiceRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openCreate() {
    setTarget(null);
    setForm({ ...EMPTY_FORM, position: rows.reduce((m, r) => Math.max(m, r.position), -1) + 1 });
    setMode("create");
  }

  function openEdit(row: ServiceRow) {
    setTarget(row);
    setForm({ title: row.title, description: row.description, iconKey: row.iconKey, spanClass: row.spanClass, styleVariant: row.styleVariant, position: row.position, isVisible: row.isVisible });
    setMode("edit");
  }

  async function save() {
    setSaving(true);
    try {
      const res =
        mode === "create"
          ? await createService({ ...form })
          : target
            ? await updateService({ id: target.id, ...form })
            : { ok: false as const, error: "Hizmet bulunamadı." };
      if (res.ok) {
        toast.success(mode === "create" ? "Hizmet eklendi." : "Hizmet güncellendi.");
        setMode(null);
        setTarget(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    try {
      const res = await deleteService({ id: deleting.id });
      if (res.ok) {
        toast.success("Hizmet silindi.");
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          {rows.length > 0 ? `${rows.length} hizmet` : "Henüz hizmet yok."}
        </p>
        <Button onClick={openCreate} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
          <Plus className="h-4 w-4" /> Yeni Hizmet
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="admin-scroll max-h-[36rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-neutral-50">
              <TableRow>
                <TableHead className="min-w-48">Hizmet</TableHead>
                <TableHead className="hidden md:table-cell">İkon</TableHead>
                <TableHead className="hidden md:table-cell">Yerleşim</TableHead>
                <TableHead>Sıra</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-20" aria-label="İşlemler" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                    Hizmet bulunamadı. Sağ üstteki “Yeni Hizmet” ile ekleyin.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-neutral-900">{r.title}</p>
                      <p className="max-w-80 truncate text-xs text-neutral-400">{r.description}</p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">{r.iconKey}</TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">
                      {r.spanClass}
                      {r.styleVariant ? ` · ${r.styleVariant}` : ""}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-neutral-600">{r.position}</TableCell>
                    <TableCell>
                      {r.isVisible ? (
                        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                          Görünür
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-neutral-200 text-neutral-400">
                          Gizli
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label={`${r.title} düzenle`} onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" aria-label={`${r.title} sil`} onClick={() => setDeleting(r)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={mode !== null} onOpenChange={(v) => !v && setMode(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Yeni Hizmet" : "Hizmeti düzenle"}</DialogTitle>
            <DialogDescription>Değişiklikler ana sayfa kartlarına anında yansır.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="svc-title">Başlık</Label>
              <Input id="svc-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-desc">Açıklama</Label>
              <textarea
                id="svc-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#9335FF]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="svc-icon">İkon</Label>
                <select
                  id="svc-icon"
                  value={form.iconKey}
                  onChange={(e) => setForm({ ...form, iconKey: e.target.value })}
                  className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
                >
                  {ICON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-span">Kart genişliği</Label>
                <select
                  id="svc-span"
                  value={form.spanClass}
                  onChange={(e) => setForm({ ...form, spanClass: e.target.value })}
                  className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
                >
                  {SPAN_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-variant">Stil varyantı</Label>
                <select
                  id="svc-variant"
                  value={form.styleVariant}
                  onChange={(e) => setForm({ ...form, styleVariant: e.target.value })}
                  className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
                >
                  <option value="">Normal</option>
                  <option value="dk">Koyu (dk)</option>
                  <option value="pu">Mor (pu)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-pos">Sıra</Label>
                <Input
                  id="svc-pos"
                  type="number"
                  min={0}
                  max={99}
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="svc-vis" className="text-sm font-normal">
                Ana sayfada görünür
              </Label>
              <Switch id="svc-vis" checked={form.isVisible} onCheckedChange={(v) => setForm({ ...form, isVisible: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)}>
              Vazgeç
            </Button>
            <Button onClick={() => void save()} disabled={saving} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hizmet silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” ana sayfadaki hizmet kartlarından kaldırılır. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteBusy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
