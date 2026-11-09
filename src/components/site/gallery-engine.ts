/** Kaynak galeri motoru — mulberry32 + band yerleşimi + AABB çakışma kontrolü.
 *  reference/nof_digital.html içinden satır bazında taşınmıştır; deterministik seed korunur. */

export interface PlacedPhoto {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
}

export function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function placeScene(
  ids: readonly number[],
  W: number,
  H: number,
  seed: number,
  mob: boolean,
  ar: readonly number[],
): PlacedPhoto[] {
  const r = mulberry32(seed);
  const pad = mob ? 12 : 40;
  const top = 150;
  const bot = mob ? 22 : 34;
  const AX = pad,
    AY = top,
    AW = W - 2 * pad,
    AH = H - top - bot,
    n = ids.length;

  const bands = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [bands[i], bands[j]] = [bands[j], bands[i]];
  }

  const out: PlacedPhoto[] = [];
  const lim = mob ? 0.12 : 0.05;

  ids.forEach((id, k) => {
    const ar0 = ar[id]!;
    let sc = 1;
    let best: PlacedPhoto | null = null;

    for (let t = 0; t < 1500; t++) {
      if (t && t % 120 === 0) sc *= 0.92;

      let w: number, h: number;
      const arV = Math.min(
        ar0 > 1 ? 1.7 : 1.05,
        Math.max(ar0 > 1 ? 1.25 : 0.6, ar0 * (0.78 + r() * 0.5) * (mob && ar0 < 1 ? 1.15 : 1)),
      );
      if (mob) {
        w = AW * (0.27 + r() * 0.13) * sc;
        h = w / arV;
      } else {
        h = AH * (0.3 + r() * 0.3) * sc;
        w = h * arV;
        if (w > AW * 0.26) {
          w = AW * 0.26 * (0.9 + r() * 0.1);
          h = w / arV;
        }
      }

      let x: number, y: number;
      const bw = AW / n;
      if (mob) {
        y = AY + ((bands[k]! + 0.5) * AH) / n - h / 2 + (r() - 0.5) * ((AH / n) * 0.8);
        x = AX + r() * (AW - w);
      } else {
        x = AX + ((bands[k]! + 0.5) * bw - w) / 2 + (r() - 0.5) * bw * 0.7;
        y = AY + r() * (AH - h);
      }
      x = Math.max(AX, Math.min(AX + AW - w, x));
      y = Math.max(AY, Math.min(AY + AH - h, y));

      const rot = (r() - 0.5) * (mob ? 9 : 11);
      const m = Math.abs(rot) * 0.004;
      const c: PlacedPhoto = { id, x: x + w * m, y: y + h * m, w: w * (1 - 2 * m), h: h * (1 - 2 * m), rot };

      if (!best) best = c;

      let ok = true;
      for (const o of out) {
        const ox = Math.min(c.x + c.w, o.x + o.w) - Math.max(c.x, o.x);
        const oy = Math.min(c.y + c.h, o.y + o.h) - Math.max(c.y, o.y);
        if (ox > 0 && oy > 0 && ox * oy > lim * Math.min(c.w * c.h, o.w * o.h)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        best = c;
        break;
      }
    }
    out.push(best!);
  });

  return out;
}
