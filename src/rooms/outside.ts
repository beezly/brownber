import { PAL } from '../palette';
import type { RoomDef, SpriteDef } from '../rooms';

// OUTSIDE zone: Drive -> Terrace -> Fire Pit -> (up) Fells. Evening, stars, the Howgill Fells on the horizon.
//
// Fire pit finale (room 'firepit'): the three 'O' tiles are at row 20, cols 8-10 (pixels x 64-88, y 160-168),
// standing on the grass floor (row 21). Clear open space: cols 1-17, rows 8-20 (nothing solid at all);
// the corridor rows 16-20 run unobstructed from the left doorway (col 0) to col 18.

const SKY = 0x1a2150; // night sky
const FELLS = 0x0f1432; // the fells' silhouette

export const ROOMS_OUTSIDE: Record<string, RoomDef> = {
  drive: {
    id: 'drive',
    music: 'jaunty',
    name: 'The Drive & Cattle Grid (Doomed)',
    theme: {
      bg: SKY, motif: PAL.white, motifKind: 'sky', wall: PAL.grey, wallDark: FELLS, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: PAL.green, bar: PAL.navy, barText: PAL.yellow,
    },
    exits: { left: 'porch', right: 'terrace' },
    pos: { x: 4, y: 3 },
    signs: [
      { x: 70, y: 40, text: 'CATTLE GRID' },
      { x: 52, y: 52, text: 'WRONG ROAD? DOOMED!' },
      { x: 78, y: 64, text: 'SHUSH, SATNAV!' },
    ],
    map: [
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D........................*.....D',
      'D..............................D',
      'D.......................====...D',
      '..............*.................',
      '.......*........................',
      '....................====........',
      '......DDD.......................',
      '......DDD.......................',
      'GGGGGGGGGGGGGWWWWGGGGGGGGGGGGGGG',
    ],
    guardians: [
      { kind: 'walker', sprite: 'out_sheep', x1: 204, x2: 232, y: 156, speed: 0.5, harmless: true },
      { kind: 'flyer', sprite: 'out_crow', x1: 70, x2: 150, y: 100, amp: 6, speed: 0.6 },
    ],
    npcs: [],
    items: ['boot', 'cheese', 'satnav'],
  },

  terrace: {
    id: 'terrace',
    music: 'jaunty',
    name: 'The South-facing Terrace',
    theme: {
      bg: SKY, motif: PAL.white, motifKind: 'sky', wall: PAL.grey, wallDark: FELLS, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: PAL.green, bar: PAL.navy, barText: PAL.yellow,
    },
    exits: { left: 'drive', right: 'firepit' },
    pos: { x: 5, y: 3 },
    signs: [{ x: 96, y: 112, text: 'BBQ ->' }],
    map: [
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D..............................D',
      'D....*.........................D',
      'D..............................D',
      'D..-----..................-----D',
      'D.......................*......D',
      'D..............................D',
      'D.......----..........-----....D',
      '................................',
      '............*...................',
      '...----..........----...........',
      '...........----..........F......',
      '........N...........DDDDDDD.....',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    guardians: [{ kind: 'flyer', sprite: 'out_cockatiel', x1: 30, x2: 190, y: 70, amp: 12, speed: 0.7, harmless: true }],
    npcs: [
      {
        id: 'sophie',
        lines: [
          "Cup of tea? I made one. Now I can't find it. Again.",
          'That cockatiel up in the trees is mine. He only comes down for toast.',
          'Look at the fells in this light. Worth the drive. Even the cattle grid.',
        ],
        byHero: {
          leo: [
            'Leo! Are you playing later, by the fire? The cockatiel has been rehearsing.',
            "He only knows the chorus of 'Where Is Maffa's Lighter'. He whistles it flat.",
          ],
        },
      },
    ],
    items: ['blanket', 'sausage', 'prosecco'],
  },

  firepit: {
    id: 'firepit',
    music: 'night',
    name: 'The Fire Pit',
    theme: {
      bg: SKY, motif: PAL.white, motifKind: 'sky', wall: PAL.grey, wallDark: FELLS, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: PAL.green, bar: PAL.navy, barText: PAL.yellow,
    },
    exits: { left: 'terrace', up: 'fells' },
    pos: { x: 6, y: 3 },
    signs: [{ x: 96, y: 44, text: 'TO THE FELLS ^' }],
    map: [
      'DDDDDDDDDDDDDDDDDDDDDD.........D',
      'D..............................D',
      'D..............................D',
      'D........................----..D',
      'D..............................D',
      'D..............................D',
      'D.........................----.D',
      'D........................*.....D',
      'D..............................D',
      'D.......................----...D',
      'D..............................D',
      'D..............................D',
      'D..................----........D',
      'D........................*.....D',
      'D..............................D',
      'D.......................----...D',
      '...............................D',
      '...............................D',
      '...................----........D',
      '...............................D',
      '........OOO.....N.............*D',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    guardians: [{ kind: 'flyer', sprite: 'out_moth', x1: 30, x2: 120, y: 60, amp: 12, speed: 0.5, harmless: true }],
    npcs: [
      {
        id: 'tom',
        lines: [
          'Friends! A few words. Beth has never been late, only ready slightly after everyone else.',
          'Curtis writes songs about it. Karla saves lives with tacos. Nick knows exactly when to bring a coat.',
          'Becca knows every capital city. Jonny knows every pub. A perfect team.',
          'And Maffa, finder of lighters. Right, who wants a marshmallow?',
        ],
        byHero: {
          luke: [
            'Luke! Can I just say, you are a wonderful, wonderful man.',
            'Even in pyjamas. Especially in pyjamas.',
          ],
        },
      },
    ],
    items: ['sparkler', 'marshmallows', 'firewood'],
  },

  fells: {
    id: 'fells',
    music: 'quest',
    name: 'Howgill Fells (Cautley Spout)',
    theme: {
      bg: SKY, motif: PAL.white, motifKind: 'sky', wall: PAL.grey, wallDark: FELLS, wallLight: PAL.lgrey,
      board: 0x7d8fa3, furniture: PAL.green, bar: PAL.navy, barText: PAL.yellow,
    },
    exits: { down: 'firepit' },
    pos: { x: 6, y: 2 },
    signs: [{ x: 16, y: 18, text: 'CAUTLEY SPOUT' }],
    map: [
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      'DDDDDDDDDD.....................D',
      'DDDDDDDDDD.....................D',
      'DDDDDDDDDD.............*.......D',
      'DDDDDDDDDD.....................D',
      'DDDWW.................====.....D',
      'DDDWW..........................D',
      'DDDWW..........................D',
      'DDDWW.............====.........D',
      'DDDWW........*.................D',
      'DDDWW..........................D',
      'DDDWW.......====...............D',
      'DDDWW..........................D',
      'DDDWW..........................D',
      'DDDWW...===....................D',
      'DDDWW..........................D',
      'DDDWW..........................D',
      'DDDWW.......====....====.......D',
      'DDDWW..*.......................D',
      'DDDWW..........................D',
      'DDDWWWDDDW...............====..D',
      'GDDGGGGGGGGGGGGGGGGGGG.........G',
    ],
    guardians: [
      { kind: 'walker', sprite: 'out_horse', x1: 88, x2: 120, y: 154, speed: 0.45, harmless: true },
      { kind: 'walker', sprite: 'out_horse', x1: 140, x2: 176, y: 154, speed: 0.4, harmless: true },
      { kind: 'flyer', sprite: 'out_crow', x1: 70, x2: 125, y: 16, amp: 4, speed: 0.5 },
    ],
    npcs: [],
    items: ['telescope', 'wool', 'torch'],
  },
};

export const SPRITES_OUTSIDE: Record<string, SpriteDef> = {
  // ---- guardians
  out_sheep: {
    rows: [
      '................',
      '...wwwww........',
      '..wwwwwwww.kkk..',
      '.wwwwwwwwwwkkkk.',
      '.wwwwwwwwwwkwkk.',
      '.wwwwwwwwwwkkkk.',
      '..wwwwwwwww.kk..',
      '..wwwwwwwww.....',
      '...k..k...k..k..',
      '...k..k...k..k..',
      '...k..k...k..k..',
      '...k..k...k..k..',
    ],
    pal: { w: PAL.white, k: PAL.ink },
  },
  out_crow: {
    rows: [
      'k........k',
      'kk......kk',
      '.kkk..kkk.',
      '..kkkkkk..',
      '...kkkkko.',
      '....k.k...',
    ],
    pal: { k: PAL.ink, o: PAL.orange },
  },
  out_cockatiel: {
    rows: [
      '..y.......',
      '..yy......',
      '..yyyy....',
      '.yyywyoo..',
      '.yyyyyoo..',
      'gyyyyyy...',
      'ggyyyyy...',
      '.ggyyy....',
      '..k.k.....',
    ],
    pal: { y: PAL.yellow, g: PAL.lgrey, o: PAL.orange, w: PAL.ink },
  },
  out_moth: {
    rows: [
      '..k..k..',
      '.k.kk.k.',
      'ppykkypp',
      'ppykkypp',
      '.pp..pp.',
    ],
    pal: { k: PAL.ink, p: PAL.peach, y: PAL.yellow },
  },
  out_horse: {
    rows: [
      '...........b.b..',
      '..........bbbbb.',
      '..........bbkbbb',
      '.........dbbbbbb',
      '........ddbbbbb.',
      '.bbbbbbbddbbb...',
      'dbbbbbbbbbbb....',
      'dbbbbbbbbbbb....',
      '.bbbbbbbbbbb....',
      '..bbbbbbbbbb....',
      '..bb.bb..bb.bb..',
      '..bb.bb..bb.bb..',
      '..bb.bb..bb.bb..',
      '..kk.kk..kk.kk..',
    ],
    pal: { b: PAL.brown, d: 0x5a3a22, k: PAL.ink },
  },

  // ---- items (8x8)
  item_satnav: {
    rows: ['.kkkkkk.', 'kbbbbbbk', 'kbbbwbbk', 'kbbwwwbk', 'kbbbwbbk', 'kkkkkkkk', '..kggk..', '...kk...'],
    pal: { k: PAL.ink, b: PAL.blue, w: PAL.white, g: PAL.lgrey },
  },
  item_sausage: {
    rows: ['........', '.kkkkkk.', 'kppppppk', 'krrrrrrk', 'krrwrrrk', 'kppppppk', '.kkkkkk.', '........'],
    pal: { k: PAL.ink, p: PAL.peach, r: PAL.red, w: PAL.orange },
  },
  item_sparkler: {
    rows: ['.y..w..y', '..y.y.y.', '...yoy..', '....g...', '....g...', '....g...', '....g...', '....k...'],
    pal: { y: PAL.yellow, w: PAL.white, o: PAL.orange, g: PAL.lgrey, k: PAL.ink },
  },
  item_marshmallows: {
    rows: ['..kkkk..', '.kbbbbk.', 'kwwwwwwk', 'kwpwwpwk', 'kwwwwwwk', 'kwpwwwwk', 'kwwwwwwk', '.kkkkkk.'],
    pal: { k: PAL.ink, b: PAL.blue, w: PAL.white, p: PAL.peach },
  },
  item_firewood: {
    rows: ['........', '..kkkk..', '.kbyybk.', 'kkkkkkkk', 'kbykkbyk', 'kbbkkbbk', 'kkkkkkkk', '........'],
    pal: { k: PAL.ink, b: PAL.brown, y: PAL.yellow },
  },
  item_wool: {
    rows: ['........', '..kkk...', '.kwwwk..', 'kwwwwwk.', 'kwwgwwwk', '.kwwwwk.', '..kkkk..', '........'],
    pal: { k: PAL.ink, w: PAL.white, g: PAL.lgrey },
  },
  item_torch: {
    rows: ['.y.yy.y.', '..kkkk..', '..kyyk..', '...kk...', '...rr...', '...rr...', '...rr...', '...kk...'],
    pal: { k: PAL.ink, y: PAL.yellow, r: PAL.red },
  },
  item_telescope: {
    rows: ['......bk', '.....bbk', '...bbbk.', '..bbbk..', '...k.k..', '..kbk...', '..k.k...', '.k...k..'],
    pal: { k: PAL.ink, b: PAL.yellow },
  },
};
