import Phaser from './phaser';
import { PAL } from './palette';
import { CHARACTERS, charById } from './characters';
import { ABILITIES } from './abilities';
import { bakeAll } from './sprites';
import { drawText, drawTextCentered, drawTextRows, wrap } from './font';
import { is16, setStyle } from './settings';
import { rebakeAll } from './sprites';
import { lighten, mix } from './colour';
import { input, keyName } from './input';
import { sfx } from './sound';
import { playMusic } from './music';
import { loadSave, type SaveData } from './save';

type Mode = 'cosy' | 'classic' | 'zombie';
const MODES: Mode[] = ['cosy', 'classic', 'zombie'];
import { BUILD_ID } from './update';
import { getLegends } from './legends';
import { artFiles } from './art';

const W = 256;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }
  preload() {
    for (const c of CHARACTERS) if (c.portrait) this.load.image(`portrait_${c.id}`, `portraits/${c.portrait}.png`);
    for (const f of artFiles()) {
      this.load.image(`art_${f}_16`, `art/${f}_16.png`);
      this.load.image(`art_${f}_8`, `art/${f}_8.png`);
    }
    this.load.on('loaderror', () => {
      /* a missing portrait just falls back to the sprite */
    });
  }
  create() {
    bakeAll(this);
    this.scene.start('title');
  }
}

// ---------------------------------------------------------------- title
let pendingRebake = false;

export class TitleScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private binks!: Phaser.GameObjects.Image;
  private mode: Mode = 'cosy';
  private t = 0;
  private bx = -20;

  constructor() {
    super('title');
  }

  create() {
    try {
      this.mode = (localStorage.getItem('bb-mode') as Mode) || 'cosy';
    } catch {
      /* ignore */
    }
    if (pendingRebake) {
      pendingRebake = false;
      rebakeAll(this);
    }
    this.cameras.main.setBackgroundColor(PAL.ink);
    playMusic('title');
    this.g = this.add.graphics();
    this.binks = this.add.image(-20, 150, 'binks_a').setOrigin(0, 1);
    input.clearLatches();
    this.save = loadSave();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.save && p.y < 112) return this.cont();
      if (p.y >= 134 && p.y < 154) return this.toggleStyle();
      if (p.y >= 156 && p.y < 172) return this.toggleMode();
      this.go();
    });
  }

  /** Switch between the 8-bit original and the 16-bit upgrade. */
  private toggleStyle() {
    setStyle(is16() ? '8bit' : '16bit');
    sfx.select();
    // re-bake after the restart, once nothing on screen is using the old textures
    pendingRebake = true;
    this.scene.restart();
  }

  private toggleMode() {
    this.mode = MODES[(MODES.indexOf(this.mode) + 1) % MODES.length];
    try {
      localStorage.setItem('bb-mode', this.mode);
    } catch {
      /* ignore */
    }
    sfx.select();
  }

  private save: SaveData | null = null;

  private cont() {
    sfx.select();
    this.scene.start('game', { cont: true, hero: this.save!.hero, mode: this.save!.mode });
  }

  private go() {
    sfx.select();
    this.scene.start('select', { mode: this.mode });
  }

  /** The 16-bit title backdrop: banded dusk sky, layered fells, a shaded Hall with smoking chimneys. */
  private drawScene16(g: Phaser.GameObjects.Graphics) {
    const stops: [number, number][] = [
      [0, 0x0a0e2a],
      [60, 0x2a2458],
      [100, 0x7a3c74],
      [124, 0xe0705e],
      [150, 0xf8b870],
    ];
    for (let y = 0; y < 150; y += 2) {
      let c = stops[stops.length - 1][1];
      for (let i = 0; i < stops.length - 1; i++) {
        const [a, ca] = stops[i];
        const [b, cb] = stops[i + 1];
        if (y <= b) {
          c = mix(ca, cb, (y - a) / (b - a));
          break;
        }
      }
      g.fillStyle(c, 1);
      g.fillRect(0, y, W, 2);
    }
    for (let i = 0; i < 50; i++) {
      const x = (i * 97) % W;
      const y = (i * 53) % 80;
      const tw = (this.t + i * 13) % 90 < 8;
      g.fillStyle(tw ? PAL.white : 0xa8b4e0, tw ? 1 : 0.7);
      g.fillRect(x, y, 1, 1);
      if (tw && i % 3 === 0) {
        g.fillRect(x - 1, y, 3, 1);
        g.fillRect(x, y - 1, 1, 3);
      }
    }
    // far fells drift slowly (parallax), near fells a bit faster
    const far = (this.t * 0.05) % W;
    g.fillStyle(0x5a4a7a, 1);
    for (let x = 0; x < W; x++) {
      const h = 40 + Math.sin((x + far) / 37) * 11 + Math.sin((x + far) / 15) * 3;
      g.fillRect(x, 150 - h, 1, h);
    }
    const near = (this.t * 0.12) % W;
    g.fillStyle(0x2c2a4c, 1);
    for (let x = 0; x < W; x++) {
      const h = 20 + Math.sin((x + near) / 28) * 8 + Math.sin((x + near) / 10) * 2;
      g.fillRect(x, 150 - h, 1, h);
    }
    // the Hall, shaded, with a slate roof and chimneys
    const hx = 80;
    g.fillStyle(0x3a3e6a, 1);
    g.fillRect(hx, 110, 96, 40);
    g.fillStyle(0x4a5080, 1);
    g.fillRect(hx, 110, 96, 2);
    g.fillRect(hx, 110, 2, 40);
    g.fillStyle(0x24264a, 1);
    g.fillRect(hx + 94, 110, 2, 40);
    g.fillStyle(0x22243e, 1);
    for (let i = 0; i < 6; i++) g.fillRect(hx - 4 + i * 2, 104 + i, 104 - i * 4, 1);
    g.fillRect(hx + 2, 104, 100, 6);
    for (const cxp of [hx + 12, hx + 78]) {
      g.fillStyle(0x4a3a50, 1);
      g.fillRect(cxp, 94, 8, 12);
      g.fillStyle(0x5e4a64, 1);
      g.fillRect(cxp, 94, 8, 2);
      // chimney smoke
      for (let k = 0; k < 4; k++) {
        const p = (this.t * 0.4 + k * 12) % 48;
        g.fillStyle(0xc0b0d0, 0.35 * (1 - p / 48));
        g.fillCircle(cxp + 4 + Math.sin((this.t + k * 20) / 20) * 3 + p * 0.2, 92 - p, 2 + p / 12);
      }
    }
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 2; j++) {
        const lit = (i * 3 + j * 5 + Math.floor(this.t / 80)) % 7 !== 0;
        const wx = hx + 8 + i * 14;
        const wy = 116 + j * 15;
        if (lit) {
          g.fillStyle(0xffd070, 0.25);
          g.fillRect(wx - 2, wy - 2, 9, 11);
        }
        g.fillStyle(lit ? 0xffe090 : 0x1c1e38, 1);
        g.fillRect(wx, wy, 5, 7);
        g.fillStyle(lit ? 0xf0a040 : 0x14162a, 1);
        g.fillRect(wx, wy + 4, 5, 3);
        g.fillStyle(0x24264a, 1);
        g.fillRect(wx + 2, wy, 1, 7);
      }
    }
    g.fillStyle(0x24264a, 1);
    g.fillRect(hx + 42, 130, 12, 20);
    g.fillStyle(0xffd070, 1);
    g.fillRect(hx + 44, 132, 8, 18);
    // lawn with a lighter rim and grass tufts
    for (let y = 150; y < 192; y += 2) {
      g.fillStyle(mix(0x3aa858, 0x1a5a34, (y - 150) / 42), 1);
      g.fillRect(0, y, W, 2);
    }
    g.fillStyle(lighten(0x3aa858, 0.3), 1);
    g.fillRect(0, 150, W, 1);
    g.fillStyle(0x7ad070, 1);
    for (let x = 0; x < W; x += 5) g.fillRect(x + ((x / 5) % 2) * 2, 149, 1, 2);
  }

  update() {
    this.t++;
    if (input.takeLeft() || input.takeRight()) this.toggleMode();
    if (input.takeAbility()) return this.toggleStyle();
    if (this.save) {
      if (input.takeJump()) return this.cont();
      if (input.takeTalk()) return this.go();
    } else if (input.takeJump() || input.takeTalk()) return this.go();

    const g = this.g;
    g.clear();
    if (is16()) this.drawScene16(g);
    else {
    // stars over the fells
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % W;
      const y = (i * 53) % 90;
      g.fillStyle((this.t + i * 13) % 90 < 6 ? PAL.yellow : PAL.lgrey, 1);
      g.fillRect(x, y, 1, 1);
    }
    // the Howgill Fells
    g.fillStyle(PAL.slate, 1);
    for (let x = 0; x < W; x++) {
      const h = 18 + Math.sin(x / 30) * 8 + Math.sin(x / 11) * 3;
      g.fillRect(x, 150 - h, 1, h);
    }
    // the Hall: a little Victorian silhouette with lit windows
    const hx = 84;
    g.fillStyle(PAL.navy, 1);
    g.fillRect(hx, 112, 88, 38);
    g.fillRect(hx + 8, 104, 10, 8);
    g.fillRect(hx + 70, 104, 10, 8);
    g.fillRect(hx + 38, 128, 12, 22);
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 2; j++) {
        const lit = (i * 3 + j * 5 + Math.floor(this.t / 80)) % 7 !== 0;
        g.fillStyle(lit ? PAL.yellow : PAL.slate, 1);
        g.fillRect(hx + 6 + i * 14, 117 + j * 15, 5, 7);
      }
    }
    g.fillStyle(PAL.green, 1);
    g.fillRect(0, 150, W, 42);
    g.fillStyle(0x2c8a4a, 1);
    for (let x = 0; x < W; x += 6) g.fillRect(x + ((x / 6) % 2) * 3, 152, 1, 1);
    }

    if (is16()) {
      // chrome-and-sunset lettering
      drawTextRows(g, 'BROWNBER', W / 2, 16, [0xfff4c0, 0xffe080, 0xffc040, 0xf89830, 0xe86828, 0xc84020, 0x902818], 3, 0x200c30);
      drawTextRows(g, 'BUDDIES', W / 2, 44, [0xffffff, 0xd8ecff, 0xa8d0f8, 0x78a8f0, 0x4a80e0, 0x3058c0, 0x203890], 3, 0x200c30);
    } else {
      drawTextCentered(g, 'BROWNBER', W / 2, 18, PAL.yellow, PAL.red, 3);
      drawTextCentered(g, 'BUDDIES', W / 2, 46, PAL.white, PAL.blue, 3);
    }
    drawTextCentered(g, 'A WEEKEND AT THE HALL', W / 2, 76, PAL.lgrey);
    drawText(g, `V ${BUILD_ID.split('-')[0]}`, 2, 2, PAL.slate);

    // style switch
    g.fillStyle(PAL.ink, 0.75);
    g.fillRect(W / 2 - 74, 137, 148, 13);
    const sLabel = `${keyName('power')}: 16-BIT MODE  ${is16() ? 'ON' : 'OFF'}`;
    if (is16()) drawTextRows(g, sLabel, W / 2, 140, [0xfff4c0, 0xffe080, 0xffc040, 0xf89830, 0xe86828, 0xc84020, 0x902818]);
    else drawTextCentered(g, sLabel, W / 2, 140, PAL.lgrey);

    const m = { cosy: '< COSY: NO DEATHS >', classic: '< CLASSIC: 5 LIVES >', zombie: '< ZOMBIE NIGHT! >' }[this.mode];
    g.fillStyle(PAL.ink, 0.7);
    g.fillRect(W / 2 - 64, 160, 128, 30);
    drawTextCentered(g, m, W / 2, 163, { cosy: PAL.lime, classic: PAL.orange, zombie: 0x7cff6a }[this.mode]);
    if (this.save) {
      const name = charById(this.save.hero).name.toUpperCase();
      g.fillStyle(PAL.ink, 0.7);
      g.fillRect(W / 2 - 92, 86, 184, 22);
      drawTextCentered(g, `${keyName('jump')}: CONTINUE AS ${name}`, W / 2, 88, Math.floor(this.t / 30) % 2 ? PAL.yellow : PAL.white);
      drawTextCentered(g, `${keyName('talk')}: NEW GAME`, W / 2, 98, PAL.lgrey);
      drawTextCentered(g, 'NEW GAME', W / 2, 177, PAL.lgrey);
    } else if (Math.floor(this.t / 30) % 2) drawTextCentered(g, `PRESS ${keyName('jump')}`, W / 2, 177, PAL.white);

    // Binks zooms across
    this.bx += 2.2;
    if (this.bx > W + 40) this.bx = -60;
    const hop = Math.abs(Math.sin(this.t * 0.25)) * 10;
    this.binks
      .setTexture(Math.floor(this.t / 6) % 2 ? 'binks_a' : 'binks_b')
      .setPosition(Math.round(this.bx), Math.round(158 - hop));
  }
}

// ---------------------------------------------------------------- character select
export class SelectScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private sel = 0;
  private mode: Mode = 'cosy';
  private sprites: Phaser.GameObjects.Image[] = [];
  private portrait!: Phaser.GameObjects.Image;
  private t = 0;
  private legends: Record<string, string[]> = {};

  constructor() {
    super('select');
  }

  init(data: { mode: Mode }) {
    this.mode = data.mode ?? 'cosy';
    try {
      const last = localStorage.getItem('bb-hero');
      const i = CHARACTERS.findIndex((c) => c.id === last);
      if (i >= 0) this.sel = i;
    } catch {
      /* ignore */
    }
  }

  private cell(i: number) {
    const row = i < 7 ? 0 : 1;
    const col = row === 0 ? i : i - 7;
    const n = row === 0 ? 7 : 6;
    const spacing = 34;
    const x0 = W / 2 - ((n - 1) * spacing) / 2;
    return { x: Math.round(x0 + col * spacing), y: 52 + row * 36 };
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.ink);
    this.g = this.add.graphics();
    this.sprites = CHARACTERS.map((c, i) => {
      const { x, y } = this.cell(i);
      const s = this.add.image(x, y, `${c.id}_idle`).setOrigin(0.5, 1);
      s.setInteractive(new Phaser.Geom.Rectangle(-4, -4, 24, 32), Phaser.Geom.Rectangle.Contains);
      s.on('pointerdown', () => {
        if (this.sel === i) this.start();
        else {
          this.sel = i;
          sfx.select();
        }
      });
      return s;
    });
    this.portrait = this.add.image(10, 118, '__DEFAULT').setOrigin(0);
    this.legends = getLegends();
    input.clearLatches();
  }

  private start() {
    const c = CHARACTERS[this.sel];
    try {
      localStorage.setItem('bb-hero', c.id);
    } catch {
      /* ignore */
    }
    sfx.win();
    this.scene.start('game', { hero: c.id, mode: this.mode });
  }

  update() {
    this.t++;
    const n = CHARACTERS.length;
    if (input.takeLeft()) {
      this.sel = (this.sel + n - 1) % n;
      sfx.select();
    }
    if (input.takeRight()) {
      this.sel = (this.sel + 1) % n;
      sfx.select();
    }
    if (input.takeJump() || input.takeTalk()) return this.start();

    const c = CHARACTERS[this.sel];
    const g = this.g;
    g.clear();
    drawTextCentered(g, 'WHO ARE YOU?', W / 2, 8, PAL.yellow, PAL.red, 2);

    // highlight + animate the selected friend
    CHARACTERS.forEach((ch, i) => {
      const s = this.sprites[i];
      const { x, y } = this.cell(i);
      if (i === this.sel) {
        g.fillStyle(PAL.navy, 1);
        g.fillRect(x - 14, y - 28, 28, 32);
        g.lineStyle(1, PAL.yellow, 1);
        g.strokeRect(x - 13.5, y - 27.5, 27, 31);
        const f = Math.floor(this.t / 6) % 2 ? 'run1' : 'run2';
        s.setTexture(`${ch.id}_${f}`).setAlpha(1);
      } else {
        s.setTexture(`${ch.id}_idle`).setAlpha(ch.placeholder ? 0.5 : 0.85);
      }
      // gold star for friends who've had a 100% legend run
      if (this.legends[ch.id]?.length) {
        const sx = x + 8;
        const sy = y - 30;
        const tw = Math.floor((this.t + i * 7) / 20) % 4 === 0;
        g.fillStyle(tw ? PAL.white : PAL.yellow, 1);
        g.fillRect(sx + 2, sy, 1, 5);
        g.fillRect(sx, sy + 2, 5, 1);
        g.fillRect(sx + 1, sy + 1, 3, 3);
      }
    });

    // info panel
    g.fillStyle(PAL.slate, 1);
    g.fillRect(4, 108, W - 8, 82);
    g.fillStyle(PAL.ink, 1);
    g.fillRect(8, 112, 52, 52);
    const pk = `portrait_${c.id}`;
    if (this.textures.exists(pk)) this.portrait.setTexture(pk).setScale(1).setPosition(10, 114);
    else this.portrait.setTexture(`${c.id}_idle`).setScale(2).setPosition(18, 114);

    drawText(g, c.name, 66, 112, PAL.white, PAL.ink, 2);
    if (c.partner) drawText(g, `+ ${charById(c.partner).name}`, 66 + c.name.length * 12 + 4, 117, PAL.orange);
    if (this.legends[c.id]?.length) drawText(g, `* LEGEND: ${this.legends[c.id].join(', ').toUpperCase()}`.slice(0, 31), 66, 130, PAL.yellow);
    else drawText(g, wrap(c.blurb, 31)[0], 66, 130, PAL.lgrey);
    const ab = ABILITIES[c.ability];
    drawText(g, ab.name + (ab.active ? '' : ' (ALWAYS ON)'), 66, 143, PAL.lime);
    wrap(ab.desc, 31)
      .slice(0, 3)
      .forEach((l, i) => drawText(g, l, 66, 153 + i * 9, PAL.white));
    if (Math.floor(this.t / 30) % 2) {
      drawTextCentered(g, keyName('jump'), 34, 168, PAL.yellow);
      drawTextCentered(g, 'TO PLAY', 34, 177, PAL.yellow);
    }
  }
}

// ---------------------------------------------------------------- credits (after a 100% legend run)
// The camera starts zoomed in on centre stage. Each friend gets a firework and slides in for
// their moment, then flies off to their place in the group photo. At the end the camera zooms
// out to reveal the whole gang (and Binks) under a sky full of fireworks.

interface CastMember {
  key: string; // texture
  name: string;
  lines: string[];
  img: Phaser.GameObjects.Image;
  slot: { x: number; y: number };
  small: number; // scale in the group photo
  big: number; // scale in the spotlight
  hero?: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: number;
}

const STAGE = { x: W / 2, y: 70 };
const SPOT = 150; // frames per cast member

export class CreditsScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private bg!: Phaser.GameObjects.Graphics;
  private t = 0;
  private hero = 'beez';
  private cast: CastMember[] = [];
  private sparks: Spark[] = [];
  private extra: string[][] = [];
  private finaleAt = 0;
  private revealed = false;
  private ui!: Phaser.GameObjects.Graphics; // drawn by an unzoomed camera: curtains, bulbs
  private bow!: Phaser.GameObjects.Image;
  private uiCam!: Phaser.Cameras.Scene2D.Camera;
  private closeAt = 0;

  constructor() {
    super('credits');
  }

  init(data: { hero: string }) {
    this.hero = data.hero ?? 'beez';
    this.t = 0;
    this.cast = [];
    this.sparks = [];
    this.revealed = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.ink);
    playMusic('anthem');
    this.bg = this.add.graphics().setDepth(0);
    this.g = this.add.graphics().setDepth(3);
    this.ui = this.add.graphics().setDepth(10);
    this.bow = this.add.image(W / 2, 170, `${this.hero}_idle`).setOrigin(0.5, 1).setDepth(11).setScale(2).setVisible(false);
    // a second, unzoomed camera for the theatre itself (curtains and marquee lights)
    const uiCam = this.cameras.add(0, 0, W, 192);
    uiCam.ignore([this.bg, this.g]);
    this.cameras.main.ignore([this.ui, this.bow]);
    this.uiCam = uiCam;
    input.clearLatches();

    // the group photo: 5 x 3, with the hero in the middle
    const slots: { x: number; y: number }[] = [];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) slots.push({ x: 32 + col * 48, y: 48 + row * 50 });
    const heroSlot = slots.splice(7, 1)[0];
    const heroDef = charById(this.hero);
    const portraitOf = (id: string) => (this.textures.exists(`portrait_${id}`) ? `portrait_${id}` : `${id}_idle`);
    const add = (key: string, name: string, lines: string[], slot: { x: number; y: number }, hero = false) => {
      const isPortrait = key.startsWith('portrait');
      const img = this.add.image(-60, STAGE.y, key).setDepth(hero ? 2 : 1).setVisible(false);
      this.uiCam?.ignore(img);
      this.cast.push({
        key,
        name,
        lines,
        img,
        slot,
        small: isPortrait ? (hero ? 0.7 : 0.5) : key.startsWith('binks') ? 1.4 : 1,
        big: isPortrait ? (hero ? 1.25 : 1) : key.startsWith('binks') ? 3 : 2.2,
        hero,
      });
    };
    add(portraitOf(heroDef.id), heroDef.name, ['STARRING', 'THE LEGEND OF', 'BROWNBER HALL'], heroSlot, true);
    let k = 0;
    for (const c of CHARACTERS) {
      if (c.id === this.hero) continue;
      add(portraitOf(c.id), c.name, wrap(c.blurb, 17).slice(0, 2), slots[k++]);
    }
    add('binks_a', 'BINKS', ['THE VIZSLA', 'GOOD BOY'], slots[k++]);
    this.extra = [
      ['MUSIC', 'ORIGINAL CHIP', 'AND FM TUNES'],
      ['PLUS', '"A BAG OF CHIPS"', 'BY ZANE LITTLE'],
      ['FILMED AT', 'BROWNBER HALL', 'CUMBRIA'],
      ['NO ZOMBIES', 'WERE HARMED', '(SOME PORK PIES WERE)'],
    ];
    this.finaleAt = 180 + this.cast.length * SPOT + this.extra.length * 110;
    this.closeAt = this.finaleAt + 520;

    // start zoomed in on centre stage
    const cam = this.cameras.main;
    cam.setZoom(2);
    cam.centerOn(STAGE.x, STAGE.y + 8);
  }

  /** A pale beam from the rig above onto centre stage, and a pool of light on the boards. */
  private spotlight(a: number) {
    const bg = this.bg;
    bg.fillStyle(0xfff4c0, a);
    bg.fillTriangle(STAGE.x - 6, 20, STAGE.x + 6, 20, STAGE.x + 44, STAGE.y + 28);
    bg.fillTriangle(STAGE.x - 6, 20, STAGE.x - 44, STAGE.y + 28, STAGE.x + 44, STAGE.y + 28);
    bg.fillStyle(0xfff4c0, a * 1.4);
    bg.fillEllipse(STAGE.x, STAGE.y + 29, 92, 10);
  }

  /** Curtains, gold trim and chasing marquee bulbs, drawn by the unzoomed camera. */
  private drawTheatre(open: number) {
    const u = this.ui;
    u.clear();
    // curtains: open = 0 (closed) .. 1 (fully open)
    const half = W / 2;
    const cw = Math.round(half * (1 - open)) + 14; // a little curtain always peeks in at the sides
    for (const side of [0, 1]) {
      const x0 = side === 0 ? 0 : W - cw;
      for (let x = 0; x < cw; x++) {
        const fold = Math.sin((x + (side ? 3 : 0)) / 3.2);
        u.fillStyle(fold > 0.4 ? 0xd03040 : fold > -0.3 ? 0xa01e30 : 0x6a1020, 1);
        u.fillRect(x0 + x, 0, 1, 192);
      }
      // gold trim at the hem and the inner edge
      u.fillStyle(PAL.yellow, 1);
      u.fillRect(x0, 182, cw, 2);
      u.fillRect(side === 0 ? cw - 2 : W - cw, 0, 2, 192);
      u.fillStyle(PAL.orange, 1);
      for (let x = x0 + 2; x < x0 + cw - 2; x += 6) u.fillRect(x, 184, 2, 3);
    }
    // the pelmet across the top
    u.fillStyle(0x8a1828, 1);
    u.fillRect(0, 0, W, 10);
    for (let x = 0; x < W; x += 16) {
      u.fillStyle(0xb02234, 1);
      u.fillEllipse(x + 8, 10, 16, 8);
    }
    u.fillStyle(PAL.yellow, 1);
    u.fillRect(0, 9, W, 1);
    // chasing marquee bulbs round the edge
    const phase = Math.floor(this.t / 6);
    let n = 0;
    const bulb = (x: number, y: number) => {
      const on = (n + phase) % 3 === 0;
      u.fillStyle(on ? 0xfff4b0 : 0x6a5020, 1);
      u.fillRect(x, y, 3, 3);
      if (on) {
        u.fillStyle(0xffe070, 0.35);
        u.fillRect(x - 1, y - 1, 5, 5);
      }
      n++;
    };
    for (let x = 4; x < W - 4; x += 10) bulb(x, 1);
    for (let y = 14; y < 186; y += 10) bulb(W - 4, y);
    for (let x = W - 8; x > 2; x -= 10) bulb(x, 188);
    for (let y = 182; y > 12; y -= 10) bulb(1, y);
  }

  private firework(x: number, y: number, n = 28) {
    const col = [PAL.yellow, PAL.red, PAL.lime, 0x73eff7, PAL.orange, PAL.white, 0xf0a0c0][Math.floor(Math.random() * 7)];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const v = 0.6 + Math.random() * 0.9;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 50 + Math.random() * 20, color: col });
    }
    sfx.bounce();
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta, 50) / (1000 / 60);
    const prev = this.t;
    this.t += dt;
    const t = this.t;
    const crossed = (at: number) => prev < at && t >= at;
    const g = this.g;
    const bg = this.bg;
    g.clear();
    bg.clear();

    // night sky
    for (let i = 0; i < 70; i++) {
      bg.fillStyle((Math.floor(t) + i * 13) % 90 < 6 ? PAL.yellow : PAL.slate, 1);
      bg.fillRect((i * 97) % W, (i * 53) % 192, 1, 1);
    }

    // the stage boards
    bg.fillStyle(0x6a4428, 1);
    bg.fillRect(0, STAGE.y + 30, W, 40);
    bg.fillStyle(0x8a5a3b, 1);
    bg.fillRect(0, STAGE.y + 30, W, 2);
    bg.fillStyle(0x4a2e1a, 1);
    for (let x = 0; x < W; x += 12) bg.fillRect(x, STAGE.y + 32, 1, 38);

    // curtains open at the start and close for the curtain call
    const opening = Phaser.Math.Clamp((t - 20) / 70, 0, 1);
    const closing = Phaser.Math.Clamp((t - this.closeAt) / 70, 0, 1);
    this.drawTheatre(this.revealed ? 1 - closing : Phaser.Math.Easing.Cubic.Out(opening));
    if (crossed(20)) sfx.slow();
    if (t >= this.closeAt + 70) {
      // THE END, and the legend takes a bow
      const u = this.ui;
      drawTextRows(u, 'THE END', W / 2, 60, [0xfff4c0, 0xffe080, 0xffc040, 0xf89830, 0xe86828, 0xc84020, 0x902818], 4, 0x3a0810);
      const since = t - this.closeAt - 70;
      this.bow.setVisible(true).setTexture(`${this.hero}_idle`);
      this.bow.setAngle(since > 30 && since < 90 ? 28 * Math.sin(((since - 30) / 60) * Math.PI) : 0);
      if (crossed(this.closeAt + 100)) sfx.win();
      if (since > 60) drawTextCentered(u, `${keyName('jump')} FOR THE TITLE`, W / 2, 174, Math.floor(t / 30) % 2 ? PAL.white : PAL.yellow, 0x3a0810);
      if (Math.floor(t) % 24 === 0 && Math.floor(prev) % 24 !== 0) this.firework(20 + Math.random() * (W - 40), 20 + Math.random() * 30, 20);
    }

    // opening title
    if (t < 180) {
      drawTextCentered(g, 'BROWNBER', STAGE.x, STAGE.y - 22, PAL.yellow, PAL.red, 2);
      drawTextCentered(g, 'BUDDIES', STAGE.x, STAGE.y - 4, PAL.white, PAL.blue, 2);
      if (t > 60) drawTextCentered(g, 'THE LEGEND CREDITS', STAGE.x, STAGE.y + 18, PAL.lime, PAL.ink);
      if (crossed(40) || crossed(100) || crossed(150)) this.firework(STAGE.x + (Math.random() - 0.5) * 80, STAGE.y - 30 + Math.random() * 20);
    }

    // each cast member's moment in the spotlight
    this.cast.forEach((m, i) => {
      const t0 = 180 + i * SPOT;
      // a drumroll before each reveal...
      if (t >= t0 - 28 && t < t0 && Math.floor(t / 3) !== Math.floor(prev / 3)) sfx.crumble();
      // ...and a spotlight while they're on stage
      if (t >= t0 && t < t0 + 112) this.spotlight(0.22 + 0.04 * Math.sin(t * 0.3));
      if (crossed(t0)) this.firework(STAGE.x, STAGE.y - 26);
      if (!this.revealed) {
        const from = i % 2 ? W + 60 : -60;
        const E = Phaser.Math.Easing;
        if (t < t0 || t >= t0 + 148) m.img.setVisible(false);
        else if (t < t0 + 30) {
          const p = E.Back.Out((t - t0) / 30);
          m.img.setVisible(true).setAlpha(1).setScale(m.big).setPosition(from + (STAGE.x - from) * p, STAGE.y - 4);
        } else if (t < t0 + 112) {
          m.img.setVisible(true).setAlpha(1).setScale(m.big).setPosition(STAGE.x, STAGE.y - 4);
        } else {
          // off to the group photo, waiting in the wings until the big reveal
          const p = E.Cubic.InOut((t - t0 - 112) / 36);
          m.img
            .setVisible(true)
            .setAlpha(1 - p)
            .setScale(m.big + (m.small - m.big) * p)
            .setPosition(STAGE.x + (m.slot.x - STAGE.x) * p, STAGE.y - 4 + (m.slot.y - STAGE.y + 4) * p);
        }
      }
      if (t >= t0 + 18 && t < t0 + 112) {
        const y0 = STAGE.y + 30;
        drawTextCentered(g, m.name, STAGE.x, y0, m.hero ? PAL.yellow : PAL.white, PAL.ink, 1);
        m.lines.forEach((l, j) => drawTextCentered(g, l, STAGE.x, y0 + 10 + j * 8, m.hero ? PAL.lime : PAL.lgrey, PAL.ink));
      }
    });

    // closing credits lines
    this.extra.forEach((lines, i) => {
      const t0 = 180 + this.cast.length * SPOT + i * 110;
      if (t >= t0 && t < t0 + 100) lines.forEach((l, j) => drawTextCentered(g, l, STAGE.x, STAGE.y - 14 + j * 10, j === 0 ? PAL.yellow : PAL.white, PAL.ink));
      if (crossed(t0)) this.firework(STAGE.x + (i % 2 ? 40 : -40), STAGE.y - 30, 18);
    });

    // the big zoom-out to the group photo
    if (t >= this.finaleAt && !this.revealed) {
      this.revealed = true;
      for (const m of this.cast) m.img.setVisible(true).setAlpha(1).setPosition(m.slot.x, m.slot.y).setScale(m.small);
      sfx.win();
    }
    if (this.revealed) {
      const since = t - this.finaleAt;
      // the big zoom-out from the legend to the whole gang
      const cam = this.cameras.main;
      const hero = this.cast[0].slot;
      const p = Phaser.Math.Easing.Sine.InOut(Phaser.Math.Clamp(since / 156, 0, 1));
      const zoom = 2.4 + (1 - 2.4) * p;
      cam.setZoom(zoom);
      const k = (zoom - 1) / 1.4;
      cam.centerOn(W / 2 + (hero.x - W / 2) * k, 96 + (hero.y - 96) * k);
      // names under everyone, a gold frame for the legend
      for (const m of this.cast) {
        drawTextCentered(g, m.name, m.slot.x, m.slot.y + (m.hero ? 20 : 15), m.hero ? PAL.yellow : PAL.white, PAL.ink);
      }
      const h = this.cast[0];
      const half = (48 * h.small) / 2 + 2;
      g.lineStyle(1, Math.floor(t / 8) % 2 ? PAL.yellow : PAL.orange, 1);
      g.strokeRect(h.slot.x - half - 0.5, h.slot.y - half - 0.5, half * 2 + 1, half * 2 + 1);
      if (since > 150) drawTextCentered(g, 'THANKS FOR PLAYING!', W / 2, 16, PAL.lime, PAL.ink);
      if (Math.floor(t) % 20 === 0 && Math.floor(prev) % 20 !== 0) this.firework(20 + Math.random() * (W - 40), 10 + Math.random() * 30, 22);
    }

    // fireworks
    for (const sp of this.sparks) {
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 0.025 * dt;
      sp.vx *= 0.99;
      sp.life -= dt;
      const layer = t >= this.closeAt + 40 ? this.ui : bg;
      layer.fillStyle(sp.color, Math.min(1, sp.life / 20));
      layer.fillRect(Math.round(sp.x), Math.round(sp.y), 1, 1);
    }
    this.sparks = this.sparks.filter((sp) => sp.life > 0);

    if (t > 90 && (input.takeJump() || input.takeTalk())) {
      this.cameras.main.setZoom(1);
      return this.scene.start('title');
    }
    if (t > this.closeAt + 1800) this.scene.start('title');
  }
}
