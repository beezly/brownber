// Tiny chiptune sound effects made with the Web Audio API (no audio files needed).
// Also home to the little FM synth (YM2612-flavoured, plain Web Audio) used by the
// optional 16-bit audio mode: music.ts plays tunes with it and sfx.* switch to FM versions.

import { is16 } from './settings';

let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem('bb-muted') === '1';
} catch {
  /* storage unavailable */
}

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

export function getAudio() {
  return ctx;
}

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem('bb-muted', m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function tone(
  freqFrom: number,
  freqTo: number,
  dur: number,
  type: OscillatorType = 'square',
  vol = 0.07,
  delay = 0,
) {
  if (muted || !ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqFrom, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, freqTo), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, vol = 0.08, delay = 0, lowpass = 1200) {
  if (muted || !ctx) return;
  const t = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lowpass;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t);
}


// ---------------------------------------------------------------------------
// FM synth: modulator osc -> gain (modulation index envelope) -> carrier.frequency.
// Up to a few parallel modulators, an optional serial "chain" operator that
// modulates the first modulator (4-op style), and an optional detuned second
// carrier (unison) for pads. Every note cleans up its nodes when it ends.
// ---------------------------------------------------------------------------

export interface FMMod {
  ratio: number; // frequency ratio to the note
  index: number; // peak modulation index (deviation = index * modulator Hz)
  decay: number; // seconds for the index to fall toward `floor`
  floor?: number; // index fraction it settles on (default 0.2)
  attack?: number; // seconds to swell the index in (brass-like)
}

export interface FMPatch {
  mods: FMMod[];
  chain?: FMMod; // op4 -> mods[0]
  env: { a: number; d: number; s: number; r: number }; // carrier ADSR (seconds, sustain 0..1)
  vol: number;
  unison?: number; // detune in cents of a second carrier
  glide?: number; // seconds a pitch slide takes (default: the note length)
}

export const PATCH: Record<string, FMPatch> = {
  // bright electric-piano / brass-ish lead: tine click (ratio 14) over a bright body
  lead: {
    mods: [
      { ratio: 1, index: 2.4, decay: 0.32, floor: 0.35 },
      { ratio: 14, index: 0.55, decay: 0.05, floor: 0 },
    ],
    env: { a: 0.004, d: 0.22, s: 0.55, r: 0.1 },
    vol: 0.2,
  },
  // softer, rounder e-piano for the mellow tune
  ep: {
    mods: [
      { ratio: 1, index: 1.5, decay: 0.4, floor: 0.25 },
      { ratio: 14, index: 0.3, decay: 0.04, floor: 0 },
    ],
    env: { a: 0.006, d: 0.45, s: 0.4, r: 0.25 },
    vol: 0.22,
  },
  // brass: index swells in after the attack
  brass: {
    mods: [{ ratio: 1, index: 3.6, decay: 0.2, floor: 0.45, attack: 0.03 }],
    env: { a: 0.012, d: 0.12, s: 0.7, r: 0.08 },
    vol: 0.17,
    unison: 6,
  },
  // short chord stab
  stab: {
    mods: [{ ratio: 1, index: 3.2, decay: 0.09, floor: 0.2, attack: 0.012 }],
    env: { a: 0.006, d: 0.1, s: 0.35, r: 0.05 },
    vol: 0.08,
  },
  // punchy slap bass: sharp index spike plus a high click operator
  bass: {
    mods: [
      { ratio: 1, index: 4.6, decay: 0.07, floor: 0.15 },
      { ratio: 7, index: 1.3, decay: 0.02, floor: 0 },
    ],
    env: { a: 0.002, d: 0.2, s: 0.3, r: 0.06 },
    vol: 0.34,
  },
  // inharmonic bell/chime
  bell: {
    mods: [
      { ratio: 3.5, index: 2.8, decay: 0.55, floor: 0.04 },
      { ratio: 5.4, index: 1.1, decay: 0.18, floor: 0 },
    ],
    env: { a: 0.002, d: 1.1, s: 0, r: 0.3 },
    vol: 0.13,
  },
  // slow, soft strings/pad: detuned carrier pair, mod index swells in
  pad: {
    mods: [{ ratio: 1, index: 1.1, decay: 0.9, floor: 0.6, attack: 0.3 }],
    env: { a: 0.28, d: 0.5, s: 0.7, r: 0.5 },
    vol: 0.07,
    unison: 9,
  },
  // generic short pluck (arps, text blips)
  pluck: {
    mods: [{ ratio: 2, index: 2.4, decay: 0.08, floor: 0.1 }],
    env: { a: 0.002, d: 0.12, s: 0, r: 0.05 },
    vol: 0.16,
  },
  // sfx voices
  bwoop: {
    mods: [{ ratio: 1, index: 1.6, decay: 0.12, floor: 0.2 }],
    env: { a: 0.003, d: 0.1, s: 0.3, r: 0.08 },
    vol: 0.2,
    glide: 0.11,
  },
  boing: {
    mods: [{ ratio: 1, index: 2.6, decay: 0.25, floor: 0.3 }],
    chain: { ratio: 0.5, index: 2, decay: 0.3, floor: 0.4 },
    env: { a: 0.003, d: 0.2, s: 0.35, r: 0.1 },
    vol: 0.2,
    glide: 0.2,
  },
  woof: {
    mods: [{ ratio: 1.5, index: 4, decay: 0.1, floor: 0.2 }],
    env: { a: 0.004, d: 0.1, s: 0.3, r: 0.05 },
    vol: 0.2,
    glide: 0.1,
  },
};

const noiseBufs = new WeakMap<AudioContext, AudioBuffer>();
function noiseBuf(ctx: AudioContext) {
  let b = noiseBufs.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.2), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBufs.set(ctx, b);
  }
  return b;
}

/** One FM note from `t` for `dur` seconds (then the patch's release). f1 slides the pitch. */
export function fmNote(ctx: AudioContext, out: AudioNode, p: FMPatch, f: number, t: number, dur: number, vel = 1, f1 = f) {
  if (!(f > 0)) return;
  const { a, d, s, r } = p.env;
  const hold = Math.max(dur, a + 0.002);
  const end = t + hold + r * 1.5 + 0.02;
  const nodes: AudioNode[] = [];
  const gt = Math.min(p.glide ?? hold, hold);

  const osc = (ratio: number, detune = 0) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * ratio, t);
    if (f1 !== f) o.frequency.exponentialRampToValueAtTime(f1 * ratio, t + gt);
    if (detune) o.detune.value = detune;
    o.start(t);
    o.stop(end);
    nodes.push(o);
    return o;
  };
  // modulator -> index-envelope gain -> target param
  const op = (m: FMMod, targets: AudioParam[]) => {
    const o = osc(m.ratio);
    const g = ctx.createGain();
    const peak = m.index * f * m.ratio;
    const low = peak * (m.floor ?? 0.2);
    if (m.attack) {
      g.gain.setValueAtTime(low, t);
      g.gain.linearRampToValueAtTime(peak, t + m.attack);
      g.gain.setTargetAtTime(low, t + m.attack, m.decay / 3);
    } else {
      g.gain.setValueAtTime(peak, t);
      g.gain.setTargetAtTime(low, t, m.decay / 3);
    }
    o.connect(g);
    for (const tg of targets) g.connect(tg);
    nodes.push(g);
    return o;
  };

  const amp = ctx.createGain();
  nodes.push(amp);
  const pk = p.vol * vel * (p.unison ? 0.65 : 1);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(pk, t + a);
  amp.gain.setTargetAtTime(pk * s, t + a, d / 3);
  const lvl = pk * s + (pk - pk * s) * Math.exp(-(hold - a) / (d / 3));
  amp.gain.setValueAtTime(Math.max(lvl, 0.0001), t + hold);
  amp.gain.setTargetAtTime(0, t + hold, r / 4);
  amp.connect(out);

  const carriers = [osc(1)];
  if (p.unison) carriers.push(osc(1, p.unison));
  for (const c of carriers) c.connect(amp);
  for (const m of p.mods) op(m, carriers.map((c) => c.frequency));
  if (p.chain) {
    // chain operator modulates the first modulator's frequency (serial 4-op feel)
    const firstMod = nodes.find((n): n is OscillatorNode => n instanceof OscillatorNode && n !== carriers[0] && n !== carriers[1]);
    if (firstMod) op(p.chain, [firstMod.frequency]);
  }
  carriers[0].onended = () => {
    for (const n of nodes) n.disconnect();
  };
}

export function noiseBurst(ctx: AudioContext, out: AudioNode, t: number, dur: number, vol: number, ftype: BiquadFilterType, fq: number, q = 0.7) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf(ctx);
  const f = ctx.createBiquadFilter();
  f.type = ftype;
  f.frequency.value = fq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.setTargetAtTime(0, t, dur / 4);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur * 1.6 + 0.02);
  src.onended = () => {
    src.disconnect();
    f.disconnect();
    g.disconnect();
  };
}

function pitched(ctx: AudioContext, out: AudioNode, type: OscillatorType, t: number, f0: number, f1: number, over: number, vol: number, tc: number, life: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + over);
  g.gain.setValueAtTime(vol, t);
  g.gain.setTargetAtTime(0, t + 0.005, tc);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + life);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
}

export const fmKick = (ctx: AudioContext, out: AudioNode, t: number, vel = 1) => {
  pitched(ctx, out, 'sine', t, 165, 44, 0.1, 0.55 * vel, 0.07, 0.4);
  pitched(ctx, out, 'triangle', t, 900, 120, 0.02, 0.12 * vel, 0.006, 0.08);
};
export const fmSnare = (ctx: AudioContext, out: AudioNode, t: number, vel = 1) => {
  noiseBurst(ctx, out, t, 0.17, 0.26 * vel, 'highpass', 1400);
  pitched(ctx, out, 'triangle', t, 220, 140, 0.07, 0.22 * vel, 0.03, 0.2);
};
export const fmHat = (ctx: AudioContext, out: AudioNode, t: number, vel = 1, open = false) =>
  noiseBurst(ctx, out, t, open ? 0.22 : 0.05, (open ? 0.08 : 0.07) * vel, 'highpass', 7500);
export const fmTom = (ctx: AudioContext, out: AudioNode, t: number, f = 180, vel = 1) =>
  pitched(ctx, out, 'sine', t, f, f * 0.5, 0.18, 0.4 * vel, 0.07, 0.5);

// ---------------------------------------------------------------------------
// 16-bit sound effects
// ---------------------------------------------------------------------------

function n16(name: string, f: number, delay: number, dur: number, vel = 1, f1 = f) {
  if (muted || !ctx) return;
  fmNote(ctx, ctx.destination, PATCH[name], f, ctx.currentTime + delay, dur, vel, f1);
}

const sfx16: typeof sfx8 = {
  jump: () => n16('bwoop', 262, 0, 0.14, 1, 660),
  bounce: () => {
    n16('boing', 150, 0, 0.26, 1, 620);
    n16('bwoop', 620, 0.13, 0.12, 0.5, 900);
  },
  collect: () => {
    n16('pluck', 1319, 0, 0.05, 0.8);
    [988, 1319, 1760, 2349].forEach((f, i) => n16('bell', f, i * 0.055, 0.16, 0.7 + i * 0.08));
  },
  die: () => {
    n16('brass', 520, 0, 0.75, 1, 55);
    n16('bass', 98, 0.05, 0.4, 0.7, 40);
    if (!muted && ctx) {
      noiseBurst(ctx, ctx.destination, ctx.currentTime, 0.35, 0.09, 'lowpass', 900);
      fmKick(ctx, ctx.destination, ctx.currentTime + 0.04, 0.8);
    }
  },
  bark: () => {
    n16('woof', 330, 0, 0.1, 1, 120);
    n16('woof', 360, 0.15, 0.1, 0.85, 135);
    if (!muted && ctx) {
      noiseBurst(ctx, ctx.destination, ctx.currentTime, 0.05, 0.05, 'bandpass', 1400, 1.2);
      noiseBurst(ctx, ctx.destination, ctx.currentTime + 0.15, 0.05, 0.04, 'bandpass', 1400, 1.2);
    }
  },
  blip: (pitch = 600) => n16('pluck', pitch, 0, 0.05, 0.7),
  crumble: () => {
    if (!muted && ctx) noiseBurst(ctx, ctx.destination, ctx.currentTime, 0.06, 0.05, 'lowpass', 700);
    n16('bass', 110, 0, 0.06, 0.5, 70);
  },
  select: () => {
    n16('pluck', 587, 0, 0.06, 0.8);
    n16('pluck', 880, 0.06, 0.1, 0.8);
  },
  chord: () => {
    [196, 247, 294, 392].forEach((f) => n16('pad', f, 0, 0.55, 1.4));
    n16('bell', 784, 0, 0.3, 0.8);
    n16('bell', 1175, 0.08, 0.3, 0.5);
  },
  slow: () => {
    n16('brass', 600, 0, 0.6, 0.8, 150);
    n16('pad', 300, 0, 0.6, 1.5, 75);
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => n16('brass', f, i * 0.1, 0.14));
    [523, 659, 784, 1047].forEach((f) => n16('brass', f, 0.4, 0.5, 0.9));
    n16('bell', 1319, 0.4, 0.4, 0.8);
    n16('bell', 1568, 0.5, 0.4, 0.7);
  },
};

const cur = () => (is16() ? sfx16 : sfx8);
export const sfx: typeof sfx8 = {
  jump: () => cur().jump(),
  bounce: () => cur().bounce(),
  collect: () => cur().collect(),
  die: () => cur().die(),
  bark: () => cur().bark(),
  blip: (pitch?: number) => cur().blip(pitch),
  crumble: () => cur().crumble(),
  select: () => cur().select(),
  chord: () => cur().chord(),
  slow: () => cur().slow(),
  win: () => cur().win(),
};

const sfx8 = {
  jump: () => tone(220, 660, 0.12),
  bounce: () => tone(160, 900, 0.22, 'square', 0.08),
  collect: () => {
    tone(880, 880, 0.06, 'square', 0.06);
    tone(1320, 1320, 0.1, 'square', 0.06, 0.06);
  },
  die: () => {
    tone(600, 60, 0.5, 'sawtooth', 0.08);
    noise(0.3, 0.05);
  },
  bark: () => {
    tone(420, 180, 0.08, 'sawtooth', 0.09);
    noise(0.06, 0.06, 0, 2000);
    tone(460, 200, 0.08, 'sawtooth', 0.09, 0.14);
  },
  blip: (pitch = 600) => tone(pitch, pitch, 0.03, 'square', 0.04),
  crumble: () => noise(0.05, 0.03, 0, 600),
  select: () => tone(500, 750, 0.06, 'square', 0.05),
  chord: () => {
    [196, 247, 294, 392].forEach((f) => tone(f, f * 0.99, 0.35, 'sawtooth', 0.025));
  },
  slow: () => tone(600, 150, 0.6, 'triangle', 0.08),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.14, 'square', 0.06, i * 0.12));
  },
};
