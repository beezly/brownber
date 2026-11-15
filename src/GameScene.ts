import Phaser from './phaser';
import { PAL } from './palette';
import { ROOMS, START_ROOM, TOTAL_ITEMS, type RoomDef, type GuardianDef } from './rooms';
import { charById, type CharDef, type Frame } from './characters';
import { drawText, drawTextCentered, wrap } from './font';
import { input } from './input';
import { sfx } from './sound';
import { playMusic, stopMusic } from './music';
import { ABILITIES, type AbilityDef, type AbilityId } from './abilities';
import { loadSave, writeSave, clearSave, type SaveData } from './save';
import { CHARACTERS } from './characters';

// ---- world constants ----
const T = 8;
const COLS = 32;
const ROWS = 22;
const RW = COLS * T; // 256
const RH = ROWS * T; // 176

// ---- feel (per 60Hz frame) ----
const WALK = 1.2;
const GRAV = 0.22;
const JUMP_V = -3.6; // ~29px high, ~39px long: a fixed, readable arc
const MAX_FALL = 4;
const BOUNCE_V = -5.4;
const ENTRY_BOOST = -4; // upward speed when you jump up into a room above
const AIR_ACCEL = 0.15; // a little air control (classic games had none)
const COYOTE = 5; // frames you can still jump after walking off a ledge
const BUFFER = 7; // frames a jump press is remembered before landing
const CONVEYOR = 0.6;
const CRUMBLE_HP = 24;
const PW = 8;
const PH = 22;
const STEP = 1000 / 60;
const MINUTES_PER_FRAME = 15 / 3600; // 1 real minute = 15 game minutes

type Mode = 'cosy' | 'classic';

const isSolid = (ch: string) => '#XBGD'.includes(ch);
const isOneWay = (ch: string) => '=-C<>~O'.includes(ch);
const isSupport = (ch: string) => isSolid(ch) || isOneWay(ch) || ch === 'S';
const isStable = (ch: string) => '#X=-GD'.includes(ch);
const isOneWayOrPile = (ch: string) => isOneWay(ch) || ch === 'S';

interface Guardian {
  def: GuardianDef;
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  dir: number;
  speed: number;
  phase: number;
  pause: number;
  woof: number;
}

interface Npc {
  def: CharDef;
  x: number; // feet centre
  y: number; // feet
  sprite: Phaser.GameObjects.Image;
  lines: string[];
  pose?: 'lying';
  custom?: boolean; // lines written specially for the friend you're playing
}

interface Line {
  who: CharDef;
  text: string;
}

interface Companion {
  x: number;
  y: number;
  phase: number;
  sprite: Phaser.GameObjects.Image;
  fetch: Item | null;
  woof: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  color: number;
  kind: 'note' | 'dot';
}

interface Item {
  idx: number;
  key: string;
  x: number;
  y: number;
  sprite: Phaser.GameObjects.Image;
}

export class GameScene extends Phaser.Scene {
  private hero!: CharDef;
  private mode: Mode = 'cosy';

  // player state
  private px = 0;
  private py = 0;
  private vx = 0;
  private vy = 0;
  private grounded = false;
  private facing = 1;
  private coyote = 0;
  private buffer = 0;
  private knock = 0;
  private invuln = 0;
  private dying = 0;
  private animT = 0;
  private lives = 5;

  // world state
  private room!: RoomDef;
  private tiles: string[][] = [];
  private crumble = new Map<string, number>();
  private vents: { c: number; r: number }[] = [];
  private collected = new Set<string>();
  private checkpoint = { room: START_ROOM, x: 0, y: 0 };
  private clock = 16 * 60;
  private frame = 0;
  private acc = 0;
  private state: 'play' | 'talk' | 'won' | 'over' | 'map' | 'finale' = 'play';
  private talked = new Set<string>();
  private visited = new Set<string>();
  private hasLighter = false;
  private deaths = 0;
  private pending: SaveData | null = null;
  private lastSave = 0;
  private pitNag = -9999;
  private finale: {
    t: number;
    fire: { c: number; r: number }[];
    friends: { def: CharDef; sprite: Phaser.GameObjects.Image; x: number; tx: number; y: number; delay: number }[];
    title: string;
    lines: string[];
    star: boolean;
    textAt: number;
  } | null = null;
  private overText: string[] = [];

  // display
  private roomImg!: Phaser.GameObjects.Image;
  private dyn!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Graphics;
  private ui!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Image;
  private portrait!: Phaser.GameObjects.Image;
  private guardians: Guardian[] = [];
  private npcs: Npc[] = [];
  private items: Item[] = [];
  private hudKey = '';
  private toast: { text: string; t: number } | null = null;

  // dialogue
  private talk: { npc: Npc; lines: Line[]; idx: number; shown: number } | null = null;

  // abilities
  private abId: AbilityId = 'tidy';
  private ab!: AbilityDef;
  private abCd = 0;
  private abT = 0;
  private wt = 0; // world time: slowed down by Beth
  private lying = false;
  private doubleUsed = false;
  private gliding = false;
  private shield = false;
  private shieldCd = 0;
  private tileSafe = 0;
  private laser: { x: number; y: number } | null = null;
  private pint: { x: number; y: number; t: number } | null = null;
  private piles = 0;
  private hint: { x: number; y: number; label: string } | null = null;
  private pal: Companion | null = null;
  private parts: Particle[] = [];

  constructor() {
    super('game');
  }

  init(data: { hero: string; mode: Mode; cont?: boolean }) {
    this.pending = data.cont ? loadSave() : null;
    if (!data.cont) clearSave();
    this.hero = charById(this.pending?.hero ?? data.hero ?? 'beez');
    this.mode = this.pending?.mode ?? data.mode ?? 'cosy';
    this.talked = new Set();
    this.visited = new Set();
    this.hasLighter = false;
    this.deaths = 0;
    this.lastSave = 0;
    this.finale = null;
    this.lives = 5;
    this.collected.clear();
    this.clock = 16 * 60;
    this.frame = 0;
    this.acc = 0;
    this.state = 'play';
    this.talk = null;
    this.hudKey = '';
    this.toast = null;
    this.abId = this.hero.ability;
    this.ab = ABILITIES[this.abId];
    this.abCd = this.abT = this.wt = 0;
    this.lying = this.doubleUsed = this.gliding = false;
    this.shield = this.abId === 'tacos';
    this.shieldCd = this.tileSafe = 0;
    this.laser = this.pint = this.hint = null;
    this.pal = null;
    this.parts = [];
  }

  private get hasCompanion() {
    return this.abId === 'fetch' || this.abId === 'liedown';
  }

  create() {
    document.body.classList.add('ingame');
    const saveNow = () => this.save();
    window.addEventListener('bb-save-now', saveNow);
    this.events.once('shutdown', () => {
      document.body.classList.remove('ingame');
      window.removeEventListener('bb-save-now', saveNow);
    });
    this.cameras.main.setBackgroundColor(PAL.ink);
    this.roomImg = this.add.image(0, 0, '__DEFAULT').setOrigin(0).setDepth(0);
    this.dyn = this.add.graphics().setDepth(1);
    this.player = this.add.image(0, 0, `${this.hero.id}_idle`).setOrigin(0.5, 1).setDepth(5);
    if (this.hasCompanion) {
      const sprite = this.add.image(0, 0, 'binks_a').setOrigin(0.5, 1).setDepth(5);
      this.pal = { x: NaN, y: 0, phase: 0, sprite, fetch: null, woof: 0 };
    }
    this.fx = this.add.graphics().setDepth(6);
    this.hud = this.add.graphics().setDepth(10);
    this.ui = this.add.graphics().setDepth(11);
    this.portrait = this.add.image(10, 8, '__DEFAULT').setOrigin(0).setDepth(12).setVisible(false);

    // find the start position
    const start = ROOMS[START_ROOM];
    let sx = 16;
    let sy = 160;
    start.map.forEach((row, r) => {
      const c = row.indexOf('P');
      if (c >= 0) {
        sx = c * T;
        sy = (r + 1) * T - PH;
      }
    });
    const sv = this.pending;
    if (sv && ROOMS[sv.room]) {
      // carry on from the save
      sv.collected.forEach((k) => this.collected.add(k));
      sv.talked.forEach((k) => this.talked.add(k));
      sv.visited.forEach((k) => this.visited.add(k));
      this.clock = sv.clock;
      this.lives = sv.lives;
      this.hasLighter = sv.lighter;
      this.deaths = sv.deaths;
      sx = sv.x;
      sy = sv.y;
      this.loadRoom(sv.room);
      this.checkpoint = { room: sv.room, x: sx, y: sy };
      this.say(`WELCOME BACK, ${this.hero.name.toUpperCase()}!`, 120);
    } else {
      this.loadRoom(START_ROOM);
      this.checkpoint = { room: START_ROOM, x: sx, y: sy };
    }
    this.px = sx;
    this.py = sy;
    this.pending = null;
    input.clearLatches();
  }

  private save() {
    if (this.state === 'finale' || this.state === 'won' || this.state === 'over') return;
    this.lastSave = this.frame;
    writeSave({
      v: 1,
      hero: this.hero.id,
      mode: this.mode,
      room: this.checkpoint.room,
      x: this.checkpoint.x,
      y: this.checkpoint.y,
      collected: [...this.collected],
      talked: [...this.talked],
      visited: [...this.visited],
      clock: this.clock,
      lives: this.lives,
      lighter: this.hasLighter,
      deaths: this.deaths,
    });
  }

  // ------------------------------------------------------------------ rooms
  private loadRoom(id: string) {
    const room = ROOMS[id];
    this.room = room;
    this.visited.add(id);
    playMusic(room.music ?? 'house');
    this.tiles = room.map.map((row) => row.padEnd(COLS, '.').slice(0, COLS).split(''));
    this.crumble.clear();
    this.vents = [];

    for (const s of this.items) s.sprite.destroy();
    for (const g of this.guardians) g.sprite.destroy();
    for (const n of this.npcs) n.sprite.destroy();
    this.items = [];
    this.guardians = [];
    this.npcs = [];

    let itemIdx = 0;
    let npcIdx = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = this.tiles[r][c];
        if (ch === '*') {
          const idx = itemIdx++;
          this.tiles[r][c] = '.';
          if (this.collected.has(`${id}:${idx}`)) continue;
          const key = room.items[idx % room.items.length] ?? 'cake';
          const sprite = this.add.image(c * T, r * T, `item_${key}`).setOrigin(0).setDepth(2);
          this.items.push({ idx, key, x: c * T, y: r * T, sprite });
        } else if (ch === 'P') {
          this.tiles[r][c] = '.';
        } else if (ch === 'N') {
          this.tiles[r][c] = '.';
          const spec = room.npcs[npcIdx++];
          if (!spec || spec.id === this.hero.id) continue; // you can't meet yourself
          const def = charById(spec.id);
          const sprite = this.add.image(c * T + 4, (r + 1) * T, `${def.id}_idle`).setOrigin(0.5, 1).setDepth(3);
          const custom = spec.byHero?.[this.hero.id];
          const lines = custom ?? spec.lines;
          this.npcs.push({ def, x: c * T + 4, y: (r + 1) * T, sprite, lines, pose: spec.pose, custom: !!custom });
        } else if (ch === 'C') {
          this.crumble.set(`${c},${r}`, CRUMBLE_HP);
        } else if (ch === '~') {
          this.vents.push({ c, r });
        }
      }
    }

    for (const def of room.guardians) {
      if (def.kind === 'binks' && this.hasCompanion) continue; // Binks is with Tom and Luke
      const key =
        def.kind === 'binks' ? 'binks_a' : def.kind === 'hoover' || def.kind === 'jar' ? def.kind : def.sprite;
      const sprite = this.add.image(0, 0, this.textures.exists(key) ? key : 'hoover').setOrigin(0).setDepth(4);
      const vertical = def.kind === 'jar' || def.kind === 'floater';
      const g: Guardian = {
        def,
        sprite,
        x: vertical ? def.x : def.x1,
        y: vertical ? def.y1 : def.y,
        dir: 1,
        speed: def.kind === 'binks' ? 1.6 : def.speed,
        phase: 0,
        pause: 0,
        woof: 0,
      };
      this.guardians.push(g);
    }

    this.drawRoomTexture();
    this.hudKey = '';
    this.piles = 0;
    this.pint = null;
    this.hint = null;
    if (this.pal) {
      this.pal.x = NaN;
      this.pal.fetch = null;
    }
  }

  private tile(c: number, r: number) {
    if (r < 0 || r >= ROWS) return '.';
    if (c < 0) c = 0;
    if (c >= COLS) c = COLS - 1;
    // treat out-of-bounds columns like the edge column only for floors, so doorways stay open
    const ch = this.tiles[r][c];
    return ch;
  }

  private drawRoomTexture() {
    const key = `room_${this.room.id}`;
    if (!this.textures.exists(key)) {
      const g = this.add.graphics();
      const th = this.room.theme;
      g.fillStyle(th.bg, 1);
      g.fillRect(0, 0, RW, RH);
      // wallpaper motif
      g.fillStyle(th.motif, 1);
      for (let y = 0; y < RH; y += 16) {
        for (let x = 0; x < RW; x += 16) {
          switch (th.motifKind) {
            case 'dots':
              g.fillRect(x + 4, y + 4, 2, 1);
              g.fillRect(x + 12, y + 12, 2, 1);
              break;
            case 'leaf':
              g.fillRect(x + 6, y + 3, 1, 1);
              g.fillRect(x + 5, y + 4, 3, 1);
              g.fillRect(x + 4, y + 5, 5, 1);
              g.fillRect(x + 5, y + 6, 3, 1);
              g.fillRect(x + 6, y + 7, 1, 2);
              g.fillRect(x + 13, y + 12, 2, 2);
              break;
            case 'tiles':
              g.fillRect(x, y, 16, 1);
              g.fillRect(x, y + 8, 16, 1);
              g.fillRect(x, y, 1, 16);
              g.fillRect(x + 8, y, 1, 16);
              break;
            case 'fleur':
              g.fillRect(x + 7, y + 3, 1, 5);
              g.fillRect(x + 5, y + 5, 5, 1);
              g.fillRect(x + 6, y + 9, 3, 1);
              break;
            case 'stripes':
              g.fillRect(x + 2, y, 3, 16);
              g.fillRect(x + 10, y, 1, 16);
              break;
            case 'stone':
              g.fillRect(x, y + 7, 16, 1);
              g.fillRect(x, y + 15, 16, 1);
              g.fillRect(x + ((y / 16) % 2 ? 4 : 11), y, 1, 7);
              g.fillRect(x + ((y / 16) % 2 ? 11 : 4), y + 8, 1, 7);
              break;
            case 'sky': {
              // evening sky: stars high up
              const n = (x * 7 + y * 13) % 29;
              if (y < 100 && n === 0) g.fillRect(x + (n % 7) + 3, y + ((x + y) % 11), 1, 1);
              break;
            }
            case 'plain':
              break;
          }
        }
      }
      if (th.motifKind === 'sky') {
        // the Howgill Fells on the horizon
        g.fillStyle(th.wallDark, 1);
        for (let x = 0; x < RW; x++) {
          const h = 30 + Math.sin(x / 34 + this.room.pos.x) * 10 + Math.sin(x / 13) * 3;
          g.fillRect(x, 120 - h, 1, h + 56);
        }
        g.fillStyle(PAL.yellow, 1);
        g.fillRect(212, 18, 6, 6); // the moon
        g.fillStyle(th.bg, 1);
        g.fillRect(214, 18, 4, 4);
      }
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) this.drawStaticTile(g, this.tiles[r][c], c, r);
      }
      // signs
      for (const s of this.room.signs ?? []) drawText(g, s.text, s.x, s.y, PAL.yellow, PAL.ink);
      g.generateTexture(key, RW, RH);
      g.destroy();
    }
    this.roomImg.setTexture(key);
  }

  private drawStaticTile(g: Phaser.GameObjects.Graphics, ch: string, c: number, r: number) {
    const x = c * T;
    const y = r * T;
    const th = this.room.theme;
    switch (ch) {
      case '#': {
        g.fillStyle(th.wall, 1);
        g.fillRect(x, y, T, T);
        g.fillStyle(th.wallDark, 1);
        g.fillRect(x, y + 3, T, 1);
        g.fillRect(x, y + 7, T, 1);
        g.fillRect(x + (r % 2 ? 2 : 6), y, 1, 3);
        g.fillRect(x + (r % 2 ? 6 : 2), y + 4, 1, 3);
        g.fillStyle(th.wallLight, 1);
        g.fillRect(x, y, T, 1);
        break;
      }
      case 'B': {
        g.fillStyle(th.wall, 1);
        g.fillRect(x, y, T, T);
        // a welly lying on its side: springy!
        g.fillStyle(PAL.green, 1);
        g.fillRect(x, y, T, 4);
        g.fillStyle(PAL.lime, 1);
        g.fillRect(x, y, T, 1);
        g.fillStyle(PAL.ink, 1);
        g.fillRect(x + 3, y + 1, 1, 3);
        break;
      }
      case 'X': {
        if (this.room.id === 'bathroom') {
          // a roll-top bath: white tub, curled rim, clawed feet
          const top = this.tile(c, r - 1) !== 'X';
          const bottom = this.tile(c, r + 1) !== 'X';
          g.fillStyle(PAL.white, 1);
          g.fillRect(x, y + (top ? 2 : 0), T, bottom ? 5 : T);
          g.fillStyle(PAL.lgrey, 1);
          if (top) g.fillRect(x, y + 1, T, 2);
          if (this.tile(c - 1, r) !== 'X') g.fillRect(x, y + (top ? 2 : 0), 1, bottom ? 5 : T);
          if (this.tile(c + 1, r) !== 'X') g.fillRect(x + 7, y + (top ? 2 : 0), 1, bottom ? 5 : T);
          if (bottom && (this.tile(c - 1, r) !== 'X' || this.tile(c + 1, r) !== 'X')) {
            g.fillStyle(PAL.yellow, 1);
            g.fillRect(x + 3, y + 7, 2, 1);
          }
          break;
        }
        g.fillStyle(PAL.white, 1);
        g.fillRect(x, y, T, T);
        g.fillStyle(PAL.lgrey, 1);
        if (this.tile(c - 1, r) !== 'X') g.fillRect(x, y, 1, T);
        if (this.tile(c + 1, r) !== 'X') g.fillRect(x + 7, y, 1, T);
        if (this.tile(c, r - 1) !== 'X') g.fillRect(x, y, T, 1);
        if (this.tile(c, r - 1) === 'X' && this.tile(c, r + 1) === 'X' && r % 4 === 0) g.fillRect(x, y, T, 1);
        if (this.tile(c + 1, r) !== 'X' && (r % 4 === 1 || r % 4 === 2)) {
          g.fillStyle(PAL.grey, 1);
          g.fillRect(x + 5, y, 1, T);
        }
        break;
      }
      case '=':
      case '~': {
        g.fillStyle(th.board, 1);
        g.fillRect(x, y, T, 4);
        g.fillStyle(PAL.orange, 1);
        g.fillRect(x, y, T, 1);
        g.fillStyle(PAL.ink, 1);
        g.fillRect(x, y + 4, T, 1);
        g.fillRect(x + 7, y + 1, 1, 3);
        if (ch === '~') {
          // the coffee machine
          g.fillStyle(PAL.ink, 1);
          g.fillRect(x + 1, y - 6, 6, 6);
          g.fillStyle(PAL.red, 1);
          g.fillRect(x + 2, y - 5, 1, 1);
          g.fillStyle(PAL.grey, 1);
          g.fillRect(x + 4, y - 2, 2, 2);
        }
        break;
      }
      case '-': {
        g.fillStyle(th.furniture, 1);
        g.fillRect(x, y, T, 6);
        g.fillStyle(PAL.ink, 1);
        g.fillRect(x, y + 6, T, 1);
        g.fillStyle(PAL.white, 0.25);
        g.fillRect(x, y, T, 1);
        if (this.tile(c - 1, r) !== '-' || this.tile(c + 1, r) !== '-') {
          g.fillStyle(PAL.ink, 1);
          g.fillRect(this.tile(c - 1, r) !== '-' ? x : x + 7, y + 6, 1, 2);
        }
        break;
      }
      case 'G': {
        // grass: soil with a green top if open sky above
        g.fillStyle(0x5a3a22, 1);
        g.fillRect(x, y, T, T);
        g.fillStyle(0x4a2e1a, 1);
        g.fillRect(x + ((c * 3 + r) % 6), y + 4, 2, 1);
        if (!'GD'.includes(this.tile(c, r - 1))) {
          g.fillStyle(PAL.green, 1);
          g.fillRect(x, y, T, 3);
          g.fillStyle(PAL.lime, 1);
          g.fillRect(x + ((c * 5) % 7), y - 1, 1, 1);
          g.fillRect(x, y, T, 1);
        }
        break;
      }
      case 'D': {
        // dry-stone wall / fell rock
        g.fillStyle(PAL.grey, 1);
        g.fillRect(x, y, T, T);
        g.fillStyle(PAL.slate, 1);
        g.fillRect(x, y + (c % 2 ? 3 : 5), T, 1);
        g.fillRect(x + ((r * 3 + c) % 7), y, 1, T);
        g.fillStyle(PAL.lgrey, 1);
        g.fillRect(x + 1, y + 1, 2, 1);
        break;
      }
      case 'O': {
        // the fire pit: a ring of stones with logs
        g.fillStyle(PAL.grey, 1);
        g.fillRect(x, y + 2, T, 6);
        g.fillStyle(PAL.lgrey, 1);
        g.fillRect(x + 1, y + 2, 2, 2);
        g.fillRect(x + 5, y + 3, 2, 2);
        g.fillStyle(PAL.brown, 1);
        g.fillRect(x + 1, y, 6, 2);
        g.fillStyle(PAL.ink, 1);
        g.fillRect(x, y + 7, T, 1);
        break;
      }
      case '^': {
        g.fillStyle(PAL.lgrey, 1);
        for (let i = 0; i < 2; i++) {
          const sx = x + i * 4;
          g.fillRect(sx + 1, y + 4, 2, 4);
          g.fillRect(sx, y + 6, 4, 2);
        }
        g.fillStyle(PAL.white, 1);
        g.fillRect(x + 1, y + 4, 1, 1);
        g.fillRect(x + 5, y + 4, 1, 1);
        break;
      }
    }
  }

  // ------------------------------------------------------------------ loop
  update(_time: number, delta: number) {
    this.acc += Math.min(delta, 100);
    let steps = 0;
    while (this.acc >= STEP && steps < 5) {
      this.acc -= STEP;
      this.step();
      steps++;
    }
    this.render();
  }

  private step() {
    this.frame++;
    if (this.state === 'talk') return this.stepTalk();
    if (this.state === 'finale') return this.stepFinale();
    if (this.state === 'map') {
      if (input.takeMap() || input.takeJump() || input.takeTalk()) {
        this.state = 'play';
        input.clearLatches();
      }
      return;
    }
    if (this.state === 'won' || this.state === 'over') {
      if ((input.takeJump() || input.takeTalk()) && this.frame > 30) this.scene.start('title');
      return;
    }

    this.clock += MINUTES_PER_FRAME;
    if (this.clock >= 24 * 60 && this.mode === 'classic') {
      this.endGame(['MIDNIGHT!', 'THE PARTY FIZZLED OUT.', '', 'PRESS JUMP']);
      return;
    }

    this.wt += this.worldSpeed();
    this.stepAbilityTimers();
    this.stepGuardians();
    this.stepParticles();

    if (this.dying > 0) {
      this.dying--;
      if (this.dying === 0) this.respawn();
      return;
    }

    this.stepPlayer();
    this.stepCompanion();
    this.stepTidy();
    if (this.state !== 'play') return;
    this.checkCollisions();
    this.checkExits();
  }

  // ------------------------------------------------------------------ player
  private stepPlayer() {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (input.takeJump()) this.buffer = BUFFER;
    else if (this.buffer > 0) this.buffer--;

    // talk to a nearby friend
    if (input.takeTalk()) {
      const n = this.nearNpc();
      if (n) {
        this.startTalk(n);
        return;
      }
    }

    if (input.takeAbility()) this.useAbility();
    if (input.takeMap()) {
      this.state = 'map';
      input.clearLatches();
      sfx.select();
      return;
    }
    if (this.lying) {
      // getting up: jump or walk
      if (this.buffer > 0 || dir !== 0) {
        this.lying = false;
        this.buffer = 0;
      } else {
        this.vx = 0;
        this.animT++;
        if (this.invuln > 0) this.invuln--;
        return;
      }
    }
    const walk = this.abId === 'panic' && this.abT > 0 ? WALK * 1.9 : WALK;

    // support under feet (from last frame's position)
    const supports = this.supportTiles();
    let push = 0;
    if (this.grounded) {
      for (const s of supports) {
        if (s.ch === '<') push = -CONVEYOR;
        if (s.ch === '>') push = CONVEYOR;
      }
    }

    if (this.knock > 0) {
      this.knock--;
    } else if (this.grounded) {
      this.vx = dir * walk + push;
    } else {
      this.vx += (dir * walk - this.vx) * AIR_ACCEL;
    }
    if (dir !== 0 && this.knock === 0) this.facing = dir;

    // jump
    if (this.buffer > 0 && (this.grounded || this.coyote > 0) && this.knock === 0) {
      this.vy = JUMP_V;
      this.grounded = false;
      this.coyote = 0;
      this.buffer = 0;
      sfx.jump();
    } else if (
      this.abId === 'chord' &&
      this.buffer === BUFFER &&
      !this.grounded &&
      !this.doubleUsed &&
      this.knock === 0
    ) {
      // Leo: power chord double jump
      this.vy = JUMP_V * 0.95;
      this.doubleUsed = true;
      this.buffer = 0;
      sfx.chord();
      this.burst(this.px + PW / 2, this.py + PH, PAL.yellow, 'note', 4);
    }

    this.vy = Math.min(this.vy + GRAV, MAX_FALL);
    // Sophie: the cockatiel lets her glide
    this.gliding = this.abId === 'glide' && !this.grounded && this.vy > 0.6 && input.jumpHeld;
    if (this.gliding) this.vy = 0.6;
    const wasGrounded = this.grounded;
    this.moveX(wasGrounded);
    this.moveY();
    this.grounded = this.checkGrounded();

    if (this.grounded) {
      this.coyote = COYOTE;
      this.doubleUsed = false;
      this.vy = 0;
      const sup = this.supportTiles();
      for (const s of sup) {
        if (s.ch === 'B') {
          this.vy = BOUNCE_V;
          this.grounded = false;
          sfx.bounce();
          break;
        }
        if (s.ch === 'C') {
          const k = `${s.c},${s.r}`;
          const hp = (this.crumble.get(k) ?? CRUMBLE_HP) - 1;
          this.crumble.set(k, hp);
          if (hp % 6 === 0) sfx.crumble();
          if (hp <= 0) this.tiles[s.r][s.c] = '.';
        }
      }
      if (this.grounded) this.maybeCheckpoint(sup);
      if (this.grounded && sup.some((t) => t.ch === 'O')) this.atFirePit();
    } else if (this.coyote > 0) {
      this.coyote--;
    }

    if (this.invuln > 0) this.invuln--;
    this.animT++;
  }

  private moveX(wasGrounded: boolean) {
    this.px += this.vx;
    const r0 = Math.floor(this.py / T);
    const r1 = Math.floor((this.py + PH - 1) / T);
    if (this.vx > 0) {
      const c = Math.floor((this.px + PW - 1) / T);
      for (let r = r0; r <= r1; r++)
        if (isSolid(this.tile(c, r)) && c < COLS) {
          this.px = c * T - PW;
          break;
        }
    } else if (this.vx < 0) {
      const c = Math.floor(this.px / T);
      for (let r = r0; r <= r1; r++)
        if (isSolid(this.tile(c, r)) && c >= 0) {
          this.px = (c + 1) * T;
          break;
        }
    }
    // walk up one-tile steps (stairs) automatically
    if (wasGrounded && this.vx !== 0) {
      const c = this.vx > 0 ? Math.floor((this.px + PW - 1) / T) : Math.floor(this.px / T);
      const rf = Math.floor((this.py + PH - 1) / T);
      if (isOneWayOrPile(this.tile(c, rf))) {
        const newY = rf * T - PH;
        const headRow = Math.floor(newY / T);
        if (!isSolid(this.tile(c, headRow))) this.py = newY;
      }
    }
  }

  private moveY() {
    const prevBot = this.py + PH;
    this.py += this.vy;
    const c0 = Math.floor(this.px / T);
    const c1 = Math.floor((this.px + PW - 1) / T);
    if (this.vy > 0) {
      const newBot = this.py + PH;
      for (let r = Math.ceil(prevBot / T - 0.0001); r * T < newBot; r++) {
        let hit = false;
        for (let c = c0; c <= c1; c++) if (isSupport(this.tile(c, r))) hit = true;
        if (hit) {
          this.py = r * T - PH;
          this.vy = 0;
          break;
        }
      }
    } else if (this.vy < 0) {
      const r = Math.floor(this.py / T);
      for (let c = c0; c <= c1; c++) {
        if (isSolid(this.tile(c, r))) {
          this.py = (r + 1) * T;
          this.vy = 0;
          break;
        }
      }
    }
  }

  private checkGrounded() {
    if (this.vy < 0) return false;
    const bot = this.py + PH;
    const r = Math.round(bot / T);
    if (Math.abs(bot - r * T) > 0.01) return false;
    const c0 = Math.floor(this.px / T);
    const c1 = Math.floor((this.px + PW - 1) / T);
    for (let c = c0; c <= c1; c++) if (isSupport(this.tile(c, r))) {
      this.py = r * T - PH;
      return true;
    }
    return false;
  }

  private supportTiles() {
    const out: { c: number; r: number; ch: string }[] = [];
    const bot = this.py + PH;
    const r = Math.round(bot / T);
    if (Math.abs(bot - r * T) > 0.01) return out;
    const c0 = Math.floor(this.px / T);
    const c1 = Math.floor((this.px + PW - 1) / T);
    for (let c = c0; c <= c1; c++) {
      const ch = this.tile(c, r);
      if (isSupport(ch)) out.push({ c, r, ch });
    }
    return out;
  }

  private maybeCheckpoint(sup: { ch: string }[]) {
    if (!sup.length || !sup.every((s) => isStable(s.ch))) return;
    if (this.knock > 0) return;
    // not right next to a hazard or a guardian
    const c0 = Math.floor(this.px / T) - 2;
    const c1 = Math.floor((this.px + PW) / T) + 2;
    const r0 = Math.floor(this.py / T) - 1;
    const r1 = Math.floor((this.py + PH) / T) + 1;
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++) if ('^F~C'.includes(this.tile(c, r))) return;
    for (const g of this.guardians) {
      if (Math.abs(g.x + 8 - (this.px + 4)) < 40 && Math.abs(g.y - this.py) < 40) return;
    }
    const moved = this.checkpoint.room !== this.room.id;
    this.checkpoint = { room: this.room.id, x: this.px, y: this.py };
    if (moved || this.frame - this.lastSave > 600) this.save();
  }

  private die() {
    if (this.dying > 0) return;
    if (this.shield) {
      // Karla: tacos save your life
      this.shield = false;
      this.shieldCd = this.ab.cooldown;
      this.invuln = 90;
      this.tileSafe = 60;
      this.vy = -3;
      this.grounded = false;
      this.say('TACO POWER! SAVED!');
      sfx.collect();
      this.burst(this.px + PW / 2, this.py + 8, PAL.orange, 'dot', 10);
      return;
    }
    this.dying = 45;
    this.vx = this.vy = 0;
    sfx.die();
    if (navigator.vibrate) navigator.vibrate(40);
  }

  private respawn() {
    this.deaths++;
    if (this.mode === 'classic') {
      this.lives--;
      if (this.lives <= 0) {
        this.endGame(['GAME OVER', '', 'BETTER LUCK NEXT WEEKEND!', '', 'PRESS JUMP']);
        return;
      }
    }
    this.loadRoom(this.checkpoint.room);
    this.px = this.checkpoint.x;
    this.py = this.checkpoint.y;
    this.vx = this.vy = 0;
    this.knock = 0;
    this.grounded = true;
    this.lying = false;
    this.invuln = 90;
    input.clearLatches();
  }

  // ------------------------------------------------------------------ world
  private stepGuardians() {
    if (this.abId === 'keyboard' && this.abT > 0) return; // everyone stops to listen to Curtis
    const ws = this.worldSpeed();
    for (const g of this.guardians) {
      const d = g.def;
      const w = g.sprite.width;
      if (d.kind === 'jar' || d.kind === 'floater') {
        // Jonny's pint mesmerises things hovering over it
        if (this.pint && Math.abs(g.x + w / 2 - this.pint.x) < 20) continue;
        g.y += g.dir * g.speed * ws;
        if (g.y > d.y2) {
          g.y = d.y2;
          g.dir = -1;
        }
        if (g.y < d.y1) {
          g.y = d.y1;
          g.dir = 1;
        }
        continue;
      }
      const lo = d.x1;
      const hi = d.x2 - w;
      const ground = d.kind !== 'flyer';
      // Jonny's pint: things on the ground that reach it stop for a drink (Binks just sniffs it)
      if (this.pint && ground && g.pause <= 0) {
        const groundY = d.kind === 'binks' ? d.y : d.y + g.sprite.height;
        if (Math.abs(g.x + w / 2 - this.pint.x) < 6 && Math.abs(groundY - this.pint.y) < 24) {
          g.pause = 150;
          this.pint = null;
          this.say(d.kind === 'binks' ? 'BINKS SNIFFS THE PINT...' : 'TIME FOR A PINT...');
          sfx.blip(300);
        }
      }
      // Maffa's laser: things on the ground chase the dot
      if (this.laser && ground && g.pause <= 0) {
        const tx = Phaser.Math.Clamp(this.laser.x - w / 2, lo, hi);
        const sp = (d.kind === 'binks' ? 2.4 : g.speed * 1.4) * ws;
        if (Math.abs(tx - g.x) > sp) {
          g.dir = tx > g.x ? 1 : -1;
          g.x += g.dir * sp;
          if (d.kind === 'binks') g.phase += 0.3 * ws;
        }
        continue;
      }
      if (d.kind === 'binks') {
        // Binks: zooms about, hops, stops for a sniff now and then
        if (g.woof > 0) g.woof--;
        if (g.pause > 0) {
          g.pause -= ws;
          continue;
        }
        g.x += g.dir * g.speed * ws;
        g.phase += 0.25 * ws;
        if (g.x > hi || g.x < lo) {
          g.x = Phaser.Math.Clamp(g.x, lo, hi);
          g.dir *= -1;
          g.speed = 1.2 + Math.random() * 1.4;
        }
        if (Math.random() < 0.004) g.pause = 40 + Math.floor(Math.random() * 50);
        if (Math.random() < 0.01) g.speed = 1.2 + Math.random() * 1.4;
        continue;
      }
      if (g.pause > 0) {
        g.pause -= ws;
        continue;
      }
      if (g.woof > 0) g.woof--;
      g.x += g.dir * g.speed * ws;
      if (d.kind === 'flyer') g.phase += 0.07 * ws;
      if (g.x > hi) {
        g.x = hi;
        g.dir = -1;
      }
      if (g.x < lo) {
        g.x = lo;
        g.dir = 1;
      }
    }
  }

  private guardianBox(g: Guardian): [number, number, number, number] {
    const d = g.def;
    const w = g.sprite.width;
    const h = g.sprite.height;
    if (d.kind === 'binks') {
      const hop = g.pause > 0 ? 0 : Math.abs(Math.sin(g.phase)) * 8;
      return [g.x + 2, g.y - 11 - hop, 12, 10];
    }
    if (d.kind === 'hoover') return [g.x + 1, g.y + 1, 14, 6];
    const bob = d.kind === 'flyer' ? Math.sin(g.phase) * d.amp : 0;
    return [g.x + 1, g.y + bob + 1, w - 2, h - 2];
  }

  /** Knock-back guardians: Binks, and anything marked harmless. */
  private isBumper(g: Guardian) {
    const d = g.def;
    return d.kind === 'binks' || ((d.kind === 'walker' || d.kind === 'flyer') && !!d.harmless);
  }

  private checkCollisions() {
    const bx = this.px + 1;
    const by = this.py + 2;
    const bw = PW - 2;
    const bh = PH - 3;
    const overlap = (x: number, y: number, w: number, h: number) =>
      bx < x + w && bx + bw > x && by < y + h && by + bh > y;

    // items
    for (const it of [...this.items]) {
      if (overlap(it.x, it.y, 8, 8)) {
        this.collectItem(it);
        if (this.state !== 'play') return;
      }
    }

    // hazard tiles
    if (this.tileSafe > 0) return;
    const c0 = Math.floor(bx / T);
    const c1 = Math.floor((bx + bw - 1) / T);
    const r0 = Math.floor(by / T);
    const r1 = Math.floor((by + bh - 1) / T);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const ch = this.tile(c, r);
        if (ch === '^' && overlap(c * T + 1, r * T + 4, 6, 4)) return this.die();
        if (ch === 'F' && overlap(c * T + 1, r * T + 2, 6, 6)) return this.die();
        if (ch === 'W' && overlap(c * T, r * T + 3, T, 5)) return this.die();
      }
    }
    // steam
    if (this.steamActive()) {
      for (const v of this.vents) if (overlap(v.c * T + 1, (v.r - 3) * T, 6, 3 * T - 6)) return this.die();
    }

    // guardians (Luke lying down is untouchable)
    if (this.lying) return;
    for (const g of this.guardians) {
      const [x, y, w, h] = this.guardianBox(g);
      if (!overlap(x, y, w, h)) continue;
      if (this.isBumper(g)) {
        if (g.def.kind === 'binks' && (this.laser || g.pause > 0)) continue; // busy chasing the dot / sniffing a pint
        if (this.knock === 0) {
          const side = this.px + PW / 2 < x + w / 2 ? -1 : 1;
          this.knock = 22;
          this.vx = side * 2.2;
          this.vy = -2.6;
          this.grounded = false;
          g.woof = 45;
          g.pause = 30;
          sfx.bark();
        }
      } else if (this.invuln === 0) {
        return this.die();
      }
    }
  }

  private steamPhase() {
    return Math.floor(this.wt) % 150;
  }

  private collectItem(it: Item) {
    if (!this.items.includes(it)) return;
    this.collected.add(`${this.room.id}:${it.idx}`);
    it.sprite.destroy();
    this.items = this.items.filter((i) => i !== it);
    sfx.collect();
    this.burst(it.x + 4, it.y + 4, PAL.yellow, 'dot', 6);
    if (it.key === 'lighter') {
      this.hasLighter = true;
      this.say(this.hero.id === 'maffa' ? 'YOUR LIGHTER! NOW TO THE FIRE PIT' : "MAFFA'S LIGHTER! NOW: THE FIRE PIT");
      sfx.win();
    } else if (this.hero.id === 'maffa' && (it.key === 'porkpie' || it.key === 'milk')) {
      this.say(it.key === 'porkpie' ? 'A PORK PIE! MAFFA APPROVES.' : 'GLASS OF MILK! LOVELY.');
    }
    if (this.collected.size >= TOTAL_ITEMS) {
      sfx.win();
      this.say('ALL PARTY BITS FOUND! TO THE FIRE PIT!', 200);
    }
    this.save();
  }

  // ------------------------------------------------------------------ finale
  private atFirePit() {
    if (this.state !== 'play') return;
    if (!this.hasLighter) {
      if (this.frame - this.pitNag > 240) {
        this.pitNag = this.frame;
        this.say(this.hero.id === 'maffa' ? 'WHERE IS MY LIGHTER?!' : "NEED MAFFA'S LIGHTER TO LIGHT IT!", 150);
        sfx.blip(200);
      }
      return;
    }
    this.startFinale();
  }

  private startFinale() {
    clearSave();
    this.state = 'finale';
    this.vx = this.vy = 0;
    this.lying = false;
    this.laser = this.pint = this.hint = null;
    this.toast = null;
    playMusic('victory');
    sfx.win();
    for (const g of this.guardians) g.sprite.setVisible(g.def.kind === 'binks');
    for (const n of this.npcs) n.sprite.setVisible(false);

    const fire: { c: number; r: number }[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (this.tiles[r][c] === 'O') fire.push({ c, r });
    const fx0 = Math.min(...fire.map((f) => f.c)) * T;
    const fx1 = (Math.max(...fire.map((f) => f.c)) + 1) * T;
    const fireRow = fire[0].r;
    const centre = (fx0 + fx1) / 2;

    // the hero steps back from the fire
    this.px = fx0 - 14 - PW / 2;
    this.py = this.footY(this.px + PW / 2, fireRow) - PH;
    this.facing = 1;

    // everyone you talked to comes to the fire; Beth is always last (and 45 minutes late)
    const ids = CHARACTERS.map((c) => c.id).filter((id) => id !== this.hero.id && this.talked.has(id));
    ids.sort((a, b) => (a === 'beth' ? 1 : b === 'beth' ? -1 : 0));
    const slots: number[] = [];
    for (let k = 1; slots.length < ids.length && k < 20; k++) {
      for (const side of [1, -1]) {
        const x = centre + side * (fx1 - fx0) / 2 + side * (k * 13 + 4);
        if (x > 10 && x < RW - 10 && Math.abs(x - (this.px + PW / 2)) > 8) slots.push(x);
      }
    }
    const friends = ids.map((id, i) => {
      const def = charById(id);
      const tx = slots[i] ?? centre + 20;
      const sprite = this.add.image(-12, 0, `${id}_idle`).setOrigin(0.5, 1).setDepth(4);
      const delay = 30 + i * 28 + (id === 'beth' ? 120 : 0);
      return { def, sprite, x: -12, tx, y: this.footY(tx, fireRow), delay };
    });

    const n = friends.length;
    const pct = this.collected.size / TOTAL_ITEMS;
    let title: string;
    let lines: string[];
    let star = false;
    if (n >= 10 && pct >= 0.75) {
      title = 'THE PERFECT NIGHT';
      lines = ['THE WHOLE GANG IS HERE. THE FIRE ROARS,', 'AND A SHOOTING STAR CROSSES THE HOWGILLS.'];
      star = true;
    } else if (n >= 6) {
      title = 'A GRAND NIGHT';
      lines = ['MOST OF THE GANG MADE IT.', 'STORIES, SONGS AND TOASTED MARSHMALLOWS.'];
    } else if (n >= 2) {
      title = 'A COSY NIGHT';
      lines = ['A FEW FRIENDS AND A WARM FIRE.', 'TALK TO MORE FRIENDS NEXT TIME!'];
    } else {
      title = 'A QUIET NIGHT';
      lines = ['JUST YOU, THE FIRE AND THE STARS.', 'TALK TO YOUR FRIENDS SO THEY COME TOO!'];
    }
    lines.push('', `FRIENDS ${n}/${CHARACTERS.length - 1}   ITEMS ${this.collected.size}/${TOTAL_ITEMS}`, `LIT AT ${this.timeString()}   TUMBLES ${this.deaths}`);
    const lastArrive = friends.reduce((m, f) => Math.max(m, f.delay + Math.abs(f.tx + 12) / 1.4), 60);
    this.finale = { t: 0, fire, friends, title, lines, star, textAt: Math.min(lastArrive + 40, 900) };
    input.clearLatches();
  }

  /** The y of the ground under x, searching down from row r0. */
  private footY(x: number, r0: number) {
    const c = Phaser.Math.Clamp(Math.floor(x / T), 0, COLS - 1);
    for (let r = Math.max(0, r0); r < ROWS; r++) if (isSupport(this.tile(c, r)) && this.tile(c, r) !== 'O') return r * T;
    return (r0 + 1) * T;
  }

  private stepFinale() {
    const f = this.finale!;
    f.t++;
    this.stepGuardians();
    this.stepParticles();
    for (const fr of f.friends) {
      if (f.t < fr.delay) continue;
      if (Math.abs(fr.x - fr.tx) > 1.4) {
        fr.x += Math.sign(fr.tx - fr.x) * 1.4;
        fr.sprite.setTexture(`${fr.def.id}_${Math.floor(f.t / 6) % 2 ? 'run1' : 'run2'}`).setFlipX(fr.tx < fr.x);
      } else {
        fr.x = fr.tx;
        const fireX = (f.fire[0].c * T + (f.fire[f.fire.length - 1].c + 1) * T) / 2;
        fr.sprite.setTexture(`${fr.def.id}_idle`).setFlipX(fr.x > fireX);
      }
      fr.sprite.setPosition(Math.round(fr.x), fr.y);
      if (fr.def.id === 'beth' && Math.abs(fr.x - fr.tx) < 1.5 && !fr.sprite.getData('said')) {
        fr.sprite.setData('said', true);
        this.say('BETH: SORRY! I SAID FIVE MINUTES, DIDN\'T I?', 180);
      }
    }
    // sparks from the fire
    if (f.t % 4 === 0) {
      const ft = f.fire[Math.floor(Math.random() * f.fire.length)];
      this.parts.push({ x: ft.c * T + 4, y: ft.r * T - 4, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random(), t: 40, color: Math.random() < 0.5 ? PAL.yellow : PAL.orange, kind: 'dot' });
    }
    if (f.t > f.textAt + 30 && (input.takeJump() || input.takeTalk())) this.scene.start('title');
  }

  private drawFinale(g: Phaser.GameObjects.Graphics) {
    const f = this.finale!;
    // the fire
    for (const ft of f.fire) {
      const x = ft.c * T;
      const y = ft.r * T;
      for (let i = 0; i < 4; i++) {
        const h = 6 + ((f.t / 3 + i * 5 + ft.c * 3) % 7);
        g.fillStyle(i % 2 ? PAL.orange : PAL.red, 1);
        g.fillRect(x + i * 2, y - h + 1, 2, h);
      }
      g.fillStyle(PAL.yellow, 1);
      g.fillRect(x + 2 + (Math.floor(f.t / 5) % 3), y - 4, 2, 4);
    }
    // warm glow
    g.fillStyle(PAL.orange, 0.06 + 0.02 * Math.sin(f.t * 0.2));
    const cx = (f.fire[0].c * T + (f.fire[f.fire.length - 1].c + 1) * T) / 2;
    g.fillCircle(cx, f.fire[0].r * T, 60);
    // shooting star
    if (f.star && f.t > f.textAt - 60 && f.t < f.textAt + 40) {
      const k = (f.t - (f.textAt - 60)) / 100;
      const sx = 30 + k * 200;
      const sy = 14 + k * 40;
      for (let i = 0; i < 12; i++) {
        g.fillStyle(PAL.white, 1 - i / 12);
        g.fillRect(Math.round(sx - i * 3), Math.round(sy - i * 0.6), 2, 1);
      }
    }
    // the ending card
    if (f.t >= f.textAt) {
      const h = 26 + f.lines.length * 10;
      g.fillStyle(PAL.ink, 0.9);
      g.fillRect(8, 6, RW - 16, h);
      g.lineStyle(1, PAL.yellow, 1);
      g.strokeRect(8.5, 6.5, RW - 17, h - 1);
      drawTextCentered(g, f.title, RW / 2, 11, PAL.yellow, PAL.red, 2);
      f.lines.forEach((l, i) => drawTextCentered(g, l, RW / 2, 30 + i * 10, i >= f.lines.length - 2 ? PAL.lime : PAL.white));
      if (f.t > f.textAt + 30 && Math.floor(f.t / 30) % 2) drawTextCentered(g, 'PRESS JUMP', RW / 2, h + 10, PAL.white, PAL.ink);
    }
  }

  // ------------------------------------------------------------------ map screen
  private drawMap(g: Phaser.GameObjects.Graphics) {
    g.fillStyle(PAL.ink, 0.96);
    g.fillRect(0, 0, RW, RH);
    drawTextCentered(g, `YOU ARE IN: ${this.room.name.replace(/\s*\(.*\)/, '')}`, RW / 2, 4, PAL.yellow, PAL.red);
    const rooms = Object.values(ROOMS);
    const xs = rooms.map((r) => r.pos.x);
    const ys = rooms.map((r) => r.pos.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const cols = Math.max(...xs) - minX + 1;
    const rows = Math.max(...ys) - minY + 1;
    const cw = Math.min(36, Math.floor(248 / cols));
    const ch = Math.min(32, Math.floor(138 / rows));
    const ox = Math.floor((RW - cols * cw) / 2);
    const oy = 16;
    const cell = (r: RoomDef) => ({ x: ox + (r.pos.x - minX) * cw, y: oy + (r.pos.y - minY) * ch });
    const known = (id: string) =>
      this.visited.has(id) || Object.values(ROOMS[id].exits).some((e) => e && this.visited.has(e));
    // corridors between rooms
    g.fillStyle(PAL.grey, 1);
    for (const r of rooms) {
      if (!this.visited.has(r.id)) continue;
      const a = cell(r);
      for (const [dir, id] of Object.entries(r.exits)) {
        if (!id || !ROOMS[id]) continue;
        const b = cell(ROOMS[id]);
        if (dir === 'left' || dir === 'right') g.fillRect(Math.min(a.x, b.x) + cw / 2, a.y + ch / 2 - 1, Math.abs(a.x - b.x), 2);
        else g.fillRect(a.x + cw / 2 - 1, Math.min(a.y, b.y) + ch / 2, 2, Math.abs(a.y - b.y));
      }
    }
    for (const r of rooms) {
      if (!known(r.id)) continue;
      const { x, y } = cell(r);
      const seen = this.visited.has(r.id);
      g.fillStyle(seen ? r.theme.bg : PAL.slate, 1);
      g.fillRect(x + 2, y + 2, cw - 4, ch - 4);
      const here = r.id === this.room.id;
      g.lineStyle(1, here && Math.floor(this.frame / 15) % 2 ? PAL.yellow : seen ? PAL.lgrey : PAL.grey, 1);
      g.strokeRect(x + 2.5, y + 2.5, cw - 5, ch - 5);
      if (!seen) {
        drawTextCentered(g, '?', x + cw / 2, y + ch / 2 - 3, PAL.grey);
        continue;
      }
      if (here) {
        // the friend you're playing, standing in the room
        g.fillStyle(PAL.yellow, 1);
        g.fillRect(x + cw / 2 - 1, y + 5, 3, 3);
        g.fillRect(x + cw / 2 - 2, y + 8, 5, 4);
      }
      // items left (yellow dots) and friends not yet met (green dots)
      const left = this.remainingIn(r.id);
      for (let i = 0; i < Math.min(left, 5); i++) {
        g.fillStyle(PAL.yellow, 1);
        g.fillRect(x + 5 + i * 4, y + ch - 9, 2, 2);
      }
      const unmet = r.npcs.filter((n) => n.id !== this.hero.id && !this.talked.has(n.id)).length;
      for (let i = 0; i < unmet; i++) {
        g.fillStyle(PAL.lime, 1);
        g.fillRect(x + cw - 8 - i * 4, y + ch - 9, 2, 2);
      }
      if (r.map.join('').includes('O')) {
        g.fillStyle(this.hasLighter ? PAL.orange : PAL.red, 1);
        g.fillRect(x + cw / 2 - 1, y + ch / 2, 3, 3);
      }
    }
    const friends = CHARACTERS.length - 1;
    drawText(g, `* ITEMS ${this.collected.size}/${TOTAL_ITEMS}`, 4, RH - 18, PAL.yellow);
    drawText(g, `* FRIENDS MET ${[...this.talked].filter((t) => t !== this.hero.id).length}/${friends}`, 100, RH - 18, PAL.lime);
    drawText(g, this.hasLighter ? 'LIGHTER: FOUND!' : 'LIGHTER: MISSING', 4, RH - 9, this.hasLighter ? PAL.orange : PAL.red);
    if (Math.floor(this.frame / 30) % 2) drawText(g, 'M/JUMP TO CLOSE', RW - 92, RH - 9, PAL.lgrey);
  }

  private say(text: string, t = 150) {
    this.toast = { text, t };
  }

  private burst(x: number, y: number, color: number, kind: Particle['kind'], n: number) {
    for (let i = 0; i < n; i++) {
      this.parts.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.6,
        vy: -0.6 - Math.random() * 1.2,
        t: 30 + Math.floor(Math.random() * 20),
        color,
        kind,
      });
    }
  }

  private stepParticles() {
    for (const p of this.parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.kind === 'dot' ? 0.05 : -0.005;
      p.t--;
    }
    this.parts = this.parts.filter((p) => p.t > 0);
  }

  // ------------------------------------------------------------------ abilities
  private worldSpeed() {
    return this.abId === 'late' && this.abT > 0 ? 0.35 : 1;
  }

  private stepAbilityTimers() {
    if (this.abCd > 0) this.abCd--;
    if (this.abT > 0) this.abT--;
    if (this.tileSafe > 0) this.tileSafe--;
    if (this.abId === 'tacos' && !this.shield) {
      if (--this.shieldCd <= 0) {
        this.shield = true;
        this.say('TACOS READY!', 90);
      }
    }
    if (this.pint && --this.pint.t <= 0) this.pint = null;
    if (this.abId === 'laser' && this.abT > 0) {
      this.laser = {
        x: Phaser.Math.Clamp(this.px + PW / 2 + this.facing * 56, 4, RW - 4),
        y: this.py + PH - 1,
      };
    } else this.laser = null;
    if (this.abId === 'keyboard' && this.abT > 0 && this.frame % 12 === 0) {
      this.burst(this.px + PW / 2, this.py + 4, [PAL.yellow, PAL.lime, PAL.white][this.frame % 3], 'note', 1);
    }
    if (this.abId === 'quiz' && this.abT === 0) this.hint = null;
  }

  private useAbility() {
    const a = this.ab;
    if (!a.active) {
      this.say(`${a.name.toUpperCase()} IS ALWAYS ON`, 90);
      return;
    }
    if (this.abCd > 0) {
      sfx.blip(180);
      return;
    }
    let ok = true;
    switch (this.abId) {
      case 'late':
        this.say('FIVE MORE MINUTES...');
        sfx.slow();
        break;
      case 'keyboard':
        this.say('KEYBOARD SOLO!');
        sfx.chord();
        break;
      case 'laser':
        this.say('LASER POINTER!');
        sfx.select();
        break;
      case 'panic':
        this.say('IS THAT RAIN?! PANIC!');
        sfx.bounce();
        break;
      case 'pint':
        if (!this.grounded) {
          ok = false;
          break;
        }
        this.pint = { x: this.px + PW / 2 + this.facing * 8, y: this.py + PH, t: a.duration };
        this.say('PINT?', 60);
        sfx.select();
        break;
      case 'quiz':
        ok = this.makeHint();
        this.say(ok ? 'I KNOW THIS ONE!' : 'NOTHING LEFT TO FIND!', 90);
        break;
      case 'fetch': {
        const it = this.nearestItem();
        if (!it || !this.pal) {
          this.say('BINKS: NOTHING HERE!', 90);
          ok = false;
          break;
        }
        this.pal.fetch = it;
        this.say('HERE, BINKS! FETCH!', 90);
        sfx.bark();
        break;
      }
      case 'liedown':
        if (!this.grounded) {
          ok = false;
          break;
        }
        this.lying = true;
        this.vx = 0;
        this.say('JUST A LITTLE LIE DOWN...', 90);
        break;
      case 'stuff':
        ok = this.dropStuff();
        break;
      default:
        ok = false;
    }
    if (ok) {
      this.abCd = a.cooldown;
      this.abT = a.duration;
    }
  }

  private nearestItem(): Item | null {
    let best: Item | null = null;
    let bd = Infinity;
    for (const it of this.items) {
      const d = Math.hypot(it.x + 4 - (this.px + PW / 2), it.y + 4 - (this.py + PH / 2));
      if (d < bd) {
        bd = d;
        best = it;
      }
    }
    return best;
  }

  private remainingIn(roomId: string) {
    const total = ROOMS[roomId].map.join('').split('*').length - 1;
    let got = 0;
    for (const k of this.collected) if (k.startsWith(roomId + ':')) got++;
    return total - got;
  }

  /** Becca: point at the nearest item, or at the exit towards the nearest room with items left. */
  private makeHint(): boolean {
    const it = this.nearestItem();
    if (it) {
      this.hint = { x: it.x + 4, y: it.y + 4, label: '' };
      return true;
    }
    const seen = new Set([this.room.id]);
    const queue: { id: string; first: string }[] = [];
    for (const [dir, id] of Object.entries(this.room.exits)) if (id && ROOMS[id]) queue.push({ id, first: dir });
    while (queue.length) {
      const q = queue.shift()!;
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      if (this.remainingIn(q.id) > 0) {
        const cy = this.py + PH / 2;
        const pos: Record<string, [number, number]> = {
          left: [6, cy],
          right: [RW - 6, cy],
          up: [RW / 2, 6],
          down: [RW / 2, RH - 6],
        };
        const [x, y] = pos[q.first];
        this.hint = { x, y, label: ROOMS[q.id].name.replace(/\s*\(.*\)/, '') };
        return true;
      }
      for (const id of Object.values(ROOMS[q.id].exits)) if (id && ROOMS[id] && !seen.has(id)) queue.push({ id, first: q.first });
    }
    return false;
  }

  /** Beez: leave a pile of stuff where you stand, and climb onto it. */
  private dropStuff(): boolean {
    if (!this.grounded || this.piles >= 3) {
      this.say(this.piles >= 3 ? 'BEEZ HAS LEFT ENOUGH STUFF HERE' : 'NEED TO BE STANDING', 90);
      return false;
    }
    const c = Math.floor((this.px + PW / 2) / T);
    const rFeet = Math.round((this.py + PH) / T);
    const r = rFeet - 1;
    const headRow = Math.floor((this.py - T) / T);
    if (r < 0 || this.tile(c, r) !== '.' || isSolid(this.tile(c, headRow)) || headRow < 0) {
      this.say('NO ROOM FOR STUFF HERE', 90);
      return false;
    }
    this.tiles[r][c] = 'S';
    this.piles++;
    this.py -= T;
    this.px = c * T; // centre on the pile
    sfx.bounce();
    this.say(['LEFT HIS COAT HERE', 'LEFT SOME BOOKS HERE', 'LEFT A BAG HERE'][this.piles - 1], 60);
    return true;
  }

  private stepCompanion() {
    const c = this.pal;
    if (!c) return;
    if (Number.isNaN(c.x)) {
      c.x = this.px + PW / 2 - this.facing * 14;
      c.y = this.py + PH;
    }
    if (c.woof > 0) c.woof--;
    if (c.fetch) {
      const it = c.fetch;
      if (!this.items.includes(it)) {
        c.fetch = null;
        return;
      }
      const tx = it.x + 4;
      const ty = it.y + 8;
      const d = Math.hypot(tx - c.x, ty - c.y);
      if (d < 4) {
        this.collectItem(it);
        c.fetch = null;
        c.woof = 45;
        sfx.bark();
      } else {
        c.x += ((tx - c.x) / d) * 2.6;
        c.y += ((ty - c.y) / d) * 2.6;
        c.phase += 0.3;
      }
      return;
    }
    const tx = this.px + PW / 2 - this.facing * 14;
    const ty = this.py + PH;
    const before = c.x;
    c.x += (tx - c.x) * 0.12;
    c.y += (ty - c.y) * 0.2;
    if (Math.abs(c.x - before) > 0.2 && !this.lying) c.phase += 0.25;
  }

  /** Debra: nearby items drift towards her. */
  private stepTidy() {
    if (this.abId !== 'tidy') return;
    const cx = this.px + PW / 2;
    const cy = this.py + PH / 2;
    for (const it of this.items) {
      const dx = cx - (it.x + 4);
      const dy = cy - (it.y + 4);
      const d = Math.hypot(dx, dy);
      if (d < 32 && d > 0.5) {
        it.x += (dx / d) * 1.4;
        it.y += (dy / d) * 1.4;
      }
    }
  }
  private steamActive() {
    const p = this.steamPhase();
    return p >= 70 && p < 115;
  }

  private checkExits() {
    const cx = this.px + PW / 2;
    const cy = this.py + PH / 2;
    const ex = this.room.exits;
    if (cx < 0) {
      if (ex.left) {
        this.loadRoom(ex.left);
        this.px += RW;
      } else this.px = -PW / 2;
    } else if (cx > RW) {
      if (ex.right) {
        this.loadRoom(ex.right);
        this.px -= RW;
      } else this.px = RW - PW / 2;
    } else if (cy < 0 && ex.up) {
      this.loadRoom(ex.up);
      this.py += RH;
      this.vy = Math.min(this.vy, ENTRY_BOOST); // a helpful boost so you clear the floor above
    } else if (cy > RH) {
      if (ex.down) {
        this.loadRoom(ex.down);
        this.py -= RH;
      } else {
        this.die();
      }
    }
  }

  private nearNpc(): Npc | null {
    const cx = this.px + PW / 2;
    for (const n of this.npcs) {
      if (Math.abs(n.x - cx) < 18 && Math.abs(n.y - (this.py + PH)) < 12) return n;
    }
    return null;
  }

  // ------------------------------------------------------------------ dialogue
  private startTalk(n: Npc) {
    let said = [...n.lines];
    if (this.collected.size >= TOTAL_ITEMS - 3 && this.collected.size > 0) {
      said = [`Only ${TOTAL_ITEMS - this.collected.size} to go! You're nearly there.`];
    }
    if (n.def.partner === this.hero.id && !n.custom) said[0] = `There you are, ${this.hero.name}! ` + said[0];
    const me = this.hero;
    const lines: Line[] = [];
    // your own quirks come out in conversation too
    if (me.id === 'tom') {
      lines.push({ who: me, text: `Before you say anything, can I just say a few words about ${n.def.name}? An absolute legend. A credit to Brownber Hall.` });
      said[0] = `Aw, thanks Tom! ` + said[0];
    } else if (me.id === 'jonny') {
      lines.push({ who: me, text: 'Pint?' });
      said[0] = `Go on then, cheers Jonny! ` + said[0];
    } else if (me.id === 'nick' && Math.random() < 0.5) {
      lines.push({ who: me, text: 'Thumbs up!' });
    }
    for (const text of said) lines.push({ who: n.def, text });
    this.talk = { npc: n, lines, idx: 0, shown: 0 };
    this.state = 'talk';
    if (!this.talked.has(n.def.id)) {
      this.talked.add(n.def.id);
      this.save();
    }
    n.sprite.setFlipX(this.px + PW / 2 < n.x);
    this.showPortrait(lines[0].who);
    input.clearLatches();
  }

  private showPortrait(who: CharDef) {
    const key = `portrait_${who.id}`;
    if (this.textures.exists(key)) this.portrait.setTexture(key).setScale(1).setVisible(true);
    else this.portrait.setTexture(`${who.id}_idle`).setScale(2).setVisible(true);
  }

  private stepTalk() {
    const t = this.talk!;
    const line = t.lines[t.idx].text;
    if (t.shown < line.length) {
      t.shown = Math.min(line.length, t.shown + 1.5);
      if (Math.floor(t.shown) % 3 === 0) sfx.blip(500 + (t.lines[t.idx].who.id.charCodeAt(0) % 8) * 40);
    }
    if (input.takeJump() || input.takeTalk()) {
      if (t.shown < line.length) t.shown = line.length;
      else if (t.idx < t.lines.length - 1) {
        t.idx++;
        t.shown = 0;
        this.showPortrait(t.lines[t.idx].who);
      } else {
        this.talk = null;
        this.state = 'play';
        this.portrait.setVisible(false);
        input.clearLatches();
      }
    }
  }

  private endGame(text: string[], state: 'won' | 'over' = 'over') {
    clearSave();
    this.state = state;
    this.overText = text;
    if (state === 'won') playMusic('victory');
    else stopMusic();
    this.frame = 0;
    input.clearLatches();
  }

  // ------------------------------------------------------------------ render
  private render() {
    // player
    let frame: Frame = 'idle';
    if (!this.grounded) frame = 'jump';
    else if (Math.abs(this.vx) > 0.3 && this.knock === 0) frame = Math.floor(this.animT / 6) % 2 ? 'run1' : 'run2';
    this.player
      .setTexture(`${this.hero.id}_${frame}`)
      .setPosition(Math.round(this.px + PW / 2), Math.round(this.py + PH))
      .setFlipX(this.facing < 0)
      .setVisible(this.dying > 0 ? Math.floor(this.dying / 3) % 2 === 0 : this.invuln > 0 ? Math.floor(this.invuln / 4) % 2 === 0 : true);
    if (this.dying > 0) this.player.setAngle((45 - this.dying) * 8);
    else if (this.lying) {
      this.player.setTexture(`${this.hero.id}_idle`).setAngle(this.facing > 0 ? -90 : 90);
      this.player.setY(Math.round(this.py + PH - 8));
    } else this.player.setAngle(0);

    // Binks the companion (Tom and Luke)
    if (this.pal) {
      const c = this.pal;
      const moving = !!c.fetch || Math.abs(c.x - (this.px + PW / 2 - this.facing * 14)) > 2;
      const hop = moving ? Math.abs(Math.sin(c.phase)) * 5 : 0;
      c.sprite
        .setTexture(moving && Math.floor(c.phase / 1.5) % 2 ? 'binks_b' : 'binks_a')
        .setPosition(Math.round(Number.isNaN(c.x) ? -50 : c.x), Math.round(c.y - hop))
        .setFlipX(c.fetch ? c.fetch.x + 4 < c.x : this.facing < 0);
    }

    // guardians
    for (const g of this.guardians) {
      if (g.def.kind === 'binks') {
        const hop = g.pause > 0 ? 0 : Math.abs(Math.sin(g.phase)) * 8;
        const f = g.pause > 0 ? 'binks_a' : Math.floor(g.phase / 1.5) % 2 ? 'binks_a' : 'binks_b';
        g.sprite.setTexture(f).setPosition(Math.round(g.x), Math.round(g.y - 12 - hop)).setFlipX(g.dir < 0);
      } else {
        const d = g.def;
        const bob = d.kind === 'flyer' ? Math.sin(g.phase) * d.amp : 0;
        g.sprite.setPosition(Math.round(g.x), Math.round(g.y + bob));
        if (d.kind === 'hoover' || d.kind === 'walker' || d.kind === 'flyer') g.sprite.setFlipX(g.dir < 0);
        if (d.kind === 'jar' || d.kind === 'floater') g.sprite.setAngle(Math.sin(this.frame * 0.1) * 10);
      }
    }

    // items bob and glint
    for (const it of this.items) {
      it.sprite.setY(it.y + Math.round(Math.sin((this.frame + it.idx * 20) * 0.08)));
      it.sprite.setAlpha(this.frame % 40 < 4 ? 0.6 : 1);
    }

    // NPCs face the player (Luke is having a lie down)
    for (const n of this.npcs) {
      if (n.pose === 'lying') n.sprite.setAngle(-90).setY(n.y - 8).setFlipX(false);
      else n.sprite.setFlipX(this.px + PW / 2 < n.x);
    }

    this.drawDynamic();
    this.drawFx();
    this.drawHud();
    this.drawUi();
  }

  private drawPile(g: Phaser.GameObjects.Graphics, x: number, y: number, n: number) {
    // Beez's stuff: a coat, some books, a bag
    const cols = [
      [PAL.red, PAL.navy, PAL.yellow],
      [PAL.green, PAL.orange, PAL.blue],
      [PAL.plum, PAL.lgrey, PAL.teal],
    ][n % 3];
    g.fillStyle(cols[0], 1);
    g.fillRect(x, y + 5, 8, 3);
    g.fillStyle(cols[1], 1);
    g.fillRect(x + 1, y + 2, 6, 3);
    g.fillStyle(cols[2], 1);
    g.fillRect(x + 2, y, 4, 2);
    g.fillStyle(PAL.ink, 1);
    g.fillRect(x, y + 4, 8, 1);
  }

  private drawDynamic() {
    const g = this.dyn;
    g.clear();
    const th = this.room.theme;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = this.tiles[r][c];
        const x = c * T;
        const y = r * T;
        if (ch === 'S') {
          this.drawPile(g, x, y, c + r);
        } else if (ch === 'W') {
          const surface = this.tile(c, r - 1) !== 'W';
          g.fillStyle(PAL.navy, 1);
          g.fillRect(x, y + (surface ? 2 : 0), T, surface ? 6 : T);
          g.fillStyle(PAL.blue, 1);
          if (surface) g.fillRect(x, y + 2, T, 2);
          g.fillStyle(0x73eff7, 1);
          const k = Math.floor(this.frame / 8 + c) % 8;
          if (surface) g.fillRect(x + k, y + 2, 2, 1);
        } else if (ch === 'C') {
          const hp = this.crumble.get(`${c},${r}`) ?? CRUMBLE_HP;
          const h = Math.max(1, Math.ceil((hp / CRUMBLE_HP) * 4));
          g.fillStyle(PAL.brown, 1);
          g.fillRect(x, y + (4 - h), T, h);
          g.fillStyle(PAL.ink, 1);
          g.fillRect(x + 2, y + (4 - h), 1, h);
          g.fillRect(x + 5, y + 1 + (4 - h), 1, Math.max(0, h - 1));
        } else if (ch === '<' || ch === '>') {
          g.fillStyle(PAL.slate, 1);
          g.fillRect(x, y, T, 4);
          g.fillStyle(PAL.lgrey, 1);
          const off = Math.floor(this.frame / 4) % 4;
          const sx = ch === '<' ? (4 - off) % 4 : off;
          g.fillRect(x + sx, y + 1, 2, 1);
          g.fillRect(x + ((sx + 4) % 8), y + 1, 2, 1);
          g.fillStyle(PAL.ink, 1);
          g.fillRect(x, y + 4, T, 1);
        } else if (ch === 'F') {
          const f = this.frame;
          g.fillStyle(PAL.ink, 1);
          g.fillRect(x, y + 6, T, 2);
          for (let i = 0; i < 4; i++) {
            const h = 3 + ((f / 3 + i * 7 + c * 3) % 4);
            g.fillStyle(i % 2 ? PAL.orange : PAL.red, 1);
            g.fillRect(x + i * 2, y + 6 - h, 2, h);
          }
          g.fillStyle(PAL.yellow, 1);
          g.fillRect(x + 2 + (Math.floor(f / 5) % 3), y + 4, 2, 2);
        }
      }
    }
    // steam
    const p = this.steamPhase();
    for (const v of this.vents) {
      const x = v.c * T;
      const y = v.r * T - 6;
      if (p >= 50 && p < 70) {
        g.fillStyle(PAL.white, 0.6);
        g.fillRect(x + 3, y - 2 - (p % 4), 2, 2);
      } else if (this.steamActive()) {
        for (let i = 0; i < 6; i++) {
          const yy = y - 4 - ((p * 2 + i * 7) % 18);
          const xx = x + 1 + ((i * 5 + p) % 5);
          g.fillStyle(i % 2 ? PAL.white : PAL.lgrey, 0.85);
          g.fillRect(xx, yy, 3, 3);
        }
      }
    }
    void th;
  }

  private drawFx() {
    const g = this.fx;
    g.clear();
    // Beth: the world goes slow and dreamy
    if (this.abId === 'late' && this.abT > 0) {
      g.fillStyle(PAL.navy, 0.18);
      g.fillRect(0, 0, RW, RH);
      drawText(g, `${Math.ceil(this.abT / 60)}`, Math.round(this.px - 1), Math.round(this.py - 12), PAL.lgrey, PAL.ink);
    }
    // Nick: imaginary rain
    if (this.abId === 'panic' && this.abT > 0) {
      g.fillStyle(PAL.blue, 0.8);
      for (let i = 0; i < 40; i++) {
        const x = (i * 53 + this.frame * 3) % RW;
        const y = (i * 37 + this.frame * 6) % RH;
        g.fillRect(x, y, 1, 4);
      }
    }
    // Maffa's laser dot
    if (this.laser) {
      g.fillStyle(PAL.red, 0.35);
      const hx = this.px + PW / 2 + this.facing * 5;
      const hy = this.py + 13;
      for (let i = 0; i <= 10; i++) g.fillRect(Math.round(hx + ((this.laser.x - hx) * i) / 10), Math.round(hy + ((this.laser.y - hy) * i) / 10), 1, 1);
      g.fillStyle(PAL.red, 1);
      g.fillRect(this.laser.x - 1, this.laser.y - 1, 3, 3);
      if (this.frame % 10 < 5) {
        g.fillStyle(PAL.white, 1);
        g.fillRect(this.laser.x, this.laser.y, 1, 1);
      }
    }
    // Jonny's pint
    if (this.pint) {
      const x = Math.round(this.pint.x) - 2;
      const y = Math.round(this.pint.y) - 7;
      g.fillStyle(PAL.white, 1);
      g.fillRect(x, y, 5, 2);
      g.fillStyle(0xd9902a, 1);
      g.fillRect(x, y + 2, 5, 5);
      g.fillStyle(PAL.lgrey, 1);
      g.fillRect(x + 5, y + 3, 1, 3);
    }
    // Becca's hint
    if (this.hint && this.abT > 0) {
      const sx = this.px + PW / 2;
      const sy = this.py + 8;
      const d = Math.hypot(this.hint.x - sx, this.hint.y - sy) || 1;
      const off = (this.frame * 0.6) % 8;
      g.fillStyle(PAL.yellow, 1);
      for (let k = 10 + off; k < d - 6; k += 8) {
        g.fillRect(Math.round(sx + ((this.hint.x - sx) * k) / d) - 1, Math.round(sy + ((this.hint.y - sy) * k) / d) - 1, 2, 2);
      }
      if (this.frame % 20 < 14) {
        g.lineStyle(1, PAL.yellow, 1);
        g.strokeRect(Math.round(this.hint.x) - 6.5, Math.round(this.hint.y) - 6.5, 13, 13);
      }
      if (this.hint.label) drawTextCentered(g, this.hint.label, Phaser.Math.Clamp(this.hint.x, 50, RW - 50), Phaser.Math.Clamp(this.hint.y + 10, 10, RH - 10), PAL.yellow, PAL.ink);
    }
    // Sophie's cockatiel
    if (this.abId === 'glide' && this.dying === 0) {
      const bx = Math.round(this.px + PW / 2 - 3);
      const by = Math.round(this.gliding ? this.py - 8 : this.py - 3);
      const flap = this.gliding ? Math.floor(this.frame / 4) % 2 : 0;
      if (this.gliding || this.frame % 240 < 200) {
        g.fillStyle(PAL.lgrey, 1);
        g.fillRect(bx + 1, by + 2, 4, 2);
        g.fillRect(bx + (flap ? -2 : 0), by + (flap ? 0 : 2), 3, 1);
        g.fillRect(bx + (flap ? 4 : 4), by + (flap ? 0 : 2), 3, 1);
        g.fillStyle(PAL.yellow, 1);
        g.fillRect(bx + 4, by, 2, 2);
        g.fillRect(bx + 5, by - 1, 1, 1);
        g.fillStyle(PAL.orange, 1);
        g.fillRect(bx + 5, by + 1, 1, 1);
      }
    }
    // Luke (and NPC Luke): Zzz
    const zzz = (x: number, y: number) => {
      const k = Math.floor(this.frame / 20) % 3;
      drawText(g, 'Z', x + k * 2, y - k * 3, PAL.white, PAL.ink);
    };
    if (this.lying) zzz(Math.round(this.px + PW / 2), Math.round(this.py + 4));
    for (const n of this.npcs) if (n.pose === 'lying') zzz(n.x + 4, n.y - 22);
    if (this.pal && this.pal.woof > 0) drawText(g, 'WOOF!', Math.round(this.pal.x - 14), Math.round(this.pal.y - 22), PAL.yellow, PAL.ink);
    // particles (notes and sparkles)
    for (const p of this.parts) {
      g.fillStyle(p.color, Math.min(1, p.t / 15));
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (p.kind === 'note') {
        g.fillRect(x, y, 2, 2);
        g.fillRect(x + 1, y - 4, 1, 4);
        g.fillRect(x + 2, y - 4, 1, 1);
      } else g.fillRect(x, y, 1, 1);
    }
    // items twinkle so they stand out against busy wallpaper
    for (const it of this.items) {
      const p = (this.frame + it.idx * 17) % 60;
      if (p < 10) {
        const sx = it.x + (it.idx % 2 ? 0 : 7);
        const sy = it.y - 1;
        g.fillStyle(PAL.white, 1);
        g.fillRect(sx, sy, 1, 1);
        if (p > 2 && p < 8) {
          g.fillRect(sx - 1, sy, 3, 1);
          g.fillRect(sx, sy - 1, 1, 3);
        }
      }
    }
    if (this.toast) {
      this.toast.t--;
      if (this.toast.t <= 0) this.toast = null;
      else if (this.toast.t > 30 || Math.floor(this.toast.t / 4) % 2) {
        const w = this.toast.text.length * 6 + 8;
        g.fillStyle(PAL.ink, 0.9);
        g.fillRect(128 - w / 2, 72, w, 14);
        drawTextCentered(g, this.toast.text, 128, 76, PAL.yellow);
      }
    }
    for (const gu of this.guardians) {
      if (gu.def.kind === 'binks' && gu.woof > 0) {
        drawText(g, 'WOOF!', Math.round(gu.x - 6), Math.round(gu.y - 30), PAL.yellow, PAL.ink);
      }
    }
    if (this.state === 'play' && this.dying === 0) {
      const n = this.nearNpc();
      if (n) {
        const bob = Math.floor(this.frame / 15) % 2;
        g.fillStyle(PAL.ink, 1);
        drawText(g, 'TALK', n.x - 11, n.y - 36 - bob, PAL.white, PAL.ink);
      }
    }
  }

  private abilityMeter() {
    if (this.abId === 'tacos') return this.shield ? 1 : 1 - this.shieldCd / this.ab.cooldown;
    if (!this.ab.active || this.ab.cooldown === 0) return 1;
    return 1 - this.abCd / this.ab.cooldown;
  }

  private timeString() {
    const m = Math.floor(this.clock) % (24 * 60);
    let h = Math.floor(m / 60);
    const mm = m % 60;
    const pm = h >= 12;
    h = h % 12 || 12;
    return `${h}:${mm.toString().padStart(2, '0')}${pm ? 'PM' : 'AM'}`;
  }

  private drawHud() {
    const time = this.timeString();
    const meter = this.abilityMeter();
    const key = `${this.room.id}|${this.collected.size}|${time}|${this.lives}|${Math.floor(meter * 12)}|${this.hasLighter}`;
    if (key === this.hudKey) return;
    this.hudKey = key;
    const g = this.hud;
    const th = this.room.theme;
    g.clear();
    g.fillStyle(th.bar, 1);
    g.fillRect(0, RH, RW, 8);
    drawTextCentered(g, this.room.name, RW / 2, RH + 1, th.barText);
    g.fillStyle(PAL.ink, 1);
    g.fillRect(0, RH + 8, RW, 8);
    drawText(g, `ITEMS ${String(this.collected.size).padStart(2, '0')}/${TOTAL_ITEMS}`, 2, RH + 9, PAL.yellow);
    drawTextCentered(g, time, RW / 2 + 24, RH + 9, PAL.white);
    // ability meter: full and bright when ready
    g.fillStyle(PAL.slate, 1);
    g.fillRect(74, RH + 10, 24, 5);
    g.fillStyle(meter >= 1 ? PAL.lime : PAL.grey, 1);
    g.fillRect(74, RH + 10, Math.round(24 * meter), 5);
    if (this.abId === 'tacos') drawText(g, this.shield ? '*' : ' ', 100, RH + 9, PAL.orange);
    if (this.hasLighter) {
      // a little lighter icon: you're ready for the fire pit
      g.fillStyle(PAL.red, 1);
      g.fillRect(108, RH + 11, 4, 4);
      g.fillStyle(PAL.yellow, 1);
      g.fillRect(109, RH + 9, 2, 2);
    }
    if (this.mode === 'classic') {
      drawText(g, '@'.repeat(Math.max(0, this.lives)), RW - 2 - this.lives * 6, RH + 9, PAL.red);
    } else {
      drawText(g, 'COSY', RW - 26, RH + 9, PAL.lime);
    }
  }

  private drawUi() {
    const g = this.ui;
    g.clear();
    if (this.state === 'talk' && this.talk) {
      const t = this.talk;
      g.fillStyle(PAL.ink, 0.92);
      g.fillRect(4, 4, RW - 8, 56);
      g.lineStyle(1, PAL.yellow, 1);
      g.strokeRect(4.5, 4.5, RW - 9, 55);
      this.portrait.setPosition(8, 8);
      const ln = t.lines[t.idx];
      drawText(g, ln.who.name, 62, 8, ln.who.id === this.hero.id ? PAL.lime : PAL.yellow);
      const text = ln.text.slice(0, Math.floor(t.shown));
      wrap(text, 31).slice(0, 5).forEach((l, i) => drawText(g, l, 62, 19 + i * 9, PAL.white));
      if (t.shown >= ln.text.length && Math.floor(this.frame / 20) % 2) {
        g.fillStyle(PAL.yellow, 1);
        g.fillRect(RW - 14, 52, 5, 2);
        g.fillRect(RW - 13, 54, 3, 1);
      }
    } else if (this.state === 'map') {
      this.drawMap(g);
    } else if (this.state === 'finale' && this.finale) {
      this.drawFinale(g);
    } else if (this.state === 'won' || this.state === 'over') {
      g.fillStyle(PAL.ink, 0.88);
      g.fillRect(20, 40, RW - 40, 20 + this.overText.length * 10);
      g.lineStyle(1, this.state === 'won' ? PAL.lime : PAL.red, 1);
      g.strokeRect(20.5, 40.5, RW - 41, 19 + this.overText.length * 10);
      this.overText.forEach((l, i) => drawTextCentered(g, l, RW / 2, 50 + i * 10, i === 0 ? PAL.yellow : PAL.white));
    }
  }
}
