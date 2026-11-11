"""Önce/sonra piksel karşılaştırması — rollback baseline vs değişiklik sonrası.

Karşılaştırılan:
  /tmp/render/rollback-top.png    (baseline, ce609a0)  <->  /tmp/render/after-top.png
  /tmp/render/rollback-footer.png (baseline, ce609a0)  <->  /tmp/render/after-footer.png
Hero/footer istatistik bandından bağımsız bölümler — piksel eşleşmeleri
"sadece bant eklendi, başka hiçbir görsel değişmedi" kanıtıdır.
"""
from PIL import Image, ImageChops

PAIRS = [
    ("/tmp/render/rollback-top.png", "/tmp/render/after-top.png"),
    ("/tmp/render/rollback-footer.png", "/tmp/render/after-footer.png"),
]

for base_path, after_path in PAIRS:
    a = Image.open(base_path).convert("RGB")
    b = Image.open(after_path).convert("RGB")
    if a.size != b.size:
        print(f"{after_path}: BOYUT FARKI {a.size} vs {b.size}")
        continue
    diff = ImageChops.difference(a, b)
    bbox = diff.getbbox()
    hist = diff.convert("L").histogram()
    total = sum(hist)
    changed = sum(hist[8:])  # 8/255'ten büyük fark = gerçek değişiklik
    pct = 100.0 * changed / total
    print(f"{after_path.split('/')[-1]}: değişen piksel oranı %{pct:.3f} | diff bbox: {bbox}")
