// Unified input: keyboard + on-screen touch buttons.
// "Pressed" flags latch until a game step consumes them, so a quick tap is never lost
// between fixed-timestep updates.

class Input {
  left = false;
  right = false;
  jumpHeld = false;
  private keyLeft = false;
  private keyRight = false;
  private touchLeft = false;
  private touchRight = false;
  private jumpLatch = false;
  private talkLatch = false;
  private abilityLatch = false;
  private mapLatch = false;
  private leftLatch = false;
  private rightLatch = false;
  onFirstInteraction: (() => void) | null = null;

  takeJump() {
    const v = this.jumpLatch;
    this.jumpLatch = false;
    return v;
  }
  takeTalk() {
    const v = this.talkLatch;
    this.talkLatch = false;
    return v;
  }
  takeAbility() {
    const v = this.abilityLatch;
    this.abilityLatch = false;
    return v;
  }
  takeMap() {
    const v = this.mapLatch;
    this.mapLatch = false;
    return v;
  }
  pressMap() {
    this.mapLatch = true;
    this.interacted();
  }
  takeLeft() {
    const v = this.leftLatch;
    this.leftLatch = false;
    return v;
  }
  takeRight() {
    const v = this.rightLatch;
    this.rightLatch = false;
    return v;
  }
  clearLatches() {
    this.jumpLatch = this.talkLatch = this.leftLatch = this.rightLatch = this.abilityLatch = this.mapLatch = false;
  }

  private sync() {
    const l = this.keyLeft || this.touchLeft;
    const r = this.keyRight || this.touchRight;
    if (l && !this.left) this.leftLatch = true;
    if (r && !this.right) this.rightLatch = true;
    this.left = l;
    this.right = r;
  }

  private interacted() {
    if (this.onFirstInteraction) {
      this.onFirstInteraction();
      this.onFirstInteraction = null;
    }
  }

  pressJump() {
    if (!this.jumpHeld) this.jumpLatch = true;
    this.jumpHeld = true;
    this.interacted();
  }
  releaseJump() {
    this.jumpHeld = false;
  }
  pressTalk() {
    this.talkLatch = true;
    this.interacted();
  }
  pressAbility() {
    this.abilityLatch = true;
    this.interacted();
  }

  init() {
    window.addEventListener('keydown', (e) => {
      const k = e.code;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault();
      if (k === 'ArrowLeft' || k === 'KeyA') this.keyLeft = true;
      else if (k === 'ArrowRight' || k === 'KeyD') this.keyRight = true;
      else if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
        if (!e.repeat) this.pressJump();
      } else if (k === 'KeyE' || k === 'Enter') {
        if (!e.repeat) this.pressTalk();
      } else if (k === 'KeyM' || k === 'Tab') {
        e.preventDefault();
        if (!e.repeat) this.pressMap();
      } else if (k === 'KeyX' || k === 'ShiftLeft' || k === 'ShiftRight' || k === 'KeyQ') {
        if (!e.repeat) this.pressAbility();
      }
      this.sync();
      this.interacted();
    });
    window.addEventListener('keyup', (e) => {
      const k = e.code;
      if (k === 'ArrowLeft' || k === 'KeyA') this.keyLeft = false;
      else if (k === 'ArrowRight' || k === 'KeyD') this.keyRight = false;
      else if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') this.releaseJump();
      this.sync();
    });
    window.addEventListener('blur', () => {
      this.keyLeft = this.keyRight = this.touchLeft = this.touchRight = false;
      this.jumpHeld = false;
      this.sync();
    });

    this.initTouch();
  }

  private initTouch() {
    const enableTouchUI = () => document.body.classList.add('touch');
    if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) enableTouchUI();
    window.addEventListener('touchstart', enableTouchUI, { once: true, passive: true });
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // D-pad: any finger on the pad counts; left or right half decides direction,
    // so you can slide your thumb between the two buttons.
    const pad = document.getElementById('pad')!;
    const leftBtn = pad.querySelector('[data-dir="left"]') as HTMLElement;
    const rightBtn = pad.querySelector('[data-dir="right"]') as HTMLElement;
    const padPointers = new Map<number, number>(); // pointerId -> clientX

    const updatePad = () => {
      const rect = pad.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      let l = false;
      let r = false;
      for (const x of padPointers.values()) {
        if (x < mid) l = true;
        else r = true;
      }
      this.touchLeft = l;
      this.touchRight = r;
      leftBtn.classList.toggle('on', l);
      rightBtn.classList.toggle('on', r);
      this.sync();
    };
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pad.setPointerCapture(e.pointerId);
      padPointers.set(e.pointerId, e.clientX);
      updatePad();
      this.interacted();
    });
    pad.addEventListener('pointermove', (e) => {
      if (!padPointers.has(e.pointerId)) return;
      padPointers.set(e.pointerId, e.clientX);
      updatePad();
    });
    const padUp = (e: PointerEvent) => {
      padPointers.delete(e.pointerId);
      updatePad();
    };
    pad.addEventListener('pointerup', padUp);
    pad.addEventListener('pointercancel', padUp);

    const jump = document.getElementById('btn-jump')!;
    jump.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      jump.setPointerCapture(e.pointerId);
      jump.classList.add('on');
      this.pressJump();
      if (navigator.vibrate) navigator.vibrate(8);
    });
    const jumpUp = () => {
      jump.classList.remove('on');
      this.releaseJump();
    };
    jump.addEventListener('pointerup', jumpUp);
    jump.addEventListener('pointercancel', jumpUp);

    const talk = document.getElementById('btn-talk')!;
    talk.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      talk.classList.add('on');
      this.pressTalk();
    });
    const talkUp = () => talk.classList.remove('on');
    talk.addEventListener('pointerup', talkUp);
    talk.addEventListener('pointercancel', talkUp);

    const mapBtn = document.getElementById('btn-map')!;
    mapBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.pressMap();
    });

    const power = document.getElementById('btn-power')!;
    power.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      power.classList.add('on');
      this.pressAbility();
    });
    const powerUp = () => power.classList.remove('on');
    power.addEventListener('pointerup', powerUp);
    power.addEventListener('pointercancel', powerUp);
  }
}

export const input = new Input();

/** What to call a control in on-screen prompts: button names on phones, keys on a keyboard. */
export function keyName(a: 'jump' | 'talk' | 'power' | 'map'): string {
  const touch = document.body.classList.contains('touch');
  return touch
    ? { jump: 'JUMP', talk: 'TALK', power: 'POWER', map: 'MAP' }[a]
    : { jump: 'SPACE', talk: 'E', power: 'X', map: 'M' }[a];
}
