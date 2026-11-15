"""Draw the home-screen icon (Binks under the night sky) from the game's own pixel art."""
import os, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, 'src', 'characters.ts')).read()
block = src[src.index('export const BINKS_FRAMES'):]
rows = re.findall(r"'([.krenb]{16})'", block)[:12]
PAL = {'k': (0x5a, 0x2e, 0x14), 'r': (0xc4, 0x6a, 0x2f), 'e': (0x1a, 0x1c, 0x2c), 'n': (0x3a, 0x1f, 0x14)}

G = 24  # icon pixel grid
img = Image.new('RGB', (G, G), (0x29, 0x36, 0x6f))
px = img.load()
for (x, y) in [(3, 3), (19, 2), (8, 6), (14, 4), (21, 8), (2, 10)]:
    px[x, y] = (0xff, 0xcd, 0x75) if (x + y) % 3 else (0xf4, 0xf4, 0xf4)
for x in range(G):  # the fells and the grass
    h = 6 + (2 if 6 < x < 15 else 0) - (1 if x > 18 else 0)
    for y in range(G - h, G):
        px[x, y] = (0x33, 0x3c, 0x57)
    for y in range(G - 4, G):
        px[x, y] = (0x38, 0xb7, 0x64)
ox, oy = 4, G - 4 - 12
for y, row in enumerate(rows):
    for x, ch in enumerate(row):
        if ch in PAL:
            px[ox + x, oy + y] = PAL[ch]

out = os.path.join(ROOT, 'public', 'icons')
os.makedirs(out, exist_ok=True)
for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')]:
    img.resize((size, size), Image.NEAREST).save(os.path.join(out, name))
print('icons written')
