"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createNavItem, deleteNavItem, updateNavItem, type NavRow } from "@/features/admin/navigation/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FormState {
  label: string;
  href: string;
  position: number;
  target: "_self" | "_blank";
  isVisible: boolean;
}

const EMPTY: FormState = { label: "", href: "/", position: 0, target: "_self", isVisible: true };

export function NavigationManager({ rows }: { rows: NavRow[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<NavRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() {
    setTarget(null);
    setForm(EMPTY);
    setCreating(true);
  }

  function openEdit(row: NavRow) {
    setCreating(false);
    setTarget(row);
    setForm({ label: row.label, href: row.href, position: row.position, target: row.target === "_blank" ? "_blank" : "_self", isVisible: row.isVisible });
  }

  async function save() {
    setSaving(true);
    try {
      const res = target ? await updateNavItem({ id: target.id, ...form }) : await createNavItem(form);
      if (res.ok) {
        toast.success(target ? "Menü öğesi güncellendi." : "Menü öğesi eklendi.");
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

  async function remove(row: NavRow) {
    setDeletingId(row.id);
    try {
      const res = await deleteNavItem({ id: row.id });
      if (res.ok) {
        toast.success("Menü öğesi silindi.");
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
        <Button onClick={openCreate} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
          <Plus className="h-4 w-4" /> Yeni öğe
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="admin-scroll max-h-[36rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-neutral-50">
              <TableRow>
                <TableHead className="min-w-32">Etiket</TableHead>
                <TableHead>Hedef</TableHead>
                <TableHead className="hidden md:table-cell">Açılış</TableHead>
                <TableHead>Sıra</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-24" aria-label="İşlemler" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                    Menü öğesi bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-neutral-900">{r.label}</TableCell>
                    <TableCell className="text-sm text-neutral-600">{r.href}</TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">{r.target === "_blank" ? "Yeni sekme" : "Aynı sekme"}</TableCell>
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
                        <Button variant="ghost" size="icon" aria-label={`${r.label} düzenle`} onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={`${r.label} sil`} disabled={deletingId === r.id} onClick={() => void remove(r)}>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{target ? "Menü öğesini düzenle" : "Yeni menü öğesi"}</DialogTitle>
            <DialogDescription>Site üst menüsü. Hedef "/" ile başlamalı.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="n-label">Etiket</Label>
              <Input id="n-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-href">Hedef</Label>
              <Input id="n-href" value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/blog" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="n-pos">Sıra</Label>
                <Input id="n-pos" type="number" min={0} max={99} value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="n-target">Açılış</Label>
                <select
                  id="n-target"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value as FormState["target"] })}
                  className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
                >
                  <option value="_self">Aynı sekme</option>
                  <option value="_blank">Yeni sekme</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="n-vis" className="text-sm font-normal">
                Görünür
              </Label>
              <Switch id="n-vis" checked={form.isVisible} onCheckedChange={(v) => setForm({ ...form, isVisible: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setTarget(null), setCreating(false))}>
              Vazgeç
            </Button>
            <Button onClick={() => void save()} disabled={saving} className="bg-[#9335FF] text-white hover:bg-[#8426F2]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
