"""
NOF logosu düzenleme:
- Kavisli "DIGITAL" yazısı (üstteki 7 küçük bileşen) kaldırılır, NOF harf formları aynen korunur.
- "DİJİTAL" yazısı NOF'un altına, harflerle uyumlu yatay mavi→mor gradyanla eklenir
  (NOF'tan küçük ama okunaklı; harf aralıklı, büyük harf).
Kaynak: public/assets/logo.png (247x146) → çıktı aynı yol + public/uploads/brand/logo.png kopyası.
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from scipy import ndimage

SRC = "public/assets/logo.png"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TEXT = "DİJİTAL"

img = Image.open(SRC).convert("RGBA")
a = np.array(img)
alpha = a[..., 3] > 40

# 1) Bileşen analizi: büyük harfler (size > 5000) korunur, küçük kavis harfleri silinir
lab, n = ndimage.label(alpha)
keep_sizes = []
for i in range(1, n + 1):
    ys, xs = np.where(lab == i)
    keep_sizes.append((i, len(ys)))
print("components:", sorted(keep_sizes, key=lambda t: -t[1]))

clean = a.copy()
big_ids = [i for i, size in keep_sizes if size > 5000]
keep = np.isin(lab, big_ids)
clean[~keep] = 0  # kavis harfleri + yarı saydam AA kalıntıları tamamen temizle

cimg = Image.fromarray(clean)
# 2) Harf bölgesini kırp
bbox = cimg.getchannel("A").getbbox()
print("letters bbox:", bbox)
letters = cimg.crop(bbox)
lw, lh = letters.size

# 3) "DİJİTAL" metni — harf aralıklı, gradyan dolgulu
fs = 30  # font boyutu (px)
font = ImageFont.truetype(FONT, fs)
sp = 7  # harf arası ek boşluk
widths = []
for ch in TEXT:
    bb = font.getbbox(ch)
    widths.append(bb[2] - bb[0])
text_w = sum(widths) + sp * (len(TEXT) - 1)
asc, desc = font.getmetrics()
text_h = asc + desc

gap = 8
pad_bottom = 6
W = max(lw, text_w + 4)
H = lh + gap + text_h + pad_bottom
canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
# NOF harfleri ortalanır (üstte)
canvas.paste(letters, ((W - lw) // 2, 0), letters)

# Metin maskesi
mask = Image.new("L", (text_w + 8, text_h), 0)
md = ImageDraw.Draw(mask)
x = 0
for ch, w in zip(TEXT, widths):
    bb = font.getbbox(ch)
    md.text((x - bb[0], 0), ch, font=font, fill=255)
    x += w + sp

# Yatay gradyan (harf paletiyle uyumlu: mavi → menekşe → mor)
left, mid, right = (0x29, 0x51, 0xB8), (0x70, 0x5E, 0xC9), (0xB6, 0x69, 0xE0)
grad = Image.new("RGBA", mask.size)
gd = np.zeros((mask.size[1], mask.size[0], 4), dtype=np.uint8)
for xx in range(mask.size[0]):
    t = xx / max(mask.size[0] - 1, 1)
    if t < 0.5:
        u = t / 0.5
        c = tuple(int(left[i] + (mid[i] - left[i]) * u) for i in range(3))
    else:
        u = (t - 0.5) / 0.5
        c = tuple(int(mid[i] + (right[i] - mid[i]) * u) for i in range(3))
    gd[:, xx, 0] = c[0]
    gd[:, xx, 1] = c[1]
    gd[:, xx, 2] = c[2]
    gd[:, xx, 3] = 255
grad = Image.fromarray(gd)

tx = (W - text_w) // 2
ty = lh + gap
canvas.paste(grad, (tx, ty), mask)

canvas.save(SRC)
canvas.save("public/uploads/brand/logo.png")
print("new size:", canvas.size, "-> saved to public/assets/logo.png + public/uploads/brand/logo.png")
