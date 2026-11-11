"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { updateGalleryItem, type GalleryRow } from "@/features/admin/portfolio/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PortfolioManager({ rows }: { rows: GalleryRow[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<GalleryRow | null>(null);
  const [form, setForm] = useState({ caption: "", altText: "", position: 0, isVisible: true });
  const [saving, setSaving] = useState(false);

  function open(row: GalleryRow) {
    setTarget(row);
    setForm({ caption: row.caption ?? "", altText: row.altText, position: row.position, isVisible: row.isVisible });
  }

  async function save() {
    if (!target) return;
    setSaving(true);
    try {
      const res = await updateGalleryItem({ id: target.id, ...form });
      if (res.ok) {
        toast.success("Galeri görseli güncellendi.");
        setTarget(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="admin-scroll max-h-[36rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-neutral-50">
              <TableRow>
                <TableHead className="w-20">Görsel</TableHead>
                <TableHead className="min-w-40">Caption / Alt</TableHead>
                <TableHead className="hidden md:table-cell">Oran</TableHead>
                <TableHead>Sıra</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-12" aria-label="İşlemler" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                    Galeri görseli bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      { }
                      <img src={r.publicUrl} alt={r.altText} className="h-10 w-14 rounded-md object-cover" loading="lazy" />
                    </TableCell>
                    <TableCell>
                      <p className="max-w-64 truncate text-sm font-medium text-neutral-900">{r.caption ?? "—"}</p>
                      <p className="max-w-64 truncate text-xs text-neutral-400">{r.altText}</p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">{r.aspectRatio ?? "—"}</TableCell>
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
                      <Button variant="ghost" size="icon" aria-label="Görseli düzenle" onClick={() => open(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={target !== null} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Galeri görselini düzenle</DialogTitle>
            <DialogDescription>Oran bilgisi medya dosyasından gelir; salt okunurdur.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {target ? (
               
              <img src={target.publicUrl} alt={target.altText} className="max-h-40 w-full rounded-lg object-cover" />
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="g-caption">Caption</Label>
              <Input id="g-caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-alt">Alt metin</Label>
              <Input id="g-alt" value={form.altText} onChange={(e) => setForm({ ...form, altText: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="g-pos">Sıra</Label>
                <Input id="g-pos" type="number" min={0} max={999} value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end justify-between gap-3 pb-1">
                <Label htmlFor="g-vis" className="text-sm font-normal">
                  Görünür
                </Label>
                <Switch id="g-vis" checked={form.isVisible} onCheckedChange={(v) => setForm({ ...form, isVisible: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
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
