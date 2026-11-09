"use client";

import { useEffect, useRef } from "react";

/** Referans canvas arka plan motoru — 3B hissiyatlı tel-kafes sahne,
 *  scroll kontrollü kamera, paralaks, parçacıklar. Birebir port + tab görünürlüğü duraklatma. */

type ObjType = "lens" | "ring" | "frame" | "film" | "panel" | "play" | "gauge" | "bars" | "dots";

interface SceneObj {
  z: number;
  x: number;
  y: number;
  r: number;
  t: ObjType;
  rot: number;
  sp: number;
  ph?: number;
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function CanvasBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const cx = cv.getContext("2d");
    if (!cx) return;

    const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ZT = 3200;
    let W = 0,
      H = 0,
      dpr = 1,
      cam = 0,
      camT = 0,
      mx = 0,
      my = 0,
      raf = 0;

    function rs() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      cv!.width = W * dpr;
      cv!.height = H * dpr;
      cx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const R = mulberry32(7);
    const NO = window.innerWidth < 760 ? 30 : 54;
    const zone = (f: number): ObjType =>
      f < 0.14
        ? "lens"
        : f < 0.36
          ? (["film", "panel", "play"] as const)[Math.floor(R() * 3)]!
          : f < 0.62
            ? "frame"
            : f < 0.84
              ? (["gauge", "bars", "dots"] as const)[Math.floor(R() * 3)]!
              : "ring";

    const OB: SceneObj[] = [{ z: 420, x: 300, y: -30, r: 230, t: "lens", rot: 0, sp: 0.05 }];
    for (let i = 0; i < NO; i++) {
      const z = 150 + (i / NO) * ZT;
      const side = R() < 0.5 ? -1 : 1;
      OB.push({
        z,
        x: side * (220 + R() * 620),
        y: (R() - 0.5) * 760,
        r: 70 + R() * 130,
        t: zone(z / ZT),
        rot: (R() - 0.5) * 1.2,
        sp: (R() - 0.5) * 0.25,
        ph: R() * 6,
      });
    }
    const PT = Array.from({ length: window.innerWidth < 760 ? 50 : 110 }, () => ({
      x: (R() - 0.5) * 1800,
      y: (R() - 0.5) * 1100,
      z: R() * ZT,
    }));

    function draw(o: SceneObj, t: number) {
      const r = o.r;
      const c = cx!;
      c.beginPath();
      switch (o.t) {
        case "lens":
          c.arc(0, 0, r, 0, 7);
          c.moveTo(r * 0.72, 0);
          c.arc(0, 0, r * 0.72, 0, 7);
          c.moveTo(r * 0.42, 0);
          c.arc(0, 0, r * 0.42, 0, 7);
          c.stroke();
          c.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * 6.283 + t * 0.0001;
            c.moveTo(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42);
            c.lineTo(Math.cos(a + 0.9) * r * 0.72, Math.sin(a + 0.9) * r * 0.72);
          }
          c.stroke();
          break;
        case "ring":
          c.arc(0, 0, r, 0, 7);
          c.moveTo(r * 0.6, 0);
          c.arc(0, 0, r * 0.6, 0, 7);
          c.stroke();
          break;
        case "frame":
          c.rect(-r * 0.7, -r * 0.9, r * 1.4, r * 1.8);
          c.rect(-r * 0.56, -r * 0.74, r * 1.12, r * 1.3);
          c.stroke();
          break;
        case "film":
          c.rect(-r, -r * 0.5, r * 2, r);
          c.stroke();
          for (let k = -4; k <= 4; k++) {
            c.strokeRect(k * r * 0.22 - r * 0.06, -r * 0.44, r * 0.12, r * 0.1);
            c.strokeRect(k * r * 0.22 - r * 0.06, r * 0.34, r * 0.12, r * 0.1);
          }
          c.strokeRect(-r * 0.7, -r * 0.2, r * 0.6, r * 0.4);
          c.strokeRect(r * 0.1, -r * 0.2, r * 0.6, r * 0.4);
          break;
        case "panel":
          c.rect(-r * 0.8, -r * 0.55, r * 1.6, r * 1.1);
          c.moveTo(-r * 0.6, -r * 0.3);
          c.lineTo(0, -r * 0.3);
          c.moveTo(-r * 0.6, -r * 0.1);
          c.lineTo(r * 0.3, -r * 0.1);
          c.rect(-r * 0.6, r * 0.1, r * 0.5, r * 0.25);
          c.stroke();
          break;
        case "play":
          c.rect(-r, -r * 0.2, r * 2, r * 0.4);
          c.moveTo(-r * 0.3, -r * 0.2);
          c.lineTo(-r * 0.3, r * 0.2);
          c.moveTo(r * 0.4, -r * 0.2);
          c.lineTo(r * 0.4, r * 0.2);
          c.moveTo(-r * 0.1, -r * 0.45);
          c.lineTo(-r * 0.1, -r * 0.2);
          c.lineTo(r * 0.15, -r * 0.2);
          c.stroke();
          break;
        case "gauge":
          c.arc(0, 0, r, Math.PI * 0.8, Math.PI * 2.2);
          c.moveTo(0, 0);
          c.lineTo(
            Math.cos(Math.PI * 1.3 + Math.sin(t * 0.0005 + (o.ph ?? 0)) * 0.5) * r * 0.8,
            Math.sin(Math.PI * 1.3 + Math.sin(t * 0.0005 + (o.ph ?? 0)) * 0.5) * r * 0.8,
          );
          c.stroke();
          break;
        case "bars":
          for (let k = 0; k < 6; k++) {
            const h = r * (0.3 + 0.6 * Math.abs(Math.sin(k * 1.7 + (o.ph ?? 0))));
            c.rect(-r + k * r * 0.35, r * 0.5 - h, r * 0.22, h);
          }
          c.stroke();
          break;
        case "dots":
          for (let k = 0; k < 9; k++) {
            const a = k * 0.9 + (o.ph ?? 0);
            c.moveTo(Math.cos(a) * r * (0.3 + k * 0.08) + 4, Math.sin(a) * r * (0.3 + k * 0.08));
            c.arc(Math.cos(a) * r * (0.3 + k * 0.08), Math.sin(a) * r * (0.3 + k * 0.08), 4, 0, 7);
          }
          c.stroke();
          break;
      }
    }

    function frame(t: number) {
      const doc = document.documentElement;
      const mxs = doc.scrollHeight - H;
      const p = mxs > 0 ? Math.min(1, window.scrollY / mxs) : 0;
      camT = p * (ZT - 200);
      cam += (camT - cam) * (RM ? 1 : 0.07);

      cx!.clearRect(0, 0, W, H);
      const F = 720;
      const cxm = W / 2 - mx * 30;
      const cym = H / 2 - my * 20;

      for (const o of OB) {
        const dz = o.z - cam;
        if (dz < 90 || dz > 1700) continue;
        const s = F / dz;
        const al = Math.min(1, (1700 - dz) / 600) * Math.min(1, (dz - 90) / 260);
        cx!.save();
        cx!.translate(cxm + (o.x + Math.sin(p * 5 + o.z) * 30) * s, cym + o.y * s);
        cx!.rotate(o.rot + t * 0.00008 * o.sp * (RM ? 0 : 1));
        cx!.globalAlpha = al * 0.85;
        cx!.strokeStyle = o.z % 3 < 1 ? "#8254D8" : o.z % 3 < 2 ? "#58349D" : "#B9A0EF";
        cx!.lineWidth = Math.max(1, 1.8 * s);
        draw({ ...o, r: o.r * s }, t);
        cx!.restore();
      }

      cx!.fillStyle = "#8254D8";
      for (const q of PT) {
        let dz = ((q.z - cam) % ZT + ZT) % ZT;
        if (dz < 90 || dz > 1500) continue;
        const s = F / dz;
        cx!.globalAlpha = Math.min(1, (1500 - dz) / 500) * 0.5;
        cx!.beginPath();
        cx!.arc(cxm + q.x * s, cym + q.y * s, Math.max(0.8, 2.4 * s), 0, 7);
        cx!.fill();
      }
      cx!.globalAlpha = 1;
      if (!RM) raf = requestAnimationFrame(frame);
    }

    const onResize = () => {
      rs();
      if (RM) frame(0);
    };
    const onMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    const onVis = () => {
      if (RM) return;
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    rs();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas id="bg" aria-hidden="true" ref={ref} />;
}
