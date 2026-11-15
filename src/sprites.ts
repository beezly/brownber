import Phaser from './phaser';
import { PAL } from './palette';
import { BINKS_FRAMES, BINKS_PAL, CHARACTERS, FRAMES, buildFrame, charPalette } from './characters';

type Pal = Record<string, number>;

/** Bake a pixel map (array of strings) into a texture. '.' is transparent. */
export function bake(scene: Phaser.Scene, key: string, rows: string[], pal: Pal) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  const w = Math.max(...rows.map((r) => r.length));
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = pal[row[x]];
      if (c === undefined) continue;
      g.fillStyle(c, 1);
      g.fillRect(x, y, 1, 1);
    }
  });
  g.generateTexture(key, w, rows.length);
  g.destroy();
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
  // a little speech-bubble marker shown above talkable NPCs
  bake(scene, 'bubble', ['.kkkkk.', 'kwwwwwk', 'kwkwkwk', 'kwwwwwk', '.kkwkk.', '...k...'], { k: PAL.ink, w: PAL.white });
}
