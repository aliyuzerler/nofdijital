"""Referans tasarım görselinden yüz kırpma — stats-face.webp üretimi.

Kaynak: upload/WhatsApp Image 2026-11-11 at 01.45.58.jpeg (1096x549, koyu zemin).
Yüz sağ tarafta; koyu arka plan site temasıyla doğal kaynaşır.
"""
from PIL import Image

SRC = "/home/z/my-project/upload/WhatsApp Image 2026-11-11 at 01.45.58.jpeg"
OUT = "/home/z/my-project/public/assets/stats-face.webp"

img = Image.open(SRC).convert("RGB")
w, h = img.size
print("kaynak:", w, "x", h)

# Sağ taraf: yüz + parıltı bölgesi (koyu zemin korunur)
crop = img.crop((int(w * 0.66), 0, w, h))
print("kırpım:", crop.size)

crop.save(OUT, "WEBP", quality=82, method=6)
print("kaydedildi:", OUT)

# Küçük önizleme (görsel kontrol için)
prev = crop.copy()
prev.thumbnail((360, 360))
prev.save("/tmp/render/stats-face-preview.jpg", "JPEG", quality=70)
print("önizleme: /tmp/render/stats-face-preview.jpg")
