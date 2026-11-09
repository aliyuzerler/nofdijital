# NOF DİJİTAL – logo arka plan temizleme (kenarlardan flood-fill, tasarımı korur)
from PIL import Image, ImageFilter
from collections import deque
import json, os, base64

SRC = '/home/z/my-project/upload/logo.png'
OUT = '/home/z/my-project/assets'
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC).convert('RGB')
w, h = img.size
px = img.load()

def is_bg(x, y):
    r, g, b = px[x, y]
    return r > 238 and g > 238 and b > 238

# Kenarlardan içeriyi doğru BFS (şeffaf dış zemin) – "o" içindeki beyaz delik dışarıdan ulaşılamaz, korunur
visited = bytearray(w * h)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if is_bg(x, y) and not visited[y * w + x]:
            visited[y * w + x] = 1; q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        if is_bg(x, y) and not visited[y * w + x]:
            visited[y * w + x] = 1; q.append((x, y))
while q:
    x, y = q.popleft()
    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h and not visited[ny * w + nx] and is_bg(nx, ny):
            visited[ny * w + nx] = 1; q.append((nx, ny))

mask = Image.frombytes('L', (w, h), bytes(255 if visited[y * w + x] else 0 for y in range(h) for x in range(w)))
mask = mask.filter(ImageFilter.GaussianBlur(1.1))          # kenar yumuşatma
alpha = mask.point(lambda v: 255 - v)

out = img.convert('RGBA'); out.putalpha(alpha)

# İçerik kırpma + küçük pad
bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
pad = 6
bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
out = out.crop(bbox)
print('kırpılan boyut:', out.size)

manifest = {}
for name, tw in (('logo', 420), ('logo-fav', 96)):
    im = out.copy()
    ratio = tw / im.width
    im = im.resize((tw, max(1, round(im.height * ratio))), Image.LANCZOS)
    p = f'{OUT}/{name}.webp'
    im.save(p, 'WEBP', lossless=True)
    b64 = base64.b64encode(open(p, 'rb').read()).decode()
    manifest[name] = 'data:image/webp;base64,' + b64
    print(name, im.size, os.path.getsize(p) // 1024, 'KB')

json.dump(manifest, open(f'{OUT}/logo-manifest.json', 'w'))
print('OK')
