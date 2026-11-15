import Phaser from './phaser';
import { PAL } from './palette';
import { BINKS_FRAMES, BINKS_PAL, CHARACTERS, FRAMES, buildFrame, charPalette } from './characters';
import { EXTRA_SPRITES } from './rooms';
import { is16 } from './settings';
import { zombieFrame, CURE_ITEM_SPRITES, WANT_BUBBLE } from './zombie-art';
import { darken, lighten } from './colour';

type Pal = Record<string, number>;

const baked = new Set<string>();

/** Bake a pixel map (array of strings) into a texture. '.' is transparent.
 *  In 16-bit mode the sprite is shaded automatically (see shade16). */
export function bake(scene: Phaser.Scene, key: string, rows: string[], pal: Pal) {
  if (scene.textures.exists(key)) return;
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  let grid: (number | null)[][] = rows.map((row) => Array.from({ length: w }, (_, x) => pal[row[x]] ?? null));
  if (is16()) grid = shade16(grid, pal.k ?? PAL.ink);
  const g = scene.add.graphics();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      if (c === null) continue;
      g.fillStyle(c, 1);
      g.fillRect(x, y, 1, 1);
    }
  }
  g.generateTexture(key, w, h);
  g.destroy();
  baked.add(key);
}

/**
 * 16-bit look: light from the top-left. Interior pixels next to an edge above/left get a
 * highlight, those next to an edge below/right get a shadow, and black outlines become a dark
 * shade of the colour they wrap (as 16-bit sprite artists liked to do).
 */
function shade16(grid: (number | null)[][], outline: number): (number | null)[][] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const at = (x: number, y: number) => (y < 0 || y >= h || x < 0 || x >= w ? null : grid[y][x]);
  const isEdge = (c: number | null) => c === null || c === outline || c === PAL.ink;
  const out = grid.map((row) => row.slice());
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      if (c === null) continue;
      if (c === outline || c === PAL.ink) {
        // coloured outline: darken the most common neighbouring fill colour
        const counts = new Map<number, number>();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = at(x + dx, y + dy);
          if (n !== null && !isEdge(n)) counts.set(n, (counts.get(n) ?? 0) + 1);
        }
        let best: number | null = null;
        let bc = 0;
        for (const [n, k] of counts) if (k > bc) [best, bc] = [n, k];
        out[y][x] = best === null ? c : darken(best, 0.62);
        continue;
      }
      const top = isEdge(at(x, y - 1)) || isEdge(at(x - 1, y));
      const bottom = isEdge(at(x, y + 1)) || isEdge(at(x + 1, y));
      if (top && !bottom) out[y][x] = lighten(c, 0.28);
      else if (bottom && !top) out[y][x] = darken(c, 0.22);
    }
  }
  return out;
}

/** Throw away every baked sprite and bake them again (after switching 8-bit/16-bit). */
export function rebakeAll(scene: Phaser.Scene) {
  for (const k of baked) if (scene.textures.exists(k)) scene.textures.remove(k);
  baked.clear();
  bakeAll(scene);
}

// 8x8 party items
const ITEMS: Record<string, { rows: string[]; pal: Pal }> = {
  sourdough: {
    rows: ['........', '..kkkk..', '.kbbbbk.', 'kbybybbk', 'kbbbbbbk', 'kbbbbbbk', '.kkkkkk.', '........'],
    pal: { k: 0x5a2e14, b: 0xc98a4b, y: PAL.yellow },
  },
  marmalade: {
    rows: ['..kkkk..', '..wwww..', '.kooook.', '.koyook.', '.kooook.', '.kooook.', '.kkkkkk.', '........'],
    pal: { k: PAL.ink, w: PAL.white, o: PAL.orange, y: PAL.yellow },
  },
  prosecco: {
    rows: ['...yy...', '...gg...', '...gg...', '..gggg..', '..gyyg..', '..gggg..', '..gggg..', '..kkkk..'],
    pal: { y: PAL.yellow, g: PAL.green, k: PAL.ink },
  },
  cake: {
    rows: ['...r....', '...w....', '.pppppp.', '.wwwwww.', '.pppppp.', '.bbbbbb.', '.kkkkkk.', '........'],
    pal: { r: PAL.red, w: PAL.white, p: 0xf0a0c0, b: 0xc98a4b, k: PAL.ink },
  },
  cookie: {
    rows: ['........', '..bbbb..', '.bkbbbb.', '.bbbbkb.', '.bbkbbb.', '.bbbbbb.', '..bbbb..', '........'],
    pal: { b: 0xd9a05a, k: 0x5a2e14 },
  },
  coffee: {
    rows: ['..w.w...', '...w....', '.kkkkk..', '.kbbbkkk', '.kbbbk.k', '.kbbbkkk', '..kkk...', '........'],
    pal: { w: PAL.lgrey, k: PAL.white, b: 0x5a2e14 },
  },
  tea: {
    rows: ['........', '..kkkk..', '..wwww..', '.wwwwwwk', '.wwwwww.', '.wwwwwwk', '..wwww..', '..kkkk..'],
    pal: { k: PAL.grey, w: PAL.white },
  },
  cheese: {
    rows: ['........', '......y.', '....yyy.', '..yyyyy.', 'yyyoyyy.', 'yyyyyoy.', 'yoyyyyy.', 'kkkkkkk.'],
    pal: { y: PAL.yellow, o: PAL.orange, k: 0xc9a050 },
  },
  boot: {
    rows: ['..gggg..', '..gggg..', '..gggg..', '..gggg..', '..gggg..', '..ggggg.', '..gggggg', '..kkkkkk'],
    pal: { g: PAL.green, k: PAL.ink },
  },
  blanket: {
    rows: ['........', 'rrwrrwrr', 'rrwrrwrr', 'wwwwwwww', 'rrwrrwrr', 'rrwrrwrr', 'wwwwwwww', '........'],
    pal: { r: PAL.red, w: PAL.yellow },
  },
  binoculars: {
    rows: ['........', '.kk..kk.', '.kk..kk.', 'kbbkkbbk', 'kbbkkbbk', 'kbbk.bbk', '.kk...kk', '........'],
    pal: { k: PAL.ink, b: PAL.slate },
  },
  porkpie: {
    rows: ['........', '..bbbb..', '.byyyyb.', 'byybbyyb', 'bbbbbbbb', 'bwwwwwwb', '.bbbbbb.', '........'],
    pal: { b: 0xb8743a, y: 0xd99a50, w: 0xf0c890 },
  },
  milk: {
    rows: ['..gggg..', '..gwwg..', '..gwwg..', '..gwwg..', '..gwwg..', '..gwwg..', '..gwwg..', '..gggg..'],
    pal: { g: PAL.lgrey, w: PAL.white },
  },
  lighter: {
    rows: ['....y...', '...yoy..', '...yoy..', '..kgggk.', '..krrrk.', '..krwrk.', '..krrrk.', '..kkkkk.'],
    pal: { y: PAL.yellow, o: PAL.orange, k: PAL.ink, g: PAL.lgrey, r: PAL.red, w: PAL.white },
  },
  thermos: {
    rows: ['..kkk...', '..rrr...', '..bbb...', '..bbb.k.', '..bwb.k.', '..bbbkk.', '..bbb...', '..kkk...'],
    pal: { k: PAL.ink, r: PAL.red, b: PAL.blue, w: PAL.white },
  },
};

export const ITEM_KEYS = Object.keys(ITEMS);

const HOOVER = {
  rows: [
    '.....kkkkkk.....',
    '...kkrrrrrrkk...',
    '..krrrrrrrrrrk..',
    '.krrryrrrryrrrk.',
    '.kkkkkkkkkkkkkk.',
    'kggggggggggggggk',
    '.kk..........kk.',
    '................',
  ],
  pal: { k: PAL.ink, r: PAL.slate, y: PAL.red, g: PAL.grey },
};

const JAR = {
  rows: [
    '..kkkkkkkk..',
    '..wwwwwwww..',
    '.kooooooook.',
    'kooowooowook',
    'kookkookkook',
    'koooooooooook'.slice(0, 12),
    'kookooookook',
    'koookkkkoook',
    'koooooooooook'.slice(0, 12),
    '.kooooooook.',
    '..kkkkkkkk..',
    '............',
  ],
  pal: { k: PAL.ink, w: PAL.white, o: PAL.orange },
};

export function bakeAll(scene: Phaser.Scene) {
  for (const def of CHARACTERS) {
    const pal = charPalette(def);
    for (const f of FRAMES) bake(scene, `${def.id}_${f}`, buildFrame(def, f), pal);
  }
  bake(scene, 'binks_a', BINKS_FRAMES.a, BINKS_PAL);
  bake(scene, 'binks_b', BINKS_FRAMES.b, BINKS_PAL);
  for (const [k, v] of Object.entries(ITEMS)) bake(scene, `item_${k}`, v.rows, v.pal);
  bake(scene, 'hoover', HOOVER.rows, HOOVER.pal);
  bake(scene, 'jar', JAR.rows, JAR.pal);
  for (const [k, v] of Object.entries(EXTRA_SPRITES)) bake(scene, k, v.rows, v.pal);
  // Zombie Night: zombie versions of everyone, cure items and the "wants" bubble
  for (const def of CHARACTERS) {
    for (const f of FRAMES) {
      const z = zombieFrame(def, f);
      bake(scene, `${def.id}_z_${f}`, z.rows, z.pal);
    }
  }
  for (const [k, v] of Object.entries(CURE_ITEM_SPRITES)) bake(scene, k, v.rows, v.pal);
  bake(scene, 'want_bubble', WANT_BUBBLE.rows, WANT_BUBBLE.pal);
  // a little speech-bubble marker shown above talkable NPCs
  bake(scene, 'bubble', ['.kkkkk.', 'kwwwwwk', 'kwkwkwk', 'kwwwwwk', '.kkwkk.', '...k...'], { k: PAL.ink, w: PAL.white });
}
