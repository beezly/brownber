import { PAL } from '../palette';
import type { RoomDef, SpriteDef } from '../rooms';

// The rest of the ground floor: dining room, drawing room, pantry and wine cellar.
//
// Pantry <-> cellar link: the pantry floor (row 21) has a gap in cols 10-17 and the cellar ceiling
// (row 0) has the identical gap. A short '=' bridge sits at row 20 over the middle of the gap
// (cols 12-15) in the pantry, so jumping up out of the cellar lands you on it. Drop into the cellar
// by walking into the uncovered ends of the gap (cols 10-11 / 16-17).

export const ROOMS_GROUND: Record<string, RoomDef> = {
  dining: {
    id: 'dining',
    music: 'waltz',
    name: 'The Dining Room (Seats Sixteen)',
    theme: {
      bg: 0x4a1a2c, motif: 0x642338, motifKind: 'stripes', wall: PAL.grey, wallDark: PAL.slate, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: 0xc98a4b, bar: PAL.yellow, barText: PAL.ink,
    },
    exits: { left: 'kitchen', right: 'sitting' },
    pos: { x: 2, y: 2 },
    map: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..*........................*..#',
      '#-----....................-----#',
      '#..............................#',
      '...............*...F....N.......',
      '.......------------------.......',
      '................................',
      '....--....................--....',
      '................................',
      '################################',
    ],
    guardians: [{ kind: 'walker', sprite: 'gr_trolley', x1: 56, x2: 200, y: 156, speed: 0.7 }],
    npcs: [
      {
        id: 'debra',
        lines: [
          'This table seats sixteen. I have rearranged it eleven times already.',
          'I only moved the candlesticks half an inch. Nobody should notice.',
          'If something has gone missing it is not lost. It is "tidied". There is a difference.',
        ],
        byHero: {
          maffa: [
            "Lost your lighter AGAIN, Maffa? I didn't tidy it away, honest.",
            'Binks was last seen bounding up the stairs with something shiny...',
          ],
        },
      },
    ],
    items: ['coffee', 'cookie', 'cracker'],
  },

  drawing: {
    id: 'drawing',
    music: 'waltz',
    name: 'The Drawing Room (Bay Window)',
    theme: {
      bg: 0x2c3f68, motif: 0x3a5084, motifKind: 'stripes', wall: PAL.grey, wallDark: PAL.slate, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: PAL.red, bar: PAL.blue, barText: PAL.white,
    },
    exits: { left: 'stairs' },
    pos: { x: 5, y: 2 },
    signs: [{ x: 176, y: 40, text: 'BAY WINDOW' }],
    map: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#........*.....................#',
      '#.......-----..................#',
      '............................*..#',
      '..........................-----#',
      '.....*......------....N........#',
      '....----............-----......#',
      '...............................#',
      '################################',
    ],
    guardians: [
      { kind: 'walker', sprite: 'gr_cat', x1: 56, x2: 176, y: 158, speed: 0.6 },
      { kind: 'flyer', sprite: 'gr_moth', x1: 120, x2: 216, y: 100, amp: 10, speed: 0.6 },
    ],
    npcs: [
      {
        id: 'beez',
        lines: [
          'Has anyone seen my phone? I had it a minute ago. Possibly several minutes ago.',
          'Keys, wallet, my other shoe... they are all in this house somewhere. Probably.',
          'Debra keeps moving my stuff. Or I leave it everywhere. Hard to say, really.',
        ],
      },
    ],
    items: ['phone', 'tea', 'blanket'],
  },

  pantry: {
    id: 'pantry',
    music: 'bustle',
    name: 'The Pantry (Do Not Disturb The Cake)',
    theme: {
      bg: 0x3e2d22, motif: 0x54402f, motifKind: 'tiles', wall: PAL.grey, wallDark: PAL.slate, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: 0xd9b27a, bar: PAL.yellow, barText: PAL.ink,
    },
    exits: { right: 'kitchen', down: 'cellar' },
    pos: { x: 0, y: 2 },
    map: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#......*........................',
      '#....------.....................',
      '#...............................',
      '#...........................*...',
      '#------...................-----#',
      '#..............................#',
      '#.......*......................#',
      '#....------...------..------...#',
      '#..............................#',
      '#..............................#',
      '#------...........------.......#',
      '#..............................#',
      '#...........====...............#',
      '##########........##############',
    ],
    guardians: [
      { kind: 'walker', sprite: 'gr_mouse', x1: 152, x2: 240, y: 162, speed: 0.5 },
      { kind: 'walker', sprite: 'gr_mouse', x1: 8, x2: 64, y: 162, speed: 0.4 },
    ],
    npcs: [],
    items: ['sourdough', 'marmalade', 'cake'],
  },

  cellar: {
    id: 'cellar',
    music: 'crypt',
    name: 'The Wine Cellar (Drip, Drip)',
    theme: {
      bg: 0x14152a, motif: 0x20223d, motifKind: 'stone', wall: PAL.grey, wallDark: PAL.slate, wallLight: PAL.lgrey,
      board: 0x6b6f86, furniture: PAL.brown, bar: PAL.plum, barText: PAL.white,
    },
    exits: { up: 'pantry' },
    pos: { x: 0, y: 3 },
    signs: [{ x: 28, y: 12, text: 'PANTRY ^' }],
    map: [
      '##########........##############',
      '#..............................#',
      '#..............................#',
      '#.................*............#',
      '#.......============...........#',
      '#..............................#',
      '#..............................#',
      '#...=======....................#',
      '#..............................#',
      '#..............................#',
      '#........=======...............#',
      '#..............................#',
      '#..............................#',
      '#...=======....................#',
      '#............................*.#',
      '#........................------#',
      '#........=======...............#',
      '#..............................#',
      '#.....................-------..#',
      '#...=======....................#',
      '#..................*...........#',
      '################################',
    ],
    guardians: [
      { kind: 'floater', sprite: 'gr_drip', x: 150, y1: 8, y2: 100, speed: 0.8 },
      { kind: 'walker', sprite: 'gr_rat', x1: 96, x2: 176, y: 160, speed: 0.6 },
    ],
    npcs: [],
    items: ['prosecco', 'wine', 'cheese'],
  },
};

export const SPRITES_GROUND: Record<string, SpriteDef> = {
  // ---- items (8x8)
  item_cracker: {
    rows: ['........', '........', 'y.rrrr.y', 'yyrwwryy', 'y.rrrr.y', '........', '........', '........'],
    pal: { y: PAL.yellow, r: PAL.red, w: PAL.white },
  },
  item_phone: {
    rows: ['..kkkk..', '.kbbbbk.', '.kbwwbk.', '.kbbbbk.', '.kbbbbk.', '.kbbbbk.', '.kkkkkk.', '..kkkk..'],
    pal: { k: PAL.ink, b: 0x7fd3f0, w: PAL.white },
  },
  item_wine: {
    rows: ['...kk...', '...kk...', '...kk...', '..rrrr..', '..rwwr..', '..rrrr..', '..rrrr..', '..kkkk..'],
    pal: { k: PAL.ink, r: 0x8a1f3a, w: PAL.lgrey },
  },

  // ---- guardians
  gr_trolley: {
    rows: [
      '.....g....ww....',
      '....ggg...ww....',
      '....ggg..wwww...',
      'bbbbbbbbbbbbbbbb',
      'b..rr..yy..rr..b',
      'b..rr..yy..rr..b',
      'bbbbbbbbbbbbbbbb',
      'b..............b',
      'b..............b',
      'b..............b',
      '.kk..........kk.',
      '.kk..........kk.',
    ],
    pal: { g: PAL.green, w: PAL.lgrey, b: 0xd8a84a, r: PAL.red, y: PAL.yellow, k: PAL.ink },
  },
  gr_cat: {
    rows: [
      '..........o.o.',
      'o........oooo.',
      'o..ooooooooeoo',
      'o.oooooooooooo',
      'o.ssoossooooo.',
      '.ooooooooooo..',
      '.oooooooooooo.',
      '.oo.oo..oo.oo.',
      '.kk.kk..kk.kk.',
    ],
    pal: { o: PAL.orange, s: 0xb0502a, e: PAL.lime, k: PAL.ink },
  },
  gr_moth: {
    rows: [
      '.ww......ww.',
      'wwww.kk.wwww',
      'wwwwwkkwwwww',
      'wdwwwkkwwwdw',
      '.wwwwkkwwww.',
      '..ww.kk.ww..',
    ],
    pal: { w: 0xc9b8e8, d: PAL.plum, k: PAL.ink },
  },
  gr_mouse: {
    rows: [
      '......kk..',
      '..kkkkgpk.',
      '.kgggggggk',
      'pgggggggek',
      '.kgggggggn',
      '..kk.kk...',
    ],
    pal: { k: PAL.ink, g: PAL.lgrey, p: 0xf0a0c0, e: PAL.red, n: 0xf0a0c0 },
  },
  gr_rat: {
    rows: [
      '.......kk...',
      '..kkkkkkgk..',
      '.kbbbbbbbbk.',
      'pbbbbbbbbbek',
      '.kbbbbbbbbbn',
      '..kk..kk.k..',
    ],
    pal: { k: PAL.ink, b: 0x6b4a3a, g: 0x8a6a58, p: 0xf0a0c0, e: PAL.red, n: 0xf0a0c0 },
  },
  gr_drip: {
    rows: ['..bb..', '..bb..', '.bbbb.', '.bwbb.', 'bbwbbb', 'bbbbbb', 'bbbbbb', '.bbbb.', '..bb..'],
    pal: { b: 0x5fc8e8, w: PAL.white },
  },
};
