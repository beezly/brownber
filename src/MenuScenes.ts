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

const W = 256;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }
  preload() {
    for (const c of CHARACTERS) if (c.portrait) this.load.image(`portrait_${c.id}`, `portraits/${c.portrait}.png`);
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
export class CreditsScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private scroll = 0;
  private t = 0;
  private hero = 'beez';
  private rows: { y: number; draw: (g: Phaser.GameObjects.Graphics, y: number) => void; img?: Phaser.GameObjects.Image; ix?: number }[] = [];

  constructor() {
    super('credits');
  }

  init(data: { hero: string }) {
    this.hero = data.hero ?? 'beez';
    this.scroll = 0;
    this.t = 0;
    this.rows = [];
  }

  create() {
    this.cameras.main.setBackgroundColor(PAL.ink);
    this.g = this.add.graphics().setDepth(2);
    input.clearLatches();
    let y = 200;
    const text = (str: string, color: number, scale = 1, gap = 12) => {
      const yy = y;
      this.rows.push({ y: yy, draw: (g, sy) => drawTextCentered(g, str, W / 2, sy, color, PAL.ink, scale) });
      y += gap;
    };
    const heroName = charById(this.hero).name.toUpperCase();
    text('BROWNBER BUDDIES', PAL.yellow, 2, 24);
    text('A WEEKEND AT THE HALL', PAL.lgrey, 1, 28);
    text(`STARRING ${heroName}`, PAL.lime, 1, 10);
    text('AS THE LEGEND OF BROWNBER HALL', PAL.lime, 1, 30);
    text('WITH', PAL.white, 1, 18);
    for (const c of CHARACTERS) {
      if (c.id === this.hero) continue;
      const yy = y;
      const key = this.textures.exists(`portrait_${c.id}`) ? `portrait_${c.id}` : `${c.id}_idle`;
      const img = this.add.image(0, 0, key).setOrigin(0).setDepth(1).setScale(key.startsWith('portrait') ? 0.75 : 1.5);
      this.rows.push({
        y: yy,
        img,
        ix: 40,
        draw: (g, sy) => {
          drawText(g, c.name, 86, sy + 8, PAL.yellow, PAL.ink, 2);
          wrap(c.blurb, 28).slice(0, 2).forEach((l, k) => drawText(g, l, 86, sy + 26 + k * 9, PAL.lgrey));
        },
      });
      y += 46;
    }
    const binks = this.add.image(0, 0, 'binks_a').setOrigin(0).setDepth(1).setScale(2);
    this.rows.push({ y, img: binks, ix: 48, draw: (g, sy) => drawText(g, 'AND BINKS, THE VIZSLA', 86, sy + 8, PAL.orange, PAL.ink) });
    y += 44;
    text('MUSIC', PAL.yellow, 1, 12);
    text('ORIGINAL CHIP AND FM TUNES', PAL.white, 1, 10);
    text('+ "A BAG OF CHIPS" BY ZANE LITTLE (CC0)', PAL.white, 1, 26);
    text('FILMED ON LOCATION AT', PAL.yellow, 1, 12);
    text('BROWNBER HALL, CUMBRIA', PAL.white, 1, 30);
    text('NO ZOMBIES WERE HARMED.', PAL.lgrey, 1, 10);
    text('SEVERAL PORK PIES WERE.', PAL.lgrey, 1, 40);
    text('THANKS FOR PLAYING!', PAL.lime, 2, 30);
    this.end = y + 40;
  }

  private end = 0;

  update() {
    this.t++;
    this.scroll += 0.45;
    const g = this.g;
    g.clear();
    // twinkling stars behind
    for (let i = 0; i < 40; i++) {
      g.fillStyle((this.t + i * 13) % 90 < 6 ? PAL.yellow : PAL.slate, 1);
      g.fillRect((i * 97) % W, (i * 53 + Math.floor(this.scroll * 0.2)) % 192, 1, 1);
    }
    for (const r of this.rows) {
      const sy = Math.round(r.y - this.scroll);
      const on = sy > -60 && sy < 200;
      if (r.img) r.img.setVisible(on).setPosition(r.ix ?? 40, sy);
      if (on) r.draw(g, sy);
    }
    if (this.t > 60 && (input.takeJump() || input.takeTalk())) return this.scene.start('title');
    if (this.scroll > this.end) this.scene.start('title');
  }
}
