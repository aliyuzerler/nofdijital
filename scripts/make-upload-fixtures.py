"""Playwright medya yükleme testleri için PNG fixture üretir (PIL gerektirmez).
- /tmp/upload-small.png : 640x400, ~5 KB (küçük dosya senaryosu)
- /tmp/upload-big.png   : 3200x2200, ~19 MB (Vercel 4.5MB sınırı aşıyorsu — istemcide küçültme senaryosu)
"""
import struct
import zlib
import random


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: str, w: int, h: int, noise: bool) -> None:
    rnd = random.Random(42)
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter: none
        for x in range(w):
            if noise:
                raw += bytes((rnd.randrange(256), rnd.randrange(256), rnd.randrange(256)))
            else:
                r = (x * 255) // max(1, w - 1)
                g = (y * 255) // max(1, h - 1)
                raw += bytes((r, g, 200))
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 6))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)
    print(f"{path}: {len(png)} bytes ({w}x{h})")


write_png("/tmp/upload-small.png", 640, 400, noise=False)
write_png("/tmp/upload-big.png", 3200, 2200, noise=True)
# Logo yönetimi testi için benzersiz içerikli küçük PNG (seed logolarıyla checksum çakışmasın)
write_png("/tmp/upload-logo.png", 320, 200, noise=True)
