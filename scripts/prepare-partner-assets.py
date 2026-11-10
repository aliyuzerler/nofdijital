"""
Partnerlerimiz kartı için marka varlıklarını hazırlar:
- meta.svg: Simple Icons Meta sonsuzluk işareti, Meta mavisi (#0668E1)
- tiktok.svg: TikTok nota işareti, ikonik üç renk (cyan #25F4EE / kırmızı #FE2C55 / siyah)
- google-wordmark.png: resmi çok renkli Google wordmark (gstatic), kenar boşlukları kırpılır
Kaynaklar: /tmp/brand altındaki simple-icons (npm registry) + gstatic wordmark.
"""
from PIL import Image
import numpy as np

OUT = "public/assets/partners"
import os

os.makedirs(OUT, exist_ok=True)

# ---- Meta (simple-icons tek yol, Meta mavisi) ----
meta = open("/tmp/brand/package/icons/meta.svg").read()
meta = meta.replace('viewBox="0 0 24 24"', 'viewBox="0 0 24 24" fill="#0668E1"')
open(f"{OUT}/meta.svg", "w").write(meta)
print("meta.svg OK")

# ---- TikTok üç renkli ----
tt = open("/tmp/brand/package/icons/tiktok.svg").read()
d = tt.split('<path d="')[1].split('"')[0]
tiktok_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="{d}" fill="#25F4EE" transform="translate(-0.7 -0.5)"/>
  <path d="{d}" fill="#FE2C55" transform="translate(0.7 0.5)"/>
  <path d="{d}" fill="#000000"/>
</svg>
'''
open(f"{OUT}/tiktok.svg", "w").write(tiktok_svg)
print("tiktok.svg OK")

# ---- Google wordmark: kırp ----
img = Image.open("/tmp/brand/google-word.png").convert("RGBA")
a = np.array(img)
op = a[..., 3] > 8
ys, xs = np.where(op)
crop = img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
crop.save(f"{OUT}/google-wordmark.png")
print("google-wordmark.png:", crop.size)
