import { PAL } from './palette';
import { ROOMS_GROUND, SPRITES_GROUND } from './rooms/ground';
import { ROOMS_UPSTAIRS, SPRITES_UPSTAIRS } from './rooms/upstairs';
import { ROOMS_OUTSIDE, SPRITES_OUTSIDE } from './rooms/outside';

// Rooms are 32x22 tiles of 8x8 px (256x176). Tile legend:
//  #  wall / solid            X  solid furniture (fridge)
//  =  floorboard platform (jump up through it, stand on top)
//  -  furniture platform (one-way, room's furniture colour)
//  C  crumbling floorboard    < >  conveyor (pushes left / right)
//  B  bouncy wellies          ^  spikes (deadly)
//  F  fire (deadly)           ~  coffee-machine steam vent (deadly when puffing)
//  *  party item              P  player start (first room only)
//  N  NPC stands here (see npcs list, in order)
//  G  grass ground (solid)     D  earth / stone (solid, outdoors)
//  W  water (deadly)           O  the fire pit (stand on it; with the lighter it starts the finale)
//  S  (runtime only) Beez's piles of stuff
// Open edges are exits; `exits` says which room they lead to.
//
// DOORWAY RULES (checked by tools/check_rooms.ts):
//  - left/right exits: the open rows at the edge column must be identical on both sides.
//    Standard doorway = rows 16-20 open, floor at row 21.
//  - up/down exits: the gap in the lower room's ceiling (row 0) must fit inside the gap in the
//    upper room's floor (row 21). Put a one-way '=' bridge at row 20 over part of the upper
//    room's gap: jumping up through it lands you on the bridge (ENTRY_BOOST helps you rise),
//    and walking off the bridge's ends drops you back down.

// Guardians. Coordinates are in pixels. x1/x2 bound the left edge of the sprite's patrol.
//  hoover / walker: walk left-right; y = top of the sprite. walker uses any sprite.
//  jar / floater:   move up-down between y1 and y2 (top of sprite).
//  flyer:           fly left-right while bobbing in a sine wave (amp px) around y.
//  binks:           the dog. y = the floor he runs on (feet). Knocks you back, never kills.
//  harmless: true makes a walker/flyer knock you back like Binks instead of killing.
export type GuardianDef =
  | { kind: 'hoover'; x1: number; x2: number; y: number; speed: number }
  | { kind: 'jar'; x: number; y1: number; y2: number; speed: number }
  | { kind: 'binks'; x1: number; x2: number; y: number }
  | { kind: 'walker'; sprite: string; x1: number; x2: number; y: number; speed: number; harmless?: boolean }
  | { kind: 'floater'; sprite: string; x: number; y1: number; y2: number; speed: number }
  | { kind: 'flyer'; sprite: string; x1: number; x2: number; y: number; amp: number; speed: number; harmless?: boolean };

/** A pixel-art sprite: rows of characters, each mapped to a colour by pal ('.' = transparent). */
export interface SpriteDef {
  rows: string[];
  pal: Record<string, number>;
}

export interface NpcDef {
  id: string; // character id from characters.ts. If the player IS this character, nobody stands here.
  lines: string[];
  byHero?: Record<string, string[]>; // different lines when you're playing as a specific friend
  pose?: 'lying';
}

export interface RoomDef {
  id: string;
  name: string;
  theme: {
    bg: number;
    motif: number;
    motifKind: 'dots' | 'leaf' | 'tiles' | 'fleur' | 'stripes' | 'sky' | 'stone' | 'plain';
    wall: number;
    wallDark: number;
    wallLight: number;
    board: number;
    furniture: number;
    bar: number;
    barText: number;
  };
  exits: { left?: string; right?: string; up?: string; down?: string };
  pos: { x: number; y: number }; // where the room sits on the map screen (grid cells)
  music?: string; // track name from music.ts (defaults to the chip 'house' theme)
  map: string[];
  guardians: GuardianDef[];
  npcs: NpcDef[];
  items: string[]; // item sprite per '*' in reading order
  signs?: { x: number; y: number; text: string }[]; // pixel text painted on the background
}

const BASE: Record<string, RoomDef> = {
  porch: {
    id: 'porch',
    name: 'The Porch (Wipe Your Feet)',
    theme: {
      bg: PAL.navy, motif: 0x2f3d7a, motifKind: 'stripes', wall: PAL.grey, wallDark: PAL.slate, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: PAL.red, bar: PAL.yellow, barText: PAL.ink,
    },
    exits: { up: 'sitting', right: 'drive' },
    pos: { x: 3, y: 3 },
    signs: [{ x: 98, y: 10, text: 'THE HALL ^' }],
    map: [
      '############........############',
      '#..............................#',
      '#..............................#',
      '#...........====...............#',
      '#.........................*....#',
      '#..............................#',
      '#.................====.........#',
      '#..............................#',
      '#..........................N...#',
      '#.......................=====..#',
      '#..............................#',
      '#..............................#',
      '#...................====.......#',
      '#...*..........................#',
      '#..............................#',
      '#.........................====.#',
      '#...............................',
      '#...............................',
      '#.....................=====.....',
      '#...............................',
      '#.P.....N......^^............*..',
      '####BB##########################',
    ],
    guardians: [],
    npcs: [
      {
        id: 'jonny',
        lines: ['Pint?', 'Go on, there is always time for a pint.', "Becca's been revising for the quiz. She says she hasn't. She has."],
      },
      {
        id: 'nick',
        lines: ['Thumbs up! Welcome to Brownber!', "Lovely evening. Mind you, if it starts raining I'm straight back inside.", "Beth said she'd be ready at 11:45. That was 45 minutes ago."],
      },
    ],
    items: ['boot', 'sourdough', 'tea'],
  },

  sitting: {
    id: 'sitting',
    name: 'The Sitting Room',
    theme: {
      bg: PAL.teal, motif: 0x2c8a6a, motifKind: 'leaf', wall: PAL.grey, wallDark: PAL.slate, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: PAL.red, bar: PAL.green, barText: PAL.ink,
    },
    exits: { left: 'dining', right: 'stairs', down: 'porch' },
    pos: { x: 3, y: 2 },
    map: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#...*...........*...........*..#',
      '#..............................#',
      '#............N.................#',
      '#.=====.....========......====.#',
      '#..............................#',
      '#..............................#',
      '#......=====........=====......#',
      '#..............................#',
      '#..............................#',
      '#====.....................====.#',
      '................................',
      '................................',
      '...------............---........',
      '................................',
      '.........N....====........FF....',
      '############........############',
    ],
    guardians: [{ kind: 'binks', x1: 16, x2: 232, y: 168 }],
    npcs: [
      {
        id: 'leo',
        lines: ["*strums guitar* This one's called 'Where Is Maffa's Lighter'.", "Sophie's cockatiel keeps whistling the chorus. It's better than me."],
      },
      {
        id: 'maffa',
        lines: [
          'Thank goodness you are here! Have you seen my lighter?',
          'No lighter, no fire pit. And Binks has raided the welcome hamper and hidden the party bits all over the Hall.',
          'Find all 12 before midnight - especially my lighter. Try the kitchen, the porch and the stairs.',
          'And if you find a pork pie and a glass of milk... those are mine as well.',
        ],
      },
    ],
    items: ['marmalade', 'prosecco', 'cake'],
  },

  kitchen: {
    id: 'kitchen',
    name: 'The Kitchen (Mind The Hoover)',
    theme: {
      bg: PAL.lgrey, motif: 0xa9c2d2, motifKind: 'tiles', wall: PAL.grey, wallDark: PAL.slate, wallLight: PAL.white,
      board: PAL.brown, furniture: PAL.white, bar: PAL.orange, barText: PAL.ink,
    },
    exits: { right: 'dining', left: 'pantry' },
    pos: { x: 1, y: 2 },
    map: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..........................*...#',
      '#..............................#',
      '.........................N.....#',
      '........................======.#',
      '...*................*..........#',
      '...............................#',
      '#.XXXX........<<<<<<<<<........#',
      '#.XXXX.........................#',
      '#.XXXX.........................#',
      '#.XXXX..====...................#',
      '#.XXXX..........................',
      '#.XXXX..........................',
      '#.XXXX.=====~===................',
      '#.XXXX..........................',
      '#.XXXX.........N................',
      '################################',
    ],
    guardians: [{ kind: 'hoover', x1: 48, x2: 232, y: 160, speed: 0.9 }],
    npcs: [
      {
        id: 'becca',
        lines: ["Quiz later! I'm terrible at quizzes, honestly.", '...Fine. I know every capital city. And every Eurovision winner. And the offside rule.'],
      },
      {
        id: 'karla',
        lines: [
          'Careful! That robot hoover has no manners.',
          'And the coffee machine puffs steam every few seconds. Time your jump.',
          'Oh, and Binks went up the stairs with something shiny in his mouth. Looked like a lighter!',
          "Tacos are nearly ready. Trust me, they'll save your life.",
        ],
      },
    ],
    items: ['porkpie', 'milk', 'cookie'],
  },

  stairs: {
    id: 'stairs',
    name: 'The Grand Staircase',
    theme: {
      bg: PAL.plum, motif: 0x6e3270, motifKind: 'fleur', wall: PAL.grey, wallDark: PAL.slate, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: PAL.red, bar: PAL.red, barText: PAL.white,
    },
    exits: { left: 'sitting', right: 'drawing', up: 'landing' },
    pos: { x: 4, y: 2 },
    music: 'stairs',
    signs: [{ x: 60, y: 14, text: 'UP TO THE LANDING' }],
    map: [
      '##....##########################',
      '#..............................#',
      '#..............................#',
      '#.*.N..........................#',
      '#=====.........................#',
      '#.....==.......................#',
      '#.......==.....................#',
      '#.........==...................#',
      '#...........==.......*....N....#',
      '#.............====CCC==========#',
      '#.........................==...#',
      '#.......................==.....#',
      '#.....................==.......#',
      '#...................==.........#',
      '#.................==...........#',
      '#...............==.............#',
      '..............==................',
      '............==..................',
      '..........==....................',
      '........==......................',
      '....................^^......*...',
      '################################',
    ],
    guardians: [{ kind: 'jar', x: 116, y1: 84, y2: 150, speed: 0.8 }],
    npcs: [
      {
        id: 'curtis',
        lines: ['*plays a jaunty tune on his keyboard*', "Shh, I'm working on the theme tune for tonight.", "Beth says she'll be down in five. I've written a song about it. It's very long."],
      },
      {
        id: 'luke',
        pose: 'lying',
        lines: ['Zzz... Oh! Hi. Just having a little lie down.', "These pyjamas? They're basically daywear.", 'Mind the floorboards just there. Zzz...'],
      },
    ],
    items: ['lighter', 'binoculars', 'thermos'], // the lighter is Maffa's, and it's the key item
  },
};

export const ROOMS: Record<string, RoomDef> = { ...BASE, ...ROOMS_GROUND, ...ROOMS_UPSTAIRS, ...ROOMS_OUTSIDE };

/** Extra sprites (guardians etc.) defined by the room modules. */
export const EXTRA_SPRITES: Record<string, SpriteDef> = { ...SPRITES_GROUND, ...SPRITES_UPSTAIRS, ...SPRITES_OUTSIDE };

export const START_ROOM = 'porch';

export const TOTAL_ITEMS = Object.values(ROOMS).reduce(
  (n, r) => n + r.map.join('').split('*').length - 1,
  0,
);

