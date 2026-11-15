// ZOMBIE NIGHT art: zombie versions of the friends' sprites, the cure items and a want-bubble.
// Everything is drawn flat 8-bit style with 'k' outlines, so bake()'s 16-bit shading works on it.
import type { SpriteDef } from './rooms';
import type { CharDef, Frame } from './characters';
import { buildFrame, charPalette } from './characters';

const W = 16;
const H = 24;

const lerpC = (a: number, b: number, t: number) => {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};
const lum = (c: number) => (0.3 * ((c >> 16) & 255) + 0.59 * ((c >> 8) & 255) + 0.11 * (c & 255)) / 255;
const dark = (c: number, f: number) => lerpC(c, 0x000000, 1 - f);
const dull = (c: number) => lerpC(c, 0x6a6e66, 0.2); // slightly grey, faded clothes

/** Sickly green; lighter skin gives lighter green so friends stay distinguishable. */
function zombieSkin(skin: number): number {
  const t = Math.min(1, Math.max(0, (lum(skin) - 0.4) / 0.45));
  return lerpC(0x587a50, 0xa4cf80, t);
}

// shamble legs (feet on the same bottom rows as the originals)
const ZLEGS: Record<Frame, string[]> = {
  idle: ['...kppk..kppk...', '...kppk..kppk...', '...kppk..kppk...', '..kbbbk..kbbbk..', '..kkkkk..kkkkk..'],
  run1: ['...kppk..kppk...', '...kppk...kppk..', '...kppk...kppk..', '..kbbbk..kbbbbk.', '..kkkkk..kkkkkk.'],
  run2: ['...kppk..kppk...', '..kppk...kppk...', '..kppk...kppk...', '.kbbbk...kbbbk..', '.kkkkk...kkkkk..'],
  jump: ['...kppk..kppk...', '..kbbbk..kppk...', '..kkkkk..kbbbk..', '.........kkkkk..', '................'],
};

export function zombieFrame(def: CharDef, frame: Frame): SpriteDef {
  const src = buildFrame(def, frame);
  const g: string[][] = src.map((r) => r.padEnd(W, '.').split(''));
  const get = (x: number, y: number) => g[y]?.[x] ?? '.';
  const set = (x: number, y: number, ch: string) => {
    if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = ch;
  };

  // --- legs: shambling, replace rows 19..23 (keep the original fill letters) ---
  for (let i = 0; i < 5; i++) for (let x = 0; x < W; x++) g[19 + i][x] = ZLEGS[frame][i][x];

  // --- head: groan mouth (dark, open, 2 rows), pale eyes ---
  const mouthXs: number[] = [];
  for (let x = 0; x < W; x++) if (get(x, 9) === 'm') mouthXs.push(x);
  if (mouthXs.length) {
    const mid = mouthXs.slice(0, Math.max(1, mouthXs.length - 1));
    for (const x of mid) if (get(x, 10) === 's') set(x, 10, 'm');
  }
  if (def.hair === 'bald') for (let y = 0; y < 4; y++) for (let x = 0; x < W; x++) if (get(x, y) === 'w') set(x, y, 'l');
  // one lopsided eye (second eye pixel row dropped) for the daft look
  for (let x = 0; x < W; x++) if (get(x, 7) === 'e' && x > 8) set(x, 7, 'r');
  // a patch of scalp / skin peeling and a bit of messy hair
  if (def.hair !== 'bald' && def.hair !== 'shaved') {
    if (get(4, 3) === 'h') set(4, 3, 'z');
  } else if (def.hair === 'shaved') set(5, 3, 'z');
  if (def.hair === 'short' || def.hair === 'tied' || def.hair === 'bob' || def.hair === 'long') {
    if (get(8, 0) === 'k') set(8, 0, 'h');
    if (get(7, 0) === 'k') set(7, 0, 'h');
  }
  if (def.hair === 'longWavy') {
    set(0, 12, 'h');
    set(15, 12, 'h');
  }
  // cheek wound
  if (get(5, 8) === 's') set(5, 8, 'z');
  if (def.beard === 'full' && get(5, 8) === 'd') set(5, 8, 'z');

  // --- body: remove the arm at the back, then ragged clothes ---
  for (const y of [14, 15]) {
    if (get(3, y) === 's') set(3, y, 'c');
    if (get(13, y) === 's') set(13, y, 'c');
  }
  // remove milk / pint / tea / wine in the hands (rows 12-15, x 13-15) and redraw as outstretched arms
  for (let y = 12; y <= 16; y++) for (const x of [13, 14, 15]) if (get(x, y) !== 'k' || x >= 14) set(x, y, y >= 13 ? '.' : get(x, y));
  const lift = frame === 'run2' ? -1 : frame === 'jump' ? -1 : 0;
  const ay = 13 + lift;
  for (const x of [14, 15]) set(x, ay - 1, 'k');
  for (const x of [12, 13, 14, 15]) set(x, ay + 2, 'k');
  for (const y of [ay, ay + 1]) for (const x of [12, 13, 14, 15]) set(x, y, 's');
  // fingers: a notch in the end of the hand
  set(15, ay + 1, 'z');
  // torn clothes: dark patches, a hole showing skin, ragged hem
  const hole = def.outfit === 'dress' || def.outfit === 'leafTop' ? 'z' : 'z';
  const bodyRow = (y: number) => y >= 12 && y <= 16;
  const patches: [number, number, string][] = [[5, 13, 'n'], [6, 13, 'n'], [10, 15, 'n'], [11, 14, 'n'], [7, 15, hole], [5, 16, 'n'], [12, 16, 'n']];
  for (const [x, y, ch] of patches) {
    const cur = get(x, y);
    if (bodyRow(y) && (cur === 'c' || cur === 'a' || cur === 'p' || cur === 'w')) set(x, y, ch);
  }
  // torn trouser leg
  const leg = frame === 'jump' ? 19 : 20;
  if (get(4, leg) === 'p') set(4, leg, 'z');
  if (get(11, leg + 1) === 'p') set(11, leg + 1, 'n');

  // --- shamble: lolling head on the run frames ---
  if (frame === 'run2' || frame === 'run1') {
    const dx = frame === 'run2' ? -1 : 1;
    const clear = (col: number) => {
      for (let y = 0; y < 12; y++) if (g[y][col] !== '.') return false;
      return true;
    };
    if (clear(dx < 0 ? 0 : 15)) {
      for (let y = 0; y < 12; y++) {
        const row = g[y];
        if (dx < 0) {
          row.shift();
          row.push('.');
        } else {
          row.pop();
          row.unshift('.');
        }
      }
    }
  }

  const base = charPalette(def);
  const skin = zombieSkin(def.skin);
  const pal: Record<string, number> = {};
  for (const [k, v] of Object.entries(base)) pal[k] = k === 'k' || k === 'b' ? v : dull(v);
  pal.s = skin;
  pal.z = dark(skin, 0.68);
  pal.l = lerpC(skin, 0xffffff, 0.35);
  pal.e = 0xf2f2c0; // pale eyes
  pal.r = 0xd03030; // the other eye is red
  pal.m = 0x2a1020; // dark open mouth
  pal.n = dark(pal.c, 0.58); // torn / dirty patch
  // keep the identity colours reasonably strong
  pal.a = base.a === base.c ? pal.c : dull(base.a);
  pal.w = lerpC(0xf4f4f4, 0xb8c0a8, 0.28);
  return { rows: g.map((r) => r.join('')), pal };
}

const GOLD = 0xf0b020;
export const CURE_ITEM_SPRITES: Record<string, SpriteDef> = {
  item_mirror: {
    rows: ['..kkkk..', '.kwlllk.', '.kllllk.', '.kllllk.', '..kkkk..', '...yy...', '...yy...', '...kk...'],
    pal: { k: 0x1a1c2c, w: 0xf4f4f4, l: 0x9fd4ea, y: GOLD },
  },
  item_mic: {
    rows: ['..kkkk..', '.kgwggk.', '.kgggwk.', '..kkkk..', '...rr...', '...kk...', '...kk...', '...kk...'],
    pal: { k: 0x1a1c2c, g: 0x94b0c2, w: 0xf4f4f4, r: 0xb13e53 },
  },
  item_duster: {
    rows: ['.f.ff.f.', '.ffffff.', 'fpfffpf.', '..ffff..', '...kk...', '...bb...', '...bb...', '...kk...'],
    pal: { k: 0x1a1c2c, f: 0xe8588a, p: 0xf8a8c8, b: 0x8a5a3b },
  },
  item_umbrella: {
    rows: ['...kk...', '..kbbk..', '.kbbwbbk', 'kbwbbbwk', 'kkkkkkkk', '....k...', '....k...', '...kk...'],
    pal: { k: 0x1a1c2c, b: 0x3b5dc9, w: 0xf4f4f4 },
  },
  item_plectrum: {
    rows: ['........', '.kkkkkk.', 'kroorrrk', 'krorrrrk', '.krrrrk.', '.krrrrk.', '..krrk..', '...kk...'],
    pal: { k: 0x1a1c2c, r: 0xd9502e, o: 0xffa070 },
  },
  item_pint: {
    rows: ['.kwwwwk.', '.kwwwwk.', '.kyyyyk.', '.kyoyyk.', '.kyyyyk.', '.kyyoyk.', '..kyyk..', '..kkkk..'],
    pal: { k: 0x1a1c2c, w: 0xf4f4f4, y: 0xd9902a, o: 0xffcd75 },
  },
  item_trophy: {
    rows: ['.kkkkkk.', 'kkywyykk', 'k.kyyk.k', '..kyyk..', '...yy...', '...yy...', '.kkkkkk.', '.kbbbbk.'],
    pal: { k: 0x1a1c2c, y: GOLD, w: 0xfff0a0, b: 0x8a5a3b },
  },
};

/** Thought bubble 12x11: the clear window for the 8x8 item is x 2..9, y 1..8. */
export const WANT_BUBBLE: SpriteDef = {
  rows: [
    '.kkkkkkkkkk.',
    'kwwwwwwwwwwk',
    'kwwwwwwwwwwk',
    'kwwwwwwwwwwk',
    'kwwwwwwwwwwk',
    'kwwwwwwwwwwk',
    'kwwwwwwwwwwk',
    'kwwwwwwwwwwk',
    'kwwwwwwwwwwk',
    '.kkkkkkkkkk.',
    '..kwk.......',
    '...k........',
  ],
  pal: { k: 0x1a1c2c, w: 0xf4f4f4 },
};
