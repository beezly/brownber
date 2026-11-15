"""Turn the reference photos in original-characters/ into 48x48 8-bit portraits.

The photos themselves are never shipped. Only the pixelated portraits in
public/portraits/ go into the game build.

Usage:  python3 -I tools/make_portraits.py  [--preview out.png]
"""
import os, sys
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'original-characters')
OUT = os.path.join(ROOT, 'public', 'portraits')
SIZE = 48

# Face crop per photo: centre x, centre y (fractions of image width/height),
# and the square's side as a fraction of image width. Tune these by eye.
CROPS = {
    'beez':   (0.50, 0.50, 1.00),
    'beth':   (0.46, 0.22, 0.60),
    'curtis': (0.50, 0.436, 1.00),
    'debra':  (0.285, 0.19, 0.34),
    'karla':  (0.35, 0.30, 0.42),
    'leo':    (0.50, 0.50, 0.78),
    'maffa':  (0.53, 0.30, 0.60),
    'nick':   (0.50, 0.29, 0.54),
    'sophie': (0.62, 0.27, 0.54),
    'tom':    (0.48, 0.44, 0.96),
    'luke':   (0.52, 0.355, 0.96),
    'jonny':  (0.49, 0.545, 0.84),
    'becca':  (0.51, 0.52, 0.62),
}

# Per-person (contrast, colour) overrides; default is (1.25, 1.2).
ENHANCE = {
    'tom': (1.15, 0.8),
    'nick': (1.15, 1.0),
    'sophie': (1.3, 1.1),
    'beth': (1.2, 1.0),
    'jonny': (1.15, 1.0),
    'becca': (1.1, 1.0),
}

# Game palette (keep in sync with src/palette.ts), plus extra skin/hair tones
# used only for portraits so faces stay recognisable.
PALETTE = [
    0x1a1c2c, 0xf4f4f4, 0x94b0c2, 0x566c86, 0x333c57, 0x5d275d, 0xb13e53, 0xef7d57,
    0xffcd75, 0xa7f070, 0x38b764, 0x257179, 0x29366f, 0x3b5dc9, 0x8a5a3b, 0xf4c09a,
    # portrait extras
    0xc98a6b, 0x6b3f2a, 0xe0a07e, 0x3e2a22, 0xa86f4c, 0xd9b38c,
    0xe8b898, 0x7a4a36, 0x9a7a6a, 0x5a4a52, 0xd8a890, 0xb08a78, 0x8a8a98, 0x4a3a3a,
]


def find_src(name):
    for ext in ('.jpg', '.jpeg', '.png', '.webp', '.JPG', '.PNG'):
        p = os.path.join(SRC, name + ext)
        if os.path.exists(p):
            return p
    return None


def pal_image():
    p = Image.new('P', (1, 1))
    flat = []
    for c in PALETTE:
        flat += [(c >> 16) & 255, (c >> 8) & 255, c & 255]
    flat += flat[:3] * (256 - len(PALETTE))
    p.putpalette(flat)
    return p


def crop(img, cx, cy, s):
    w, h = img.size
    side = s * w
    x0 = cx * w - side / 2
    y0 = cy * h - side / 2
    return img.crop((int(x0), int(y0), int(x0 + side), int(y0 + side)))


def make(name):
    src = find_src(name)
    if not src:
        return None, None
    img = Image.open(src).convert('RGB')
    face = crop(img, *CROPS[name]).resize((SIZE, SIZE), Image.LANCZOS)
    con, col = ENHANCE.get(name, (1.25, 1.2))
    face = ImageEnhance.Contrast(face).enhance(con)
    face = ImageEnhance.Color(face).enhance(col)
    px = face.quantize(palette=pal_image(), dither=Image.Dither.NONE).convert('RGB')
    return face, px


def main():
    os.makedirs(OUT, exist_ok=True)
    preview = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == '--preview' else None
    results = []
    for name in CROPS:
        face, px = make(name)
        if px is None:
            print('missing photo:', name)
            continue
        px.save(os.path.join(OUT, name + '.png'))
        results.append((name, face, px))
        print('wrote', name)
    if preview:
        scale = 4
        sheet = Image.new('RGB', (len(results) * SIZE * scale, SIZE * scale * 2), 'white')
        for i, (n, face, px) in enumerate(results):
            sheet.paste(face.resize((SIZE * scale,) * 2, Image.NEAREST), (i * SIZE * scale, 0))
            sheet.paste(px.resize((SIZE * scale,) * 2, Image.NEAREST), (i * SIZE * scale, SIZE * scale))
        sheet.save(preview)


if __name__ == '__main__':
    main()
