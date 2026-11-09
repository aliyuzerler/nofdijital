# Üretilen PNG'leri WebP'e optimize et + base64 manifest üret
from PIL import Image
import os, json, base64

SRC = '/home/z/my-project/assets_raw'
OUT = '/home/z/my-project/assets'
os.makedirs(OUT, exist_ok=True)

# name -> (max_genişlik, max_boyut, kalite)
SPEC = {
    'g': (640, 640, 68),   # galeri
    'b': (880, 880, 70),   # blog kapağı
    'a': (880, 880, 70),   # hakkımızda
    'h': (1000, 1000, 72), # hero
}

manifest = {}
total = 0
for f in sorted(os.listdir(SRC)):
    if not f.endswith('.png'):
        continue
    name = f[:-4]
    p = os.path.join(SRC, f)
    try:
        im = Image.open(p); im.verify()
        im = Image.open(p).convert('RGB')
    except Exception as e:
        print('BOZUK:', f, e); continue
    mw, md, q = SPEC[name[0]]
    w, h = im.size
    scale = min(mw / w, md / h, 1.0)
    if scale < 1.0:
        im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    outp = os.path.join(OUT, name + '.webp')
    im.save(outp, 'WEBP', quality=q, method=6)
    b64 = base64.b64encode(open(outp, 'rb').read()).decode()
    manifest[name] = 'data:image/webp;base64,' + b64
    kb = os.path.getsize(outp) // 1024
    total += kb
    print(f'{name}: {im.size[0]}x{im.size[1]} {kb}KB')

print('TOPLAM:', total, 'KB | base64 ~', int(total * 1.34), 'KB')
json.dump(manifest, open(os.path.join(OUT, 'img-manifest.json'), 'w'))
print('OK')
