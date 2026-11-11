"""Diff'i satır bazında yerelleştir: hangi y-bölgelerinde değişiklik var?"""
from PIL import Image, ImageChops
import numpy as np

PAIRS = [
    ("/tmp/render/rollback-top.png", "/tmp/render/after-top.png", "TOP"),
    ("/tmp/render/rollback-footer.png", "/tmp/render/after-footer.png", "FOOTER"),
]

for base_path, after_path, tag in PAIRS:
    a = np.asarray(Image.open(base_path).convert("L"), dtype=np.int16)
    b = np.asarray(Image.open(after_path).convert("L"), dtype=np.int16)
    d = np.abs(a - b)
    row_changed = (d > 8).sum(axis=1)
    h = len(row_changed)
    print(f"--- {tag} (h={h}) ---")
    # 50 satırlık bantlar halinde yüzde
    bands = []
    for y0 in range(0, h, 60):
        seg = row_changed[y0:y0 + 60]
        pct = 100.0 * seg.sum() / (seg.size * 1440)
        if pct > 0.5:
            bands.append(f"y{y0}-{min(y0 + 60, h)}: %{pct:.1f}")
    print("yoğun bantlar:", ", ".join(bands) if bands else "yok (fark dağınık)")
