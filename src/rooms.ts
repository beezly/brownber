import { PAL } from './palette';

// Rooms are 32x22 tiles of 8x8 px (256x176). Tile legend:
//  #  wall / solid            X  solid furniture (fridge)
//  =  floorboard platform (jump up through it, stand on top)
//  -  furniture platform (one-way, room's furniture colour)
//  C  crumbling floorboard    < >  conveyor (pushes left / right)
//  B  bouncy wellies          ^  spikes (deadly)
//  F  fire (deadly)           ~  coffee-machine steam vent (deadly when puffing)
//  *  party item              P  player start (first room only)
//  N  NPC stands here (see npcs list, in order)
// Open edges are exits; `exits` says which room they lead to.

export type GuardianDef =
  | { kind: 'hoover'; x1: number; x2: number; y: number; speed: number }
  | { kind: 'jar'; x: number; y1: number; y2: number; speed: number }
  | { kind: 'binks'; x1: number; x2: number; y: number };

export interface RoomDef {
  id: string;
  name: string;
  theme: {
    bg: number;
    motif: number;
    motifKind: 'dots' | 'leaf' | 'tiles' | 'fleur' | 'stripes';
    wall: number;
    wallDark: number;
    wallLight: number;
    board: number;
    furniture: number;
    bar: number;
    barText: number;
  };
  exits: { left?: string; right?: string; up?: string; down?: string };
  music?: string; // track name from music.ts (defaults to the chip 'house' theme)
  map: string[];
  guardians: GuardianDef[];
  // alt: who stands here instead if the player IS this character; altLines: what they say
  npcs: { id: string; alt: string; lines: string[]; altLines?: string[]; pose?: 'lying' }[];
  items: string[]; // item sprite per '*' in reading order
}

export const ROOMS: Record<string, RoomDef> = {
  porch: {
    id: 'porch',
    name: 'The Porch (Wipe Your Feet)',
    theme: {
      bg: PAL.navy, motif: 0x2f3d7a, motifKind: 'stripes', wall: PAL.grey, wallDark: PAL.slate, wallLight: PAL.lgrey,
      board: PAL.brown, furniture: PAL.red, bar: PAL.yellow, barText: PAL.ink,
    },
    exits: { up: 'sitting' },
    map: [
      '############........############',
      '#..........................N...#',
      '#..............................#',
      '#...........====...............#',
      '#.........................*....#',
      '#..............................#',
      '#.................====.........#',
      '#..............................#',
      '#..............................#',
      '#.......................=====..#',
      '#..............................#',
      '#..............................#',
      '#...................====.......#',
      '#...*..........................#',
      '#..............................#',
      '#.........................====.#',
      '#..............................#',
      '#..............................#',
      '#.....................=====....#',
      '#..............................#',
      '#.P.....N......^^............*.#',
      '####BB##########################',
    ],
    guardians: [],
    npcs: [
      {
        id: 'jonny',
        alt: 'beez',
        lines: ['Pint?', 'Go on, there is always time for a pint.', "Becca's been revising for the quiz. She says she hasn't. She has."],
        altLines: ["Has anyone seen my phone? I put it down somewhere...", 'And my keys. And my other shoe. And my other phone.'],
      },
      {
        id: 'nick',
        alt: 'beth',
        lines: ['Thumbs up! Welcome to Brownber!', "Lovely evening. Mind you, if it starts raining I'm straight back inside.", "Beth said she'd be ready at 11:45. That was 45 minutes ago."],
        altLines: ['Five more minutes, I promise!', "Nick, is that rain? You've gone pale.", "Go on without me, I'll catch you up. Probably."],
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
    exits: { left: 'kitchen', right: 'stairs', down: 'porch' },
    map: [
      '################################',
      '#............N.................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#...*...........*...........*..#',
      '#..............................#',
      '#..............................#',
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
        alt: 'sophie',
        lines: ["*strums guitar* This one's called 'Where Is Maffa's Lighter'.", "Sophie's cockatiel keeps whistling the chorus. It's better than me."],
        altLines: ["Cup of tea? I've just made a pot.", 'The cockatiel has learnt all your songs, Leo. All of them. On repeat.'],
      },
      {
        id: 'maffa',
        alt: 'debra',
        lines: [
          'Thank goodness you are here! Have you seen my lighter?',
          'No lighter, no fire pit. And Binks has raided the welcome hamper and hidden the party bits all over the Hall.',
          'Find all 12 before midnight - especially my lighter. Try the kitchen, the porch and the stairs.',
          'And if you find a pork pie and a glass of milk... those are mine as well.',
        ],
        altLines: [
          'Lost your lighter AGAIN, Maffa?',
          'No lighter, no fire pit. And Binks has hidden the party bits all over the Hall.',
          'He was last seen bounding up the stairs with something shiny...',
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
    exits: { right: 'sitting' },
    map: [
      '################################',
      '#........................N.....#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..........................*...#',
      '#..............................#',
      '#..............................#',
      '#.......................======.#',
      '#..*................*..........#',
      '#..............................#',
      '#.XXXX........<<<<<<<<<........#',
      '#.XXXX.........................#',
      '#.XXXX.........................#',
      '#.XXXX..====...................#',
      '#.XXXX..........................',
      '#.XXXX..........................',
      '#.XXXX.=====~===................',
      '#.XXXX.........N................',
      '#.XXXX..........................',
      '################################',
    ],
    guardians: [{ kind: 'hoover', x1: 48, x2: 232, y: 160, speed: 0.9 }],
    npcs: [
      {
        id: 'becca',
        alt: 'debra',
        lines: ["Quiz later! I'm terrible at quizzes, honestly.", '...Fine. I know every capital city. And every Eurovision winner. And the offside rule.'],
        altLines: ['Who left all this here? I am just going to tidy it...', 'If something has moved, that was me. Sorry! It looked untidy.'],
      },
      {
        id: 'karla',
        alt: 'sophie',
        lines: [
          'Careful! That robot hoover has no manners.',
          'And the coffee machine puffs steam every few seconds. Time your jump.',
          'Oh, and Binks went up the stairs with something shiny in his mouth. Looked like a lighter!',
          "Tacos are nearly ready. Trust me, they'll save your life.",
        ],
        altLines: ["Tea? I'm making a pot.", 'Careful of that hoover. The cockatiel hates it.'],
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
    exits: { left: 'sitting' },
    music: 'stairs',
    map: [
      '################################',
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
      '..............==...............#',
      '............==.................#',
      '..........==...................#',
      '........==.....................#',
      '....................^^......*..#',
      '################################',
    ],
    guardians: [{ kind: 'jar', x: 116, y1: 84, y2: 150, speed: 0.8 }],
    npcs: [
      {
        id: 'curtis',
        alt: 'beth',
        lines: ['*plays a jaunty tune on his keyboard*', "Shh, I'm working on the theme tune for tonight.", "Beth says she'll be down in five. I've written a song about it. It's very long."],
        altLines: ['Nearly ready! Five more minutes.', 'That keyboard tune is stuck in my head, Curtis. Thank you so much.'],
      },
      {
        id: 'luke',
        alt: 'tom',
        pose: 'lying',
        lines: ['Zzz... Oh! Hi. Just having a little lie down.', "These pyjamas? They're basically daywear.", 'Mind the floorboards just there. Zzz...'],
        altLines: ['Luke! Can I just say, you are a wonderful, wonderful man.', 'Even in pyjamas. Especially in pyjamas.'],
      },
    ],
    items: ['lighter', 'binoculars', 'thermos'], // the lighter is Maffa's, and it's the key item
  },
};

export const START_ROOM = 'porch';

export const TOTAL_ITEMS = Object.values(ROOMS).reduce(
  (n, r) => n + r.map.join('').split('*').length - 1,
  0,
);

// The Landing upstairs isn't built yet: a sign in the staircase says so.
export const SIGNS: Record<string, { x: number; y: number; text: string }[]> = {
  stairs: [{ x: 60, y: 14, text: 'LANDING: COMING SOON' }],
  porch: [{ x: 98, y: 10, text: 'THE HALL ^' }],
};
