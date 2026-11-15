import Phaser from './phaser';
import { PAL } from './palette';
import { CHARACTERS, charById } from './characters';
import { ABILITIES } from './abilities';
import { bakeAll } from './sprites';
import { drawText, drawTextCentered, wrap } from './font';
import { input } from './input';
import { sfx } from './sound';
import { playMusic } from './music';
import { loadSave, type SaveData } from './save';

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
export class TitleScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics;
  private binks!: Phaser.GameObjects.Image;
  private mode: 'cosy' | 'classic' = 'cosy';
  private t = 0;
  private bx = -20;

  constructor() {
    super('title');
  }

  create() {
    try {
      this.mode = (localStorage.getItem('bb-mode') as 'cosy' | 'classic') || 'cosy';
    } catch {
      /* ignore */
    }
    this.cameras.main.setBackgroundColor(PAL.ink);
    playMusic('title');
    this.g = this.add.graphics();
    this.binks = this.add.image(-20, 150, 'binks_a').setOrigin(0, 1);
    input.clearLatches();
    this.save = loadSave();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.save && p.y < 120) return this.cont();
      if (p.y > 120 && p.y < 140) {
        this.toggleMode();
      } else {
        this.go();
      }
    });
  }

  private toggleMode() {
    this.mode = this.mode === 'cosy' ? 'classic' : 'cosy';
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

  update() {
    this.t++;
    if (input.takeLeft() || input.takeRight()) this.toggleMode();
    if (this.save) {
      if (input.takeJump()) return this.cont();
      if (input.takeTalk()) return this.go();
    } else if (input.takeJump() || input.takeTalk()) return this.go();

    const g = this.g;
    g.clear();
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

    drawTextCentered(g, 'BROWNBER', W / 2, 18, PAL.yellow, PAL.red, 3);
    drawTextCentered(g, 'BUDDIES', W / 2, 46, PAL.white, PAL.blue, 3);
    drawTextCentered(g, 'A WEEKEND AT THE HALL', W / 2, 76, PAL.lgrey);

    const m = this.mode === 'cosy' ? '< COSY: NO DEATHS >' : '< CLASSIC: 5 LIVES >';
    g.fillStyle(PAL.ink, 0.7);
    g.fillRect(W / 2 - 64, 160, 128, 30);
    drawTextCentered(g, m, W / 2, 163, this.mode === 'cosy' ? PAL.lime : PAL.orange);
    if (this.save) {
      const name = charById(this.save.hero).name.toUpperCase();
      g.fillStyle(PAL.ink, 0.7);
      g.fillRect(W / 2 - 92, 86, 184, 22);
      drawTextCentered(g, `JUMP: CONTINUE AS ${name}`, W / 2, 88, Math.floor(this.t / 30) % 2 ? PAL.yellow : PAL.white);
      drawTextCentered(g, 'TALK: NEW GAME', W / 2, 98, PAL.lgrey);
      drawTextCentered(g, 'NEW GAME', W / 2, 177, PAL.lgrey);
    } else if (Math.floor(this.t / 30) % 2) drawTextCentered(g, 'PRESS JUMP', W / 2, 177, PAL.white);

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
  private mode: 'cosy' | 'classic' = 'cosy';
  private sprites: Phaser.GameObjects.Image[] = [];
  private portrait!: Phaser.GameObjects.Image;
  private t = 0;

  constructor() {
    super('select');
  }

  init(data: { mode: 'cosy' | 'classic' }) {
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
    drawText(g, wrap(c.blurb, 31)[0], 66, 130, PAL.lgrey);
    const ab = ABILITIES[c.ability];
    drawText(g, ab.name + (ab.active ? '' : ' (ALWAYS ON)'), 66, 143, PAL.lime);
    wrap(ab.desc, 31)
      .slice(0, 3)
      .forEach((l, i) => drawText(g, l, 66, 153 + i * 9, PAL.white));
    if (Math.floor(this.t / 30) % 2) {
      drawText(g, 'JUMP', 20, 168, PAL.yellow);
      drawText(g, 'TO PLAY', 11, 177, PAL.yellow);
    }
  }
}
