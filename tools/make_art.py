"""Turn the Hall's real artwork (kodachrome_roll_16bit_batch/) into game assets in public/art/.

- Wall pieces: scaled to fit the wall space they hang in.
- Art Trail collectibles: a small icon to pick up, and a larger view shown when found.
Each comes in a 16-bit version (full colour) and an 8-bit version (the game's 16-colour palette).

Usage:  python3 -I tools/make_art.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'kodachrome_roll_16bit_batch')
OUT = os.path.join(ROOT, 'public', 'art')

PALETTE = [0x1a1c2c, 0xf4f4f4, 0x94b0c2, 0x566c86, 0x333c57, 0x5d275d, 0xb13e53, 0xef7d57,
           0xffcd75, 0xa7f070, 0x38b764, 0x257179, 0x29366f, 0x3b5dc9, 0x8a5a3b, 0xf4c09a]

# name: (source file, box w, box h, optional crop in source pixels)
WALL = {
    'anatomy':   ('wall_props/art_01_img_8333_16bit_1x.png', 40, 56, None),
    'motion':    ('wall_props/art_02_img_8332_16bit_1x.png', 40, 56, None),
    'malawi':    ('wall_props/art_03_img_8331_16bit_1x.png', 40, 48, None),
    'stripes':   ('wall_props/art_04_img_8329_16bit_1x.png', 40, 56, None),
    'dogphoto':  ('wall_props/art_06_img_8324_16bit_1x.png', 40, 48, None),
}
TRAIL = {
    'sculpture': ('collectible_items/art_05_img_8325_16bit_1x.png', (30, 30, 72, 76)),
    'shelfprint': ('collectible_items/art_07_img_8323_16bit_1x.png', (16, 12, 92, 66)),
    'triptych':  ('collectible_items/art_08_img_8322_16bit_1x.png', None),
    'gallery':   ('collectible_items/art_09_img_8334_16bit_1x.png', None),
}


def pal_image():
    p = Image.new('P', (1, 1))
    flat = []
    for c in PALETTE:
        flat += [(c >> 16) & 255, (c >> 8) & 255, c & 255]
    flat += flat[:3] * (256 - len(PALETTE))
    p.putpalette(flat)
    return p


def to8(im):
    a = im.getchannel('A')
    q = im.convert('RGB').quantize(palette=pal_image(), dither=Image.Dither.NONE).convert('RGBA')
    q.putalpha(a)
    return q


def fit(im, bw, bh):
    k = min(bw / im.width, bh / im.height)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def frame(im, colour=(26, 28, 44, 255)):
    out = Image.new('RGBA', (im.width + 2, im.height + 2), colour)
    out.alpha_composite(im, (1, 1))
    return out


def save_both(im, name):
    im.save(os.path.join(OUT, f'{name}_16.png'))
    to8(im).save(os.path.join(OUT, f'{name}_8.png'))


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, (f, bw, bh, crop) in WALL.items():
        im = Image.open(os.path.join(SRC, f)).convert('RGBA')
        if crop:
            im = im.crop(crop)
        save_both(frame(fit(im, bw - 2, bh - 2)), f'wall_{name}')
    for name, (f, crop) in TRAIL.items():
        im = Image.open(os.path.join(SRC, f)).convert('RGBA')
        bbox = im.getchannel('A').getbbox()
        im = im.crop(bbox)
        icon_src = im.crop(crop) if crop else im
        save_both(frame(fit(icon_src, 15, 13), (255, 205, 117, 255)), f'trail_{name}_icon')
        save_both(frame(fit(im, 120, 92)), f'trail_{name}_full')
    print('art written to', OUT)


if __name__ == '__main__':
    main()
