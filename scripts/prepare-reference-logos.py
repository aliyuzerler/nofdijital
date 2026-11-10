"""
Referans logolarını hazırlar: /tmp/reflogo/resimler (RAR'dan açılan WhatsApp JPEG'leri)
→ public/assets/logos/<slug>.png

- 4 birebir çift (md5 doğrulanmış) tekrarsızlaştırılır → 15 benzersiz marka.
- Etrafındaki düz beyaz kenarlar kırpılır (içerik bbox + 6px pay).
- Küçültme: max yükseklik 220px, max genişlik 340px; yükseltme YAPILMAZ
  (150px kaynaklar olduğu gibi kalır — ekranda 46px gösterilecek, yeterli).
- PNG (kayipsiz; chip içinde beyaz zemin kullanılacak).
"""
from PIL import Image, ImageChops
import os

SRC = "/tmp/reflogo/resimler"
OUT = "/home/z/my-project/public/assets/logos"

# (slug, kaynak dosya, alt metin)
LOGOS = [
    ("koza-atletik",      "WhatsApp Image 2026-11-10 at 23.43.38 (1).jpeg", "Koza Atletik"),
    ("dinamo",            "WhatsApp Image 2026-11-10 at 23.43.38.jpeg",     "Dinamo 2010"),
    ("tuzla-yuzme",       "WhatsApp Image 2026-11-10 at 23.43.39.jpeg",     "Tuzla Yüzme Kulübü"),
    ("cansia-spor",       "WhatsApp Image 2026-11-10 at 23.43.49.jpeg",     "Cansia Spor Kulübü"),
    ("aura-hair-beauty",  "WhatsApp Image 2026-11-10 at 23.43.59.jpeg",     "B&S Aura Hair Beauty"),
    ("venga-concept",     "WhatsApp Image 2026-11-10 at 23.44.52.jpeg",     "Venga Concept"),
    ("tuzla-canada",      "WhatsApp Image 2026-11-10 at 23.46.17 (1).jpeg", "Tuzla Canada Okulları"),
    ("pendik-voleybol",   "WhatsApp Image 2026-11-10 at 23.48.44.jpeg",     "Pendik Voleybol Spor Kulübü"),
    ("avaron-coffee",     "WhatsApp Image 2026-11-10 at 23.46.17 (2).jpeg", "Avaron Coffee"),
    ("maximus-wellness",  "WhatsApp Image 2026-11-10 at 23.47.48 (1).jpeg", "Maximus Wellness"),
    ("maximus-training",  "WhatsApp Image 2026-11-10 at 23.47.48 (2).jpeg", "Maximus Functional Training"),
    ("nocre-hotel",       "WhatsApp Image 2026-11-10 at 23.48.45.jpeg",     "Nocrè Hotel"),
    ("lipa",              "WhatsApp Image 2026-11-10 at 23.49.53 (1).jpeg", "Lipa"),
    ("koylu-sandwich",    "WhatsApp Image 2026-11-10 at 23.49.53.jpeg",     "Köylü Sandwich"),
    ("pitoscu-murat",     "WhatsApp Image 2026-11-10 at 23.49.53 (2).jpeg", "Pitoscu Murat"),
]

MAX_H, MAX_W = 220, 340

def trim_white(im: Image.Image, threshold=243, pad=6) -> Image.Image:
    """Düz beyaz kenarları kırp (içerik bbox + pad). Koyu zeminliler pratikte kırpılmaz."""
    gray = im.convert("L")
    mask = gray.point(lambda p: 255 if p < threshold else 0)  # beyaz olmayan pikseller
    bbox = mask.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad); t = max(0, t - pad)
    r = min(im.size[0], r + pad); b = min(im.size[1], b + pad)
    if (r - l) < 24 or (b - t) < 24:  # saçma küçük kırpma → dokunma
        return im
    return im.crop((l, t, r, b))

os.makedirs(OUT, exist_ok=True)
report = []
for slug, fname, alt in LOGOS:
    im = Image.open(os.path.join(SRC, fname)).convert("RGB")
    before = im.size
    im = trim_white(im)
    w, h = im.size
    scale = min(MAX_W / w, MAX_H / h, 1.0)  # asla yükseltme
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    dst = os.path.join(OUT, f"{slug}.png")
    im.save(dst, "PNG", optimize=True)
    report.append((slug, alt, before, im.size, os.path.getsize(dst) // 1024))

print(f"{'slug':<20} {'alt':<28} {'kaynak':>10} {'çıktı':>10} {'KB':>5}")
for slug, alt, before, after, kb in report:
    print(f"{slug:<20} {alt:<28} {before[0]}x{before[1]:<6} {after[0]}x{after[1]:<6} {kb:>4}")
print(f"\nToplam: {len(report)} logo → {OUT}")
