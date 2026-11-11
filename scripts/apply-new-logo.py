#!/usr/bin/env python3
"""
Kullanıcının yüklediği yeni NOF logosunu (upload/logo.png; JPEG içerikli 1600x973,
mor zemin üzerine beyaz "nof DIGITAL" işareti) site logolarına uygular.

1. Beyaz işareti sıkı şekilde kırpar (mor zeminden kontur çıkarımı, bbox + kenar payı).
2. Retina için makul boyuta ölçekler (hedef genişlik ~640px).
3. public/assets/logo.png ve public/uploads/brand/logo.png dosyalarının üzerine yazar
   (site header/footer/partner/admin login bu yollardan beslenir).
"""
from PIL import Image
import numpy as np

SRC = "/home/z/my-project/upload/logo.png"
TARGETS = [
    "/home/z/my-project/public/assets/logo.png",
    "/home/z/my-project/public/uploads/brand/logo.png",
]
TARGET_W = 640
MARGIN_RATIO = 0.05  # işaret çevresinde bırakılacak mor kenar payı (kısa kenara göre)

im = Image.open(SRC).convert("RGB")
arr = np.asarray(im).astype(np.int16)

# Zemin rengi = köşe piksellerinin medyanı
corners = np.concatenate([
    arr[:8, :8].reshape(-1, 3),
    arr[:8, -8:].reshape(-1, 3),
    arr[-8:, :8].reshape(-1, 3),
    arr[-8:, -8:].reshape(-1, 3),
])
bg = np.median(corners, axis=0)

# Zeminden fark -> maske; işaret beyaz olduğu için fark yüksek
diff = np.abs(arr - bg).sum(axis=2)
mask = diff > 60

# JPEG gürültüsünü ele: yalnızca gerçek işaret pikselleri (çok yüksek fark = beyaz)
strong = diff > 200
ys, xs = np.where(strong)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
# Güçlü bölge çevresinde, zeminle uyumlu olmayan (diff>60) ilk/son satır-sütunları ara
# ama yalnızca güçlü bölgenin 2 katı çevresinde kalarak (gürültü/gradant kırpılır)
pad_x = int((x1 - x0) * 0.35)
pad_y = int((y1 - y0) * 0.60)
gx0, gx1 = max(0, x0 - pad_x), min(im.size[0], x1 + pad_x)
gy0, gy1 = max(0, y0 - pad_y), min(im.size[1], y1 + pad_y)
sub = mask[gy0:gy1, gx0:gx1]
# satır/sütun yoğunluğu eşiği: sütunun en az %1'i işaret içermeli
col_ok = sub.mean(axis=0) > 0.01
row_ok = sub.mean(axis=1) > 0.01
cx0 = gx0 + int(np.argmax(col_ok))
cx1 = gx0 + len(col_ok) - 1 - int(np.argmax(col_ok[::-1]))
cy0 = gy0 + int(np.argmax(row_ok))
cy1 = gy0 + len(row_ok) - 1 - int(np.argmax(row_ok[::-1]))
x0, x1, y0, y1 = cx0, cx1, cy0, cy1
print(f"content bbox: x {x0}..{x1}, y {y0}..{y1} (image {im.size[0]}x{im.size[1]})")

# Kenar payı
mw = int((x1 - x0) * MARGIN_RATIO)
mh = int((y1 - y0) * MARGIN_RATIO)
box = (max(0, x0 - mw), max(0, y0 - mh), min(im.size[0], x1 + mw), min(im.size[1], y1 + mh))
crop = im.crop(box)
print(f"crop box: {box} -> {crop.size[0]}x{crop.size[1]}")

# Hedef genişliğe ölçekle
if crop.size[0] > TARGET_W:
    h = round(crop.size[1] * TARGET_W / crop.size[0])
    crop = crop.resize((TARGET_W, h), Image.LANCZOS)
print(f"final size: {crop.size[0]}x{crop.size[1]}")

for t in TARGETS:
    crop.save(t, "PNG", optimize=True)
    print(f"written: {t}")
