/**
 * Faz 7: Görsel piksel-diff otomasyonu.
 * tests/visual/parity/app-*.png ↔ tests/visual/baseline/ref-*.png karşılaştırır.
 * Kullanım: bun scripts/visual-diff.mjs
 * Çıktı: tests/visual/diff/*.png + tests/visual/diff/report.md
 *
 * Not: app-* uygulamanın, ref-* referans siteden alınan baseline görüntülerdir;
 * galeri randomizasyonu ve canvas animasyonu nedeniyle bazı çiftlerde yüksek fark
 * beklenir — oranlar bilgilendirme amaçlıdır, CI kapısı değildir.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = "/home/z/my-project";
const PARITY = join(ROOT, "tests/visual/parity");
const BASELINE = join(ROOT, "tests/visual/baseline");
const OUT = join(ROOT, "tests/visual/diff");

mkdirSync(OUT, { recursive: true });

const appShots = readdirSync(PARITY).filter((f) => f.startsWith("app-") && f.endsWith(".png")).sort();
const results = [];

for (const app of appShots) {
  const ref = "ref-" + app.slice(4);
  const refPath = join(BASELINE, ref);
  if (!existsSync(refPath)) {
    results.push({ app, ref, status: "ref-yok", diffPct: null });
    continue;
  }
  const imgA = PNG.sync.read(readFileSync(join(PARITY, app)));
  const imgB = PNG.sync.read(readFileSync(refPath));
  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    results.push({ app, ref, status: "boyut-farklı", diffPct: null, size: `${imgA.width}x${imgA.height} vs ${imgB.width}x${imgB.height}` });
    continue;
  }
  const diff = new PNG({ width: imgA.width, height: imgA.height });
  const n = pixelmatch(imgA.data, imgB.data, diff.data, imgA.width, imgA.height, { threshold: 0.1 });
  const pct = (n / (imgA.width * imgA.height)) * 100;
  writeFileSync(join(OUT, "diff-" + app.slice(4)), PNG.sync.write(diff));
  results.push({ app, ref, status: "ok", diffPct: Number(pct.toFixed(2)), size: `${imgA.width}x${imgA.height}` });
}

const md = [
  "# Görsel Piksel-Diff Raporu",
  "",
  `Üretim: ${new Date().toISOString()} · threshold 0.1 · pixelmatch`,
  "app-* = uygulama (prod standalone), ref-* = referans baseline. Galeride randomizasyon + canvas animasyonu olduğundan o sahnelerde yüksek fark doğaldır.",
  "",
  "| Uygulama | Referans | Boyut | Fark % | Durum |",
  "|---|---|---|---|---|",
  ...results.map(
    (r) =>
      `| ${r.app} | ${r.ref} | ${r.size ?? "-"} | ${r.diffPct === null ? "-" : "%" + r.diffPct} | ${r.status} |`,
  ),
  "",
  `Toplam: ${results.length} çift · karşılaştırılan: ${results.filter((r) => r.status === "ok").length} · ref yok: ${results.filter((r) => r.status === "ref-yok").length} · boyut farklı: ${results.filter((r) => r.status === "boyut-farklı").length}`,
].join("\n");
writeFileSync(join(OUT, "report.md"), md);
console.log(md);
