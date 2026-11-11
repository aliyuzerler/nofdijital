"""Ofset telafili piksel karşılaştırması: en iyi dikey hizalamayı bul, artık farkı raporla."""
from PIL import Image
import numpy as np

PAIRS = [
    ("/tmp/render/rollback-top.png", "/tmp/render/after-top.png", "TOP"),
    ("/tmp/render/rollback-footer.png", "/tmp/render/after-footer.png", "FOOTER"),
]

for base_path, after_path, tag in PAIRS:
    a = np.asarray(Image.open(base_path).convert("L"), dtype=np.int16)
    b = np.asarray(Image.open(after_path).convert("L"), dtype=np.int16)
    best = None
    for dy in range(-60, 61):  # dikey ofset taraması
        if dy > 0:
            a2, b2 = a[dy:, :], b[:-dy, :]
        elif dy < 0:
            a2, b2 = a[:dy, :], b[-dy:, :]
        else:
            a2, b2 = a, b
        d = np.abs(a2 - b2)
        pct = 100.0 * (d > 8).sum() / d.size
        if best is None or pct < best[1]:
            best = (dy, pct)
    dy, pct = best
    print(f"{tag}: en iyi dikey ofset dy={dy}px → artık değişen piksel %{pct:.3f}")
