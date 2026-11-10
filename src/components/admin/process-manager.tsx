"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createProcessStep, deleteProcessStep, updateProcessStep, type ProcessRow } from "@/features/admin/process/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FormState {
  title: string;
  description: string;
  position: number;
  isVisible: boolean;
}

const EMPTY: FormState = { title: "", description: "", position: 0, isVisible: true };

export function ProcessManager({ rows }: { rows: ProcessRow[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<ProcessRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setTarget(null);
    setForm(EMPTY);
    setCreating(true);
  }

  function openEdit(row: ProcessRow) {
    setCreating(false);
    setTarget(row);
    setForm({ title: row.title, description: row.description, position: row.position, isVisible: row.isVisible });
  }

  async function save() {
    setSaving(true);
    try {
      const res = target ? await updateProcessStep({ id: target.id, ...form }) : await createProcessStep(form);
      if (res.ok) {
        toast.success(target ? "Adım güncellendi." : "Adım eklendi.");
        setTarget(null);
        setCreating(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: ProcessRow) {
    setDeletingId(row.id);
    try {
      const res = await deleteProcessStep({ id: row.id });
      if (res.ok) {
        toast.success("Adım silindi.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setDeletingId(null);
    }
  }

  const open = creating || target !== null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-[#8254D8] text-white hover:bg-[#7143C2]">
          <Plus className="h-4 w-4" /> Yeni adım
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="admin-scroll max-h-[36rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-neutral-50">
              <TableRow>
                <TableHead className="min-w-48">Adım</TableHead>
                <TableHead>Sıra</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-24" aria-label="İşlemler" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-neutral-500">
                    Adım bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-neutral-900">{r.title}</p>
                      <p className="max-w-96 truncate text-xs text-neutral-400">{r.description}</p>
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
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" aria-label={`${r.title} düzenle`} onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`${r.title} sil`} disabled={deletingId === r.id} onClick={() => void remove(r)}>
                          {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
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

      <Dialog open={open} onOpenChange={(v) => !v && (setTarget(null), setCreating(false))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{target ? "Adımı düzenle" : "Yeni adım"}</DialogTitle>
            <DialogDescription>Süreç bölümündeki adımlar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-title">Başlık</Label>
              <Input id="p-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Açıklama</Label>
              <textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[#8254D8]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-pos">Sıra</Label>
                <Input id="p-pos" type="number" min={0} max={99} value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end justify-between gap-3 pb-1">
                <Label htmlFor="p-vis" className="text-sm font-normal">
                  Görünür
                </Label>
                <Switch id="p-vis" checked={form.isVisible} onCheckedChange={(v) => setForm({ ...form, isVisible: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setTarget(null), setCreating(false))}>
              Vazgeç
            </Button>
            <Button onClick={() => void save()} disabled={saving} className="bg-[#8254D8] text-white hover:bg-[#7143C2]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
