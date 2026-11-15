import { PAL } from './palette';
import type { AbilityId } from './abilities';

// Each friend is built from a shared 16x24 body template plus their own
// hair, skin, glasses, beard, outfit and one signature detail, so they are
// recognisable even at tiny size. Portraits (48x48) are made from photos by
// tools/make_portraits.py.

export type Hair = 'short' | 'messy' | 'bald' | 'bob' | 'long' | 'longWavy' | 'tied' | 'cap' | 'shaved';
export type Beard = 'none' | 'full' | 'goatee' | 'stubble';
export type Outfit = 'tee' | 'leafTop' | 'plaid' | 'scarf' | 'suit' | 'dress' | 'shirt' | 'cardigan' | 'pyjamas' | 'stripes';
export type Prop = 'wine' | 'milk' | 'guitar' | 'tea' | 'pint';

export interface CharDef {
  id: string;
  name: string;
  partner?: string;
  hair: Hair;
  hairColor: number;
  skin: number;
  glasses?: boolean;
  glassesColor?: number;
  beard: Beard;
  beardColor?: number;
  outfit: Outfit;
  top: number;
  accent?: number; // pattern / scarf / tie colour
  legs: number;
  prop?: Prop;
  ability: AbilityId;
  placeholder?: boolean; // no photo yet
  portrait?: string; // key of 48x48 portrait in public/portraits
  blurb: string; // shown on character select
}

const SKIN_LIGHT = PAL.peach;
const SKIN_TAN = 0xd9a07a;
const SKIN_DARK = PAL.brown;

export const CHARACTERS: CharDef[] = [
  { id: 'beth', name: 'Beth', partner: 'curtis', hair: 'long', hairColor: 0x6b3f2a, skin: SKIN_LIGHT, beard: 'none', outfit: 'leafTop', top: PAL.slate, accent: PAL.white, legs: PAL.ink, portrait: 'beth', ability: 'late', blurb: 'Ready at 11:45. Ish.' },
  { id: 'curtis', name: 'Curtis', partner: 'beth', hair: 'bald', hairColor: SKIN_DARK, skin: SKIN_DARK, glasses: true, beard: 'goatee', beardColor: PAL.lgrey, outfit: 'tee', top: PAL.white, legs: PAL.navy, portrait: 'curtis', ability: 'keyboard', blurb: 'Never far from a keyboard' },
  { id: 'tom', name: 'Tom', partner: 'luke', hair: 'cap', hairColor: 0x2e3048, skin: SKIN_LIGHT, beard: 'stubble', beardColor: 0xe0a07e, outfit: 'tee', top: PAL.ink, accent: PAL.lgrey, legs: PAL.slate, portrait: 'tom', ability: 'fetch', blurb: 'Speeches in your honour, unprompted' },
  { id: 'luke', name: 'Luke', partner: 'tom', hair: 'messy', hairColor: 0x4a3626, skin: SKIN_LIGHT, glasses: true, glassesColor: 0xb8a060, beard: 'none', outfit: 'pyjamas', top: 0x8fb4d6, accent: PAL.white, legs: 0x8fb4d6, portrait: 'luke', ability: 'liedown', blurb: 'Pyjamas are daywear' },
  { id: 'maffa', name: 'Maffa', hair: 'bob', hairColor: 0x3e2a22, skin: SKIN_LIGHT, beard: 'none', outfit: 'shirt', top: 0xc8dcea, legs: PAL.slate, prop: 'milk', portrait: 'maffa', ability: 'laser', blurb: 'Lasers, pork pies, glass of milk' },
  { id: 'debra', name: 'Debra', hair: 'tied', hairColor: 0x8a5a3b, skin: SKIN_LIGHT, glasses: true, beard: 'none', outfit: 'scarf', top: PAL.green, accent: PAL.yellow, legs: PAL.ink, portrait: 'debra', ability: 'tidy', blurb: 'Tidies everything. Everything.' },
  { id: 'beez', name: 'Beez', hair: 'short', hairColor: 0x7a4a36, skin: SKIN_LIGHT, glasses: true, beard: 'full', beardColor: 0x9a7a6a, outfit: 'tee', top: PAL.slate, accent: PAL.grey, legs: PAL.navy, portrait: 'beez', ability: 'stuff', blurb: 'Leaves things all over the house' },
  { id: 'nick', name: 'Nick', partner: 'karla', hair: 'shaved', hairColor: 0xe8b898, skin: SKIN_LIGHT, beard: 'none', outfit: 'suit', top: PAL.blue, accent: PAL.navy, legs: PAL.blue, portrait: 'nick', ability: 'panic', blurb: 'Thumbs up! Unless it rains' },
  { id: 'karla', name: 'Karla', partner: 'nick', hair: 'longWavy', hairColor: 0x3e2a22, skin: SKIN_TAN, beard: 'none', outfit: 'dress', top: PAL.white, accent: PAL.red, legs: PAL.white, portrait: 'karla', ability: 'tacos', blurb: 'Tacos that could save your life' },
  { id: 'leo', name: 'Leo', partner: 'sophie', hair: 'messy', hairColor: 0x3e2a22, skin: SKIN_LIGHT, beard: 'stubble', beardColor: 0xd8a890, outfit: 'plaid', top: PAL.navy, accent: PAL.blue, legs: PAL.ink, portrait: 'leo', prop: 'guitar', ability: 'chord', blurb: 'Never without his guitar' },
  { id: 'sophie', name: 'Sophie', partner: 'leo', hair: 'long', hairColor: 0x6b3f2a, skin: SKIN_LIGHT, beard: 'none', outfit: 'cardigan', top: PAL.teal, accent: PAL.lgrey, legs: PAL.navy, portrait: 'sophie', prop: 'tea', ability: 'glide', blurb: 'Cup of tea, one cockatiel' },
  { id: 'jonny', name: 'Jonny', partner: 'becca', hair: 'short', hairColor: 0x7a4a2e, skin: 0xe0a890, beard: 'full', beardColor: 0xa8552a, outfit: 'tee', top: 0x5a3a34, legs: PAL.navy, prop: 'pint', portrait: 'jonny', ability: 'pint', blurb: 'Always ready with a pint' },
  { id: 'becca', name: 'Becca', partner: 'jonny', hair: 'bob', hairColor: 0x5a3a2c, skin: SKIN_LIGHT, beard: 'none', outfit: 'stripes', top: 0x1f5a3a, accent: 0xeeeadc, legs: PAL.navy, portrait: 'becca', ability: 'quiz', blurb: 'Secretly a quiz genius' },
];

/** Binks as a playable hero (unlocked by a 100% legend run). He isn't in CHARACTERS: he's a dog. */
export const BINKS_HERO: CharDef = {
  id: 'binks', name: 'Binks', hair: 'short', hairColor: 0xc46a2f, skin: 0xc46a2f, beard: 'none', outfit: 'tee',
  top: 0xc46a2f, legs: 0xc46a2f, ability: 'sniff', blurb: 'Bark! Herd them to the fire pit',
};

export const charById = (id: string) => (id === 'binks' ? BINKS_HERO : CHARACTERS.find((c) => c.id === id)!);

// ---------------------------------------------------------------------------
// Pixel templates. Legend:
//  . transparent  k outline  s skin  h hair  m mouth  e eye
//  c top  p legs  b shoes  a accent  g glasses  d beard  w white  q shades  v wine
// ---------------------------------------------------------------------------

const HEADS: Record<Hair, string[]> = {
  short: [
    '.....kkkkkk.....',
    '...kkhhhhhhkk...',
    '..khhhhhhhhhhk..',
    '.khhhhhhhhhhhhk.',
    '.khhhhsssssshhk.',
    '.khhssssssssssk.',
    '.khssssessseshk.',
    '.khssssessseshk.',
    '.kssssssssssssk.',
    '.ksssssssmmmssk.',
    '..kssssssssssk..',
    '...kkkkkkkkkk...',
  ],
  messy: [
    '...k.kk.kk.k....',
    '..khkhhkhhkhk...',
    '..khhhhhhhhhhk..',
    '.khhhhhhhhhhhhk.',
    '.khhhshhssshhhk.',
    '.khhssssssssssk.',
    '.khssssessseshk.',
    '.khssssessseshk.',
    '.kssssssssssssk.',
    '.ksssssssmmmssk.',
    '..kssssssssssk..',
    '...kkkkkkkkkk...',
  ],
  bald: [
    '.....kkkkkk.....',
    '...kksswssskk...',
    '..ksswwsssssssk.',
    '.kssssssssssssk.',
    '.kssssssssssssk.',
    '.kssssssssssssk.',
    '.ksssssesssessk.',
    '.ksssssesssessk.',
    '.kssssssssssssk.',
    '.ksssssssmmmssk.',
    '..kssssssssssk..',
    '...kkkkkkkkkk...',
  ],
  shaved: [
    '.....kkkkkk.....',
    '...kkhhhhhhkk...',
    '..khhhhhhhhhhk..',
    '.khhhhhhhhhhhhk.',
    '.kssssssssssssk.',
    '.kssssssssssssk.',
    '.ksssssesssessk.',
    '.ksssssesssessk.',
    '.kssssssssssssk.',
    '.kssssssmmmmssk.',
    '..kssssssssssk..',
    '...kkkkkkkkkk...',
  ],
  bob: [
    '.....kkkkkk.....',
    '...kkhhhhhhkk...',
    '..khhhhhhhhhhk..',
    '.khhhhhhhhhhhhk.',
    '.khhhhhhhhhhhhk.',
    '.khhhsssssssshk.',
    '.khhsssessseshk.',
    '.khhsssessseshk.',
    '.khhssssssssshk.',
    '.khhsssssmmmshk.',
    '.khhkssssssskhk.',
    '..kkkkkkkkkkkk..',
  ],
  long: [
    '.....kkkkkk.....',
    '...kkhhhhhhkk...',
    '..khhhhhhhhhhk..',
    '.khhhhhhhhhhhhk.',
    '.khhhhhhhhhhhhk.',
    '.khhhsssssssshk.',
    '.khhsssessseshk.',
    '.khhsssessseshk.',
    '.khhssssssssshk.',
    '.khhsssssmmmshk.',
    '.khhkssssssskhk.',
    '.khhkkkkkkkkkhk.',
  ],
  longWavy: [
    '....kkkkkkkk....',
    '..kkhhhhhhhhkk..',
    '.khhhhhhhhhhhhk.',
    'khhhhhhhhhhhhhhk',
    'khhhhhhsssshhhhk',
    'khhhsssssssssshk',
    'khhssssessessshk',
    'khhssssessessshk',
    'khhssssssssssshk',
    'khhssssmmmmmsshk',
    'khhhkssmmmsskhhk',
    'khhhkkkkkkkkkhhk',
  ],
  tied: [
    '.....kkkkkk.....',
    '...kkhhhhhhkk...',
    '.kkhhhhhhhhhhk..',
    'khhkhhhhhhhhhhk.',
    'khhkhhhssssshhk.',
    '.kkhssssssssssk.',
    '..khsssessseshk.',
    '..khsssessseshk.',
    '..kssssssssssk..',
    '..ksssssssmmmsk.',
    '...ksssssssssk..',
    '....kkkkkkkkk...',
  ],
  cap: [
    '....kkkkkkkk....',
    '...khhhqqqqhk...',
    '..khhhhhhhhhhk..',
    '.khhhhhhhhhhhhkk',
    '.kskkkkkkkkkkkkk',
    '.ksssssssssssk..',
    '.khssssessseshk.',
    '.khssssessseshk.',
    '.kssssssssssssk.',
    '.ksssssssmmmssk.',
    '..kssssssssssk..',
    '...kkkkkkkkkk...',
  ],
};

const BODY = [
  '....kcccccccck..',
  '...kccccccccck..',
  '..kscccccccccsk.',
  '..kscccccccccsk.',
  '...kccccccccck..',
  '...kpppppppppk..',
  '...kppppkppppk..',
];

const LEGS = {
  idle: ['...kppk..kppk...', '...kppk..kppk...', '...kppk..kppk...', '..kbbbk..kbbbk..', '..kkkkk..kkkkk..'],
  run1: ['..kppk....kppk..', '.kppk......kppk.', '.kppk......kppk.', 'kbbbk......kbbbk', 'kkkkk......kkkkk'],
  run2: ['....kpppk.......', '....kpppk.......', '....kpppk.......', '...kbbbbk.......', '...kkkkkk.......'],
  jump: ['...kppk..kppk...', '..kbbbk..kppk...', '..kkkkk..kbbbk..', '.........kkkkk..', '................'],
};

export type Frame = keyof typeof LEGS;
export const FRAMES: Frame[] = ['idle', 'run1', 'run2', 'jump'];

function setPx(rows: string[][], x: number, y: number, ch: string) {
  if (y >= 0 && y < rows.length && x >= 0 && x < 16) rows[y][x] = ch;
}
function getPx(rows: string[][], x: number, y: number) {
  return rows[y]?.[x] ?? '.';
}

/** Build a 16x24 frame (array of 24 strings) for a character. */
export function buildFrame(def: CharDef, frame: Frame): string[] {
  const head = HEADS[def.hair].map((r) => r.padEnd(16, '.').slice(0, 16));
  const rows = [...head, ...BODY, ...LEGS[frame]].map((r) => r.split(''));


  // beard
  if (def.beard !== 'none') {
    for (let y = 8; y <= 11; y++) {
      for (let x = 0; x < 16; x++) {
        const ch = getPx(rows, x, y);
        if (ch !== 's') continue;
        if (def.beard === 'full') {
          if (y >= 9 || x <= 3 || x >= 12) setPx(rows, x, y, 'd');
        } else if (def.beard === 'goatee') {
          if ((y === 10 && x >= 7 && x <= 12) || (y === 9 && (x === 8 || x === 12))) setPx(rows, x, y, 'd');
        } else if (def.beard === 'stubble') {
          if (y >= 9 && (x + y) % 2 === 0) setPx(rows, x, y, 'd');
        }
      }
    }
    if (def.beard === 'full') {
      // keep a little mouth visible
      for (let x = 9; x <= 11; x++) if (getPx(rows, x, 9) === 'd') setPx(rows, x, 9, 'm');
    }
  }

  // glasses: rims around both eyes plus a bridge
  if (def.glasses) {
    const eyeXs: number[] = [];
    for (let x = 0; x < 16; x++) if (getPx(rows, x, 6) === 'e') eyeXs.push(x);
    for (const ex of eyeXs) {
      for (const dx of [-1, 1]) {
        if (['s', 'h'].includes(getPx(rows, ex + dx, 6))) setPx(rows, ex + dx, 6, 'g');
        if (['s', 'h'].includes(getPx(rows, ex + dx, 7))) setPx(rows, ex + dx, 7, 'g');
      }
      if (['s', 'h'].includes(getPx(rows, ex, 5))) setPx(rows, ex, 5, 'g');
    }
    if (eyeXs.length === 2) for (let x = eyeXs[0] + 1; x < eyeXs[1]; x++) setPx(rows, x, 6, 'g');
  }

  // long hair falls over the shoulders
  if (def.hair === 'long' || def.hair === 'longWavy') {
    const len = def.hair === 'longWavy' ? 6 : 4;
    for (let y = 12; y < 12 + len; y++) {
      setPx(rows, 2, y, 'h');
      setPx(rows, 3, y, 'h');
      if (def.hair === 'longWavy') {
        setPx(rows, 1, y, y % 2 ? 'h' : 'k');
        setPx(rows, 13, y, 'h');
      }
    }
  }
  if (def.hair === 'bob') {
    setPx(rows, 2, 12, 'h');
    setPx(rows, 13, 12, 'h');
  }

  // outfits
  const body0 = 12;
  switch (def.outfit) {
    case 'leafTop':
      for (const [x, y] of [[5, 1], [9, 2], [7, 3], [11, 3], [6, 4], [10, 1]]) setPx(rows, x, body0 + y, 'a');
      setPx(rows, 3, body0 + 2, 's'); // bare arms
      setPx(rows, 12, body0 + 2, 's');
      break;
    case 'plaid':
      for (let y = 0; y < 5; y++)
        for (let x = 0; x < 16; x++) {
          if (getPx(rows, x, body0 + y) === 'c' && (x % 3 === 0 || y === 2)) setPx(rows, x, body0 + y, 'a');
        }
      break;
    case 'scarf':
      for (let x = 4; x <= 11; x++) setPx(rows, x, body0, 'a');
      setPx(rows, 9, body0 + 1, 'a');
      setPx(rows, 9, body0 + 2, 'a');
      setPx(rows, 10, body0 + 3, 'a');
      break;
    case 'suit':
      setPx(rows, 8, body0, 'w');
      setPx(rows, 9, body0, 'w');
      for (let y = 1; y < 4; y++) setPx(rows, 8, body0 + y, 'a'); // tie
      setPx(rows, 7, body0 + 1, 'w');
      setPx(rows, 9, body0 + 1, 'w');
      setPx(rows, 11, body0 + 2, 'w'); // buttonhole flower
      break;
    case 'dress':
      setPx(rows, 3, body0 + 2, 's');
      setPx(rows, 12, body0 + 2, 's');
      for (let x = 4; x <= 12; x++) if (getPx(rows, x, body0 + 4) === 'c') setPx(rows, x, body0 + 4, 'a');
      break;
    case 'cardigan':
      for (let y = 0; y < 5; y++) {
        for (const x of [4, 5, 11, 12]) if (getPx(rows, x, body0 + y) === 'c') setPx(rows, x, body0 + y, 'a');
      }
      break;
    case 'tee':
      if (def.accent !== undefined) {
        setPx(rows, 7, body0 + 2, 'a');
        setPx(rows, 8, body0 + 2, 'a');
        setPx(rows, 9, body0 + 2, 'a');
        setPx(rows, 8, body0 + 3, 'a');
      }
      break;
    case 'pyjamas':
      for (let y = 0; y < 5; y++)
        for (let x = 0; x < 16; x++) if (y % 2 === 1 && getPx(rows, x, body0 + y) === 'c') setPx(rows, x, body0 + y, 'a');
      for (let y = 5; y < 12; y++)
        for (let x = 0; x < 16; x++) if (x % 3 === 1 && getPx(rows, x, body0 + y) === 'p') setPx(rows, x, body0 + y, 'a');
      break;
    case 'stripes':
      for (let y = 0; y < 5; y++)
        for (let x = 0; x < 16; x++) if (y % 2 === 0 && getPx(rows, x, body0 + y) === 'c') setPx(rows, x, body0 + y, 'a');
      break;
    case 'shirt':
      setPx(rows, 8, body0, 'w');
      setPx(rows, 8, body0 + 2, 'k');
      break;
  }

  if (def.prop === 'milk' || def.prop === 'pint' || def.prop === 'tea') {
    const fill = def.prop === 'milk' ? 'w' : def.prop === 'pint' ? 'y' : 'u';
    const rim = def.prop === 'tea' ? 'w' : 'g2';
    setPx(rows, 14, body0, def.prop === 'pint' ? 'w' : rim === 'g2' ? 'x' : 'w');
    setPx(rows, 15, body0, def.prop === 'pint' ? 'w' : rim === 'g2' ? 'x' : 'w');
    setPx(rows, 14, body0 + 1, fill);
    setPx(rows, 15, body0 + 1, fill);
    setPx(rows, 14, body0 + 2, fill);
    setPx(rows, 15, body0 + 2, fill);
    setPx(rows, 13, body0 + 2, 's');
  }
  if (def.prop === 'guitar') {
    // guitar slung across the body: neck up to the left shoulder, body at the hip
    for (const [x, y] of [[4, 0], [5, 1], [6, 2]]) setPx(rows, x, body0 + y, 'k');
    for (const [x, y] of [[7, 2], [8, 2], [7, 3], [8, 3], [9, 3], [8, 4], [9, 4], [10, 4], [9, 5], [10, 5]]) setPx(rows, x, body0 + y, 'u');
    setPx(rows, 8, body0 + 3, 'k');
  }
  if (def.prop === 'wine') {
    setPx(rows, 14, body0, 'w');
    setPx(rows, 15, body0, 'w');
    setPx(rows, 14, body0 + 1, 'v');
    setPx(rows, 15, body0 + 1, 'v');
    setPx(rows, 14, body0 + 2, 'w');
    setPx(rows, 14, body0 + 3, 'w');
    setPx(rows, 13, body0 + 2, 's');
  }

  return rows.map((r) => r.join(''));
}

export function charPalette(def: CharDef): Record<string, number> {
  return {
    k: PAL.ink,
    s: def.skin,
    h: def.hairColor,
    m: 0xa0524a,
    e: PAL.ink,
    c: def.top,
    p: def.legs === PAL.ink ? PAL.slate : def.legs, // pure black would vanish into the outline
    b: PAL.ink,
    a: def.accent ?? def.top,
    g: def.glassesColor ?? (def.skin === SKIN_DARK ? PAL.lgrey : PAL.slate),
    x: PAL.lgrey, // glass rim
    y: 0xd9902a, // beer
    u: 0x8a5a3b, // tea / guitar wood
    d: def.beardColor ?? def.hairColor,
    w: PAL.white,
    q: PAL.lime,
    v: PAL.red,
  };
}

// --- Binks the Vizsla (16x12) ---
export const BINKS_FRAMES = {
  a: [
    '...........kkk..',
    '..........krrrk.',
    'k.........krekrk',
    'rk.......krrrrrn',
    '.rk.....krrrrkk.',
    '..krrrrrrrrrk...',
    '..krrrrrrrrrk...',
    '..kkrrrrrrrrk...',
    '...rr.....rr....',
    '...rr.....rr....',
    '...rr.....rr....',
    '...kk.....kk....',
  ],
  b: [
    '...........kkk..',
    '..........krrrk.',
    '.k........krekrk',
    'k.k......krrrrrn',
    '..rk....krrrrkk.',
    '..krrrrrrrrrk...',
    '..krrrrrrrrrk...',
    '..kkrrrrrrrrk...',
    '..rr.......rr...',
    '.rr.........rr..',
    '.rr.........rr..',
    '.kk.........kk..',
  ],
};
export const BINKS_PAL = { k: 0x5a2e14, r: 0xc46a2f, e: PAL.ink, n: 0x3a1f14 };
