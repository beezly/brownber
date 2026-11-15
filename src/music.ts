// Music: two kinds of track.
//  - Chip tunes (TRACKS): original, played live by a tiny Web Audio sequencer
//    (square-wave lead, triangle bass, noise hi-hat). Written for this game.
//  - Recorded CC0 tracks (FILES): mp3s in public/music, streamed and looped.
// playMusic(name) picks whichever kind `name` refers to.
//  - 16-bit mode (settings.is16()): the same names play FM-synth arrangements instead
//    (see TRACKS16 below): house/title are fuller arrangements of the same melodies, and the
//    recorded tracks map to FM tunes (teaparty/fells -> night, victory -> fanfare, stairs ->
//    a faster house variant). Switching style restarts the current tune in the new style.

import { fmHat, fmKick, fmNote, fmSnare, fmTom, getAudio, isMuted, PATCH } from './sound';
import { is16, onStyleChange } from './settings';

interface Track {
  bpm: number;
  lead: string; // eighth notes, space separated: C5, F#4, '-' = hold, '.' = rest
  bass: string;
  drums: string; // x = hat, o = kick-ish thump, . = rest (eighths)
}

const TRACKS: Record<string, Track> = {
  house: {
    bpm: 132,
    lead:
      'C5 E5 G5 E5 F5 A5 G5 - ' +
      'E5 G5 C6 B5 A5 G5 E5 - ' +
      'F5 E5 D5 E5 F5 G5 A5 F5 ' +
      'G5 - E5 - D5 - C5 - ' +
      'C5 E5 G5 E5 F5 A5 G5 - ' +
      'E5 G5 C6 B5 A5 G5 A5 B5 ' +
      'C6 B5 A5 G5 F5 E5 D5 E5 ' +
      'C5 - G4 - C5 - . .',
    bass:
      'C3 C4 C3 C4 C3 C4 C3 C4 ' +
      'A2 A3 A2 A3 A2 A3 A2 A3 ' +
      'F2 F3 F2 F3 F2 F3 F2 F3 ' +
      'G2 G3 G2 G3 G2 G3 B2 G2 ' +
      'C3 C4 C3 C4 C3 C4 C3 C4 ' +
      'A2 A3 A2 A3 A2 A3 A2 A3 ' +
      'F2 F3 F2 F3 G2 G3 G2 G3 ' +
      'C3 C4 G2 G3 C3 - . .',
    drums: 'o.x.o.x.'.repeat(8),
  },
  title: {
    bpm: 100,
    lead:
      'E5 - G5 - C6 - B5 - ' +
      'A5 - G5 - E5 - - - ' +
      'F5 - A5 - G5 - E5 - ' +
      'D5 - - - . - - - ',
    bass:
      'C3 - G3 - C3 - G3 - ' +
      'A2 - E3 - A2 - E3 - ' +
      'F2 - C3 - F2 - C3 - ' +
      'G2 - D3 - G2 - B2 - ',
    drums: 'o...x...'.repeat(4),
  },
};


// ---------------------------------------------------------------------------
// 16-bit FM arrangements. Lead/bass are eighth-note strings like above; drums are
// sixteenth-note patterns (any multiple of 16 chars, indexed by step) per instrument.
// ---------------------------------------------------------------------------
interface Drums16 {
  k: string; // kick
  s: string; // snare
  h: string; // closed hat
  o?: string; // open hat
}
interface Track16 {
  bpm: number;
  lead: string;
  bass: string;
  chords?: string; // one chord symbol per bar; derived from the bassline when absent
  leadVoice: string;
  drums: Drums16;
  stab?: string; // sixteenth pattern for chord stabs ('x')
  arp?: { pat: string; voice: string; oct: number; vel: number };
  pad?: boolean;
  fill?: boolean; // tom fill on the last beat of the loop
  swing?: number; // 0..1 delay of off-sixteenths
  echo?: number; // lead delay send
}

const HOUSE_LEAD = TRACKS.house.lead;
const HOUSE_BASS = TRACKS.house.bass;

const TRACKS16: Record<string, Track16> = {
  // same melody + bassline as the chip 'house'
  house: {
    bpm: 132,
    lead: HOUSE_LEAD,
    bass: HOUSE_BASS,
    leadVoice: 'lead',
    drums: { k: 'k.....k.k.....k.', s: '....s.......s...', h: 'h.h.h.h.h.h.h.hh', o: '..............o.' },
    stab: '..x...x...x...x.',
    pad: true,
    fill: true,
    echo: 0.2,
  },
  // same melody + bassline as the chip 'title'
  title: {
    bpm: 100,
    lead: TRACKS.title.lead,
    bass: TRACKS.title.bass,
    leadVoice: 'lead',
    drums: { k: 'k.......k.k.....', s: '....s.......s...', h: 'h.h.h.h.h.h.h.h.' },
    arp: { pat: 'x.x.x.x.x.x.x.x.', voice: 'pluck', oct: 4, vel: 0.5 },
    pad: true,
    echo: 0.26,
  },
  // faster, driving variant of 'house' (for the stairs)
  stairs: {
    bpm: 150,
    lead: HOUSE_LEAD,
    bass: HOUSE_BASS,
    leadVoice: 'brass',
    drums: { k: 'k...k...k...k...', s: '....s.......s..s', h: 'hhhhhhhhhhhhhhhh', o: '..o...o...o...o.' },
    arp: { pat: '.x.x.x.x.x.x.x.x', voice: 'pluck', oct: 4, vel: 0.45 },
    pad: true,
    fill: true,
    echo: 0.16,
  },
  // new: mellow evening groove (A minor / C major), 8 bars
  night: {
    bpm: 88,
    lead:
      'E5 - - D5 C5 - A4 - ' +
      'C5 - D5 - E5 - - - ' +
      'G5 - E5 - D5 C5 E5 - ' +
      'D5 - - - B4 - D5 - ' +
      'A5 - G5 - E5 - C5 D5 ' +
      'E5 - - C5 A4 - C5 - ' +
      'D5 - F5 - A5 - G5 F5 ' +
      'B4 - D5 - F5 - E5 - ',
    bass:
      'A2 - . A3 A2 - . E3 ' +
      'F2 - . F3 F2 - . C3 ' +
      'C3 - . C4 C3 - . G2 ' +
      'G2 - . G3 G2 - . D3 ' +
      'A2 - . A3 A2 - . E3 ' +
      'F2 - . F3 F2 - . C3 ' +
      'D3 - . D4 D3 - . A2 ' +
      'G2 - . G3 G2 - B2 D3 ',
    chords: 'Am7 Fmaj7 C G Am7 Fmaj7 Dm7 G7',
    leadVoice: 'ep',
    drums: { k: 'k.......k.k.....', s: '........s.......', h: 'h.h.h.h.h.h.h.h.' },
    arp: { pat: '.x.....x..x.....', voice: 'bell', oct: 5, vel: 0.9 },
    pad: true,
    swing: 0.3,
    echo: 0.3,
  },
  // new: upbeat victory loop (C major), 8 bars
  fanfare: {
    bpm: 144,
    lead:
      'G5 - G5 E5 G5 - C6 - ' +
      'A5 - A5 F5 A5 - C6 - ' +
      'B5 - B5 G5 B5 - D6 - ' +
      'E6 - D6 - C6 - - - ' +
      'E5 A5 C6 A5 E6 - D6 C6 ' +
      'F5 A5 C6 A5 F6 - E6 D6 ' +
      'D6 - B5 - G5 B5 D6 G6 ' +
      'E6 - C6 - G5 - . . ',
    bass:
      'C3 C4 C3 C4 C3 C4 C3 G2 ' +
      'F2 F3 F2 F3 F2 F3 F2 C3 ' +
      'G2 G3 G2 G3 G2 G3 G2 D3 ' +
      'C3 C4 C3 C4 E3 G3 C4 G3 ' +
      'A2 A3 A2 A3 A2 A3 A2 E3 ' +
      'F2 F3 F2 F3 F2 F3 F2 C3 ' +
      'G2 G3 G2 G3 G2 G3 B2 D3 ' +
      'C3 C4 C3 C4 C3 G2 C3 . ',
    chords: 'C F G C Am F G C',
    leadVoice: 'brass',
    drums: { k: 'k...k...k...k..k', s: '....s.......s...', h: 'h.h.h.h.h.h.h.hh', o: '..o...o...o...o.' },
    stab: '..x...x...x...x.',
    arp: { pat: 'x.......x.......', voice: 'bell', oct: 6, vel: 0.6 },
    pad: true,
    fill: true,
    echo: 0.2,
  },
};

/** 16-bit mode: which FM tune stands in for each requested track. */
const MAP16: Record<string, string> = { teaparty: 'night', fells: 'night', victory: 'fanfare', stairs: 'stairs' };
/** 8-bit mode: the new FM-only names fall back to recorded tracks. */
const MAP8: Record<string, string> = { night: 'fells', fanfare: 'victory' };

const resolve = (name: string) => (is16() ? MAP16[name] ?? name : MAP8[name] ?? name);

// chord symbols -> intervals
const QUAL: Record<string, number[]> = { '': [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11] };
const DIATONIC: Record<string, string> = { C: '', D: 'm', E: 'm', F: '', G: '', A: 'm', B: 'dim' };
interface Chord {
  pc: number;
  iv: number[];
}
function parseChord(sym: string): Chord {
  const m = /^([A-G]#?)(m7|maj7|dim|m|7|)$/.exec(sym);
  if (!m) return { pc: 0, iv: QUAL[''] };
  return { pc: NOTE[m[1]], iv: QUAL[m[2]] };
}
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function deriveChords(bass: string[]): string[] {
  const out: string[] = [];
  for (let b = 0; b * 8 < bass.length; b++) {
    const root = bass.slice(b * 8, b * 8 + 8).find((x) => x !== '-' && x !== '.');
    const letter = root ? root.replace(/\d/, '') : 'C';
    out.push(letter + (DIATONIC[letter] ?? ''));
  }
  return out;
}

// CC0 tracks from "A Bag of Chips" by Zane Little (opengameart.org/node/153320).
// No attribution required, but we credit him anyway in CREDITS.md.
const FILES: Record<string, { src: string; loop: boolean; volume: number }> = {
  stairs: { src: 'music/stairs.mp3', loop: true, volume: 0.45 }, // "Stumble Around"
  victory: { src: 'music/victory.mp3', loop: false, volume: 0.5 }, // "100 Victories"
  teaparty: { src: 'music/teaparty.mp3', loop: true, volume: 0.45 }, // "Post-Adventure Tea Party" (for the grounds, later)
  fells: { src: 'music/fells.mp3', loop: true, volume: 0.45 }, // "The World Is Ours" (for the fells, later)
};

let audioEl: HTMLAudioElement | null = null;

const NOTE: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const freq = (n: string) => {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 0;
  const midi = NOTE[m[1]] + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
};

let current: string | null = null;
let timer: number | null = null;
let step = 0;
let nextTime = 0;
let master: GainNode | null = null;
let fmNodes: AudioNode[] = [];

export function playMusic(name: string) {
  if (current === name && (timer !== null || audioEl)) return;
  stopMusic();
  current = name;
  start();
}

export function stopMusic() {
  if (audioEl) {
    audioEl.pause();
    audioEl = null;
  }
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  if (master) {
    master.disconnect();
    master = null;
  }
  // tear down the FM bus (incl. the echo feedback loop) so nothing lingers
  for (const n of fmNodes) n.disconnect();
  fmNodes = [];
}

// restart whatever is playing in the new style when the player toggles 8-bit / 16-bit
onStyleChange(() => {
  if (!current) return;
  const keep = current;
  stopMusic();
  current = keep;
  if (!isMuted()) start();
});

/** Call after mute toggles or the audio context unlocks. */
export function refreshMusic() {
  if (isMuted()) {
    const keep = current;
    stopMusic();
    current = keep;
  } else if (current && timer === null && !audioEl) start();
  else if (audioEl && audioEl.paused) void audioEl.play().catch(() => {});
}

function start() {
  if (!current || isMuted()) return;
  const name = resolve(current);
  if (is16() && TRACKS16[name]) {
    const c = getAudio();
    if (c) startFM(c, TRACKS16[name]);
    return;
  }
  const file = FILES[name];
  if (file) {
    audioEl = new Audio(file.src);
    audioEl.loop = file.loop;
    audioEl.volume = file.volume;
    // fails silently until the first tap/key press; refreshMusic() retries then
    void audioEl.play().catch(() => {});
    return;
  }
  const ctx = getAudio();
  if (!ctx) return;
  const t = TRACKS[name];
  if (!t) return;
  const lead = t.lead.trim().split(/\s+/);
  const bass = t.bass.trim().split(/\s+/);
  const drums = t.drums.split('');
  const len = Math.max(lead.length, bass.length);
  const eighth = 60 / t.bpm / 2;
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  step = 0;
  nextTime = ctx.currentTime + 0.05;

  const holdLen = (arr: string[], i: number) => {
    let n = 1;
    while (arr[(i + n) % len] === '-' && n < len) n++;
    return n;
  };

  timer = window.setInterval(() => {
    if (!master) return;
    while (nextTime < ctx.currentTime + 0.25) {
      const i = step % len;
      const ln = lead[i];
      if (ln && ln !== '-' && ln !== '.') note(ctx, master, 'square', freq(ln), nextTime, eighth * holdLen(lead, i) * 0.9, 0.05);
      const bn = bass[i];
      if (bn && bn !== '-' && bn !== '.') note(ctx, master, 'triangle', freq(bn), nextTime, eighth * holdLen(bass, i) * 0.85, 0.12);
      const d = drums[i % drums.length];
      if (d === 'x') hat(ctx, master, nextTime, 0.02);
      if (d === 'o') thump(ctx, master, nextTime);
      nextTime += eighth;
      step++;
    }
  }, 50);
}

function note(ctx: AudioContext, out: AudioNode, type: OscillatorType, f: number, t: number, dur: number, vol: number) {
  if (!f) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

let noiseBuf: AudioBuffer | null = null;
function hat(ctx: AudioContext, out: AudioNode, t: number, vol: number) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}

function thump(ctx: AudioContext, out: AudioNode, t: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.14);
}

// ---------------------------------------------------------------------------
// FM sequencer: same lookahead idea as above, but ticking in sixteenths.
// ---------------------------------------------------------------------------
function startFM(ctx: AudioContext, t: Track16) {
  const nodes: AudioNode[] = [];
  const m = ctx.createGain();
  m.gain.value = 0.55;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 3;
  comp.attack.value = 0.01;
  comp.release.value = 0.2;
  m.connect(comp);
  comp.connect(ctx.destination);
  nodes.push(m, comp);
  master = m;

  // tasteful echo: dotted-eighth feedback delay, darkened each repeat, returned slightly right
  const sx = 60 / t.bpm / 4;
  const dIn = ctx.createGain();
  const dly = ctx.createDelay(1);
  dly.delayTime.value = sx * 3;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3200;
  const fb = ctx.createGain();
  fb.gain.value = 0.3;
  const wetPan = ctx.createStereoPanner();
  wetPan.pan.value = 0.4;
  dIn.connect(dly);
  dly.connect(lp);
  lp.connect(fb);
  fb.connect(dly);
  lp.connect(wetPan);
  wetPan.connect(m);
  nodes.push(dIn, dly, lp, fb, wetPan);

  const chan = (pan: number, send = 0): AudioNode => {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(m);
    nodes.push(p);
    if (send > 0) {
      const g = ctx.createGain();
      g.gain.value = send;
      p.connect(g);
      g.connect(dIn);
      nodes.push(g);
    }
    return p;
  };
  const cLead = chan(-0.25, t.echo ?? 0.2);
  const cBass = chan(0);
  const cPad = chan(0, 0.08);
  const cStab = chan(0.3, 0.08);
  const cArp = chan(0.35, 0.2);
  const cKick = chan(0);
  const cSnare = chan(-0.1, 0.05);
  const cHat = chan(0.3);
  const cTom = chan(-0.3);
  fmNodes = nodes;

  const lead = t.lead.trim().split(/\s+/);
  const bass = t.bass.trim().split(/\s+/);
  const len8 = Math.max(lead.length, bass.length);
  const len16 = len8 * 2;
  const bars = len8 / 8;
  const chords = (t.chords ? t.chords.trim().split(/\s+/) : deriveChords(bass)).map(parseChord);
  const hold = (arr: string[], i: number) => {
    let n = 1;
    while (arr[i + n] === '-' && i + n < arr.length) n++;
    return n;
  };
  const on = (pat: string | undefined, s: number, c = 'x') => !!pat && pat[s % pat.length] === c;
  let arpI = 0;

  const tick = (s: number, tm: number) => {
    const p = s % 16;
    const bar = Math.floor(s / 16);
    const ch = chords[bar % chords.length];
    if (!(s & 1)) {
      const e = s >> 1;
      const ln = lead[e];
      if (ln && ln !== '-' && ln !== '.') fmNote(ctx, cLead, PATCH[t.leadVoice], freq(ln), tm, sx * 2 * hold(lead, e) * 0.92);
      const bn = bass[e];
      if (bn && bn !== '-' && bn !== '.') fmNote(ctx, cBass, PATCH.bass, freq(bn), tm, Math.min(sx * 2 * hold(bass, e), sx * 5) * 0.9);
    }
    const d = t.drums;
    const fill = t.fill && bar === bars - 1 && p >= 12;
    if (on(d.k, s, 'k')) fmKick(ctx, cKick, tm);
    if (fill) fmTom(ctx, cTom, tm, [230, 190, 150, 115][p - 12], 0.85);
    else if (on(d.s, s, 's')) fmSnare(ctx, cSnare, tm);
    if (on(d.h, s, 'h')) fmHat(ctx, cHat, tm, p % 4 === 0 ? 1 : 0.65);
    if (on(d.o, s, 'o') && !fill) fmHat(ctx, cHat, tm, 0.9, true);
    const base = ch.pc > 6 ? 48 : 60;
    if (on(t.stab, s)) for (const iv of ch.iv) fmNote(ctx, cStab, PATCH.stab, mtof(base + ch.pc + iv), tm, sx * 1.6);
    if (t.pad && p === 0) for (const iv of ch.iv) fmNote(ctx, cPad, PATCH.pad, mtof(base + ch.pc + iv), tm, sx * 15);
    if (t.arp) {
      if (p === 0) arpI = 0;
      if (on(t.arp.pat, s)) {
        const b0 = 12 * (t.arp.oct + 1) + ch.pc;
        const ext = ch.iv.map((i) => b0 + i).concat(b0 + 12);
        const seq = ext.concat(ext.slice(1, -1).reverse());
        fmNote(ctx, cArp, PATCH[t.arp.voice], mtof(seq[arpI++ % seq.length]), tm, sx * 2.5, t.arp.vel);
      }
    }
  };

  step = 0;
  nextTime = ctx.currentTime + 0.06;
  timer = window.setInterval(() => {
    if (!master) return;
    // if the tab was throttled and we fell far behind, skip ahead instead of dumping a burst of notes
    if (nextTime < ctx.currentTime - 0.05) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.25) {
      const s = step % len16;
      tick(s, nextTime + (s & 1 ? (t.swing ?? 0) * sx * 0.33 : 0));
      nextTime += sx;
      step++;
    }
  }, 50);
}
