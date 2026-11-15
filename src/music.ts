// Music: two kinds of track.
//  - Chip tunes (TRACKS): original, played live by a tiny Web Audio sequencer
//    (square-wave lead, triangle bass, noise hi-hat). Written for this game.
//  - Recorded CC0 tracks (FILES): mp3s in public/music, streamed and looped.
// playMusic(name) picks whichever kind `name` refers to.
//  - 16-bit mode (settings.is16()): the same names play FM-synth arrangements instead
//    (see TRACKS16 below): house/title are fuller arrangements of the same melodies, and the
//    recorded tracks map to FM tunes (teaparty/fells -> night, victory -> fanfare, stairs ->
//    a faster house variant). Switching style restarts the current tune in the new style.

import { fmHat, fmKick, fmNote, fmSnare, fmTom, getAudio, isMuted, noiseBurst, PATCH, windGust } from './sound';
import { is16, onStyleChange } from './settings';

interface Track {
  bpm: number;
  lead: string; // eighth notes, space separated: C5, F#4, '-' = hold, '.' = rest
  bass: string;
  drums: string; // x = hat, o = kick-ish thump, s = snare-ish noise, b = bubble blip, w = wind gust, . = rest (eighths)
  bar?: number; // eighth notes per bar (default 8; 6 = waltz)
  wave?: OscillatorType; // lead waveform (default square)
  lv?: number; // lead volume (default 0.05)
  harm?: string; // optional second square voice (same grid as lead), played quieter
  arp?: string; // optional chord-arpeggio line (same grid), short staccato squares
  // drums also: t/T/u = high/mid/low tom
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
  bar?: number; // eighth notes per bar (default 8; 6 = waltz)
  wind?: number; // wind-gust volume, one gust every other bar
  fillBars?: number[]; // extra bars (0-based) that end in a tom fill (the last bar always does when `fill` is set)
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
const MAP16: Record<string, string> = { teaparty: 'night', fells: 'quest', victory: 'fanfare', stairs: 'stairs' };
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
  const m = /^([A-G][#b]?)(m7|maj7|dim|m|7|)$/.exec(sym);
  if (!m) return { pc: 0, iv: QUAL[''] };
  return { pc: NOTE[m[1]], iv: QUAL[m[2]] };
}
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function deriveChords(bass: string[], bar = 8): string[] {
  const out: string[] = [];
  for (let b = 0; b * bar < bass.length; b++) {
    const root = bass.slice(b * bar, b * bar + bar).find((x) => x !== '-' && x !== '.');
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

const NOTE: Record<string, number> = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const freq = (n: string) => {
  const m = /^([A-G][#b]?)(\d)$/.exec(n);
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

/** Identity of what is actually sounding (style + resolved tune), so two names that
 *  resolve to the same tune (e.g. 'teaparty' and 'night' in 16-bit) continue seamlessly. */
let playingKey: string | null = null;
const keyOf = (name: string) => (is16() ? '16:' : '8:') + resolve(name);

export function playMusic(name: string) {
  if ((timer !== null || audioEl) && playingKey === keyOf(name)) {
    current = name; // same tune already sounding: carry on, don't restart
    return;
  }
  stopMusic();
  current = name;
  start();
}

export function stopMusic() {
  playingKey = null;
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
    if (c) {
      playingKey = keyOf(current);
      startFM(c, TRACKS16[name]);
    }
    return;
  }
  const file = FILES[name];
  if (file) {
    playingKey = keyOf(current);
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
  playingKey = keyOf(current);
  const lead = t.lead.trim().split(/\s+/);
  const bass = t.bass.trim().split(/\s+/);
  const harm = t.harm?.trim().split(/\s+/);
  const arp = t.arp?.trim().split(/\s+/);
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
      if (ln && ln !== '-' && ln !== '.') note(ctx, master, t.wave ?? 'square', freq(ln), nextTime, eighth * holdLen(lead, i) * 0.9, t.lv ?? 0.05);
      const bn = bass[i];
      if (bn && bn !== '-' && bn !== '.') note(ctx, master, 'triangle', freq(bn), nextTime, eighth * holdLen(bass, i) * 0.85, 0.12);
      const hn = harm?.[i];
      if (hn && hn !== '-' && hn !== '.') note(ctx, master, 'square', freq(hn), nextTime, eighth * holdLen(harm!, i) * 0.9, 0.03);
      const an = arp?.[i];
      if (an && an !== '.') note(ctx, master, 'square', freq(an), nextTime, eighth * 0.45, 0.017);
      const d = drums[i % drums.length];
      if (d === 't') tomChip(ctx, master, nextTime, 230);
      if (d === 'T') tomChip(ctx, master, nextTime, 165);
      if (d === 'u') tomChip(ctx, master, nextTime, 115);
      if (d === 'x') hat(ctx, master, nextTime, 0.02);
      if (d === 'o') thump(ctx, master, nextTime);
      if (d === 's') noiseBurst(ctx, master, nextTime, 0.08, 0.06, 'bandpass', 2200);
      if (d === 'b') note(ctx, master, 'sine', 700 + Math.random() * 500, nextTime, 0.07, 0.05, 1.8);
      if (d === 'w') windGust(ctx, master, nextTime, eighth * (t.bar ?? 8) * 1.9, 0.3);
      nextTime += eighth;
      step++;
    }
  }, 50);
}

function note(ctx: AudioContext, out: AudioNode, type: OscillatorType, f: number, t: number, dur: number, vol: number, sweep = 1) {
  if (!f) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (sweep !== 1) o.frequency.exponentialRampToValueAtTime(f * sweep, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
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

function tomChip(ctx: AudioContext, out: AudioNode, t: number, f: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 0.5, t + 0.14);
  g.gain.setValueAtTime(0.13, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.17);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
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
  const bar8 = t.bar ?? 8;
  const bl = bar8 * 2; // sixteenths per bar
  const len8 = Math.max(lead.length, bass.length);
  const len16 = len8 * 2;
  const bars = len8 / bar8;
  const chords = (t.chords ? t.chords.trim().split(/\s+/) : deriveChords(bass, bar8)).map(parseChord);
  const hold = (arr: string[], i: number) => {
    let n = 1;
    while (arr[i + n] === '-' && i + n < arr.length) n++;
    return n;
  };
  const on = (pat: string | undefined, s: number, c = 'x') => !!pat && pat[s % pat.length] === c;
  let arpI = 0;

  const tick = (s: number, tm: number) => {
    const p = s % bl;
    const bar = Math.floor(s / bl);
    const ch = chords[bar % chords.length];
    if (!(s & 1)) {
      const e = s >> 1;
      const ln = lead[e];
      if (ln && ln !== '-' && ln !== '.') fmNote(ctx, cLead, PATCH[t.leadVoice], freq(ln), tm, sx * 2 * hold(lead, e) * 0.92);
      const bn = bass[e];
      if (bn && bn !== '-' && bn !== '.') fmNote(ctx, cBass, PATCH.bass, freq(bn), tm, Math.min(sx * 2 * hold(bass, e), sx * 5) * 0.9);
    }
    const d = t.drums;
    const fill = !!t.fill && (bar === bars - 1 || !!t.fillBars?.includes(bar)) && p >= bl - 4;
    if (on(d.k, s, 'k')) fmKick(ctx, cKick, tm);
    if (fill) fmTom(ctx, cTom, tm, [230, 190, 150, 115][p - (bl - 4)], 0.85);
    else if (on(d.s, s, 's')) fmSnare(ctx, cSnare, tm);
    if (on(d.h, s, 'h')) fmHat(ctx, cHat, tm, p % 4 === 0 ? 1 : 0.65);
    if (on(d.o, s, 'o') && !fill) fmHat(ctx, cHat, tm, 0.9, true);
    const base = ch.pc > 6 ? 48 : 60;
    if (on(t.stab, s)) for (const iv of ch.iv) fmNote(ctx, cStab, PATCH.stab, mtof(base + ch.pc + iv), tm, sx * 1.6);
    if (t.pad && p === 0) for (const iv of ch.iv) fmNote(ctx, cPad, PATCH.pad, mtof(base + ch.pc + iv), tm, sx * (bl - 1));
    if (t.wind && p === 0 && bar % 2 === 0) windGust(ctx, cPad, tm, sx * bl * 1.9, t.wind, 650);
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

// ---------------------------------------------------------------------------
// Original tunes added later. Each is defined once (lead melody + chord roots + bass
// pattern) and registered as BOTH a chip arrangement (TRACKS: square/triangle/noise) and
// an FM arrangement (TRACKS16). All melodies are original to this game.
//   bustle   kitchen/pantry   G major 152  busy and bouncy
//   waltz    dining/drawing   D major 126  3/4, stately, 12 bars
//   crypt    cellar           A minor  92  creepy-cosy
//   lullaby  bedrooms         F major  66  slow and rocking
//   bubbles  bathroom         D major 144  playful staccato
//   attic    attic            E minor  76  sparse, windy
//   jaunty   drive/terrace    F major 126  marching swagger
//   quest    fells            D minor 140  adventurous gallop
//   zombie_house   (Zombie Night, indoors)  D minor 100  plodding, spooky-fun
//   zombie_outside (Zombie Night, outdoors) E minor  72  eerie, misty, sparse
//   dawn     (Zombie Night ending)          C major 108  sunrise
// ---------------------------------------------------------------------------
const midiOf = (n: string) => {
  const m = /^([A-G][#b]?)(\d)$/.exec(n);
  return m ? NOTE[m[1]] + (Number(m[2]) + 1) * 12 : 0;
};
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const midiName = (m: number) => SHARPS[m % 12] + (Math.floor(m / 12) - 1);
const OFF: Record<string, number> = { '1': 0, m: 3, t: 4, '5': 7, '6': 9, b: 10, '8': 12 };

/** One bass pattern per bar: tokens 1=root m=minor3rd t=major3rd 5=fifth 6=sixth b=flat7th 8=octave, '-' hold, '.' rest. */
function walk(roots: string, tpl: string): string {
  const out: string[] = [];
  for (const r of roots.trim().split(/\s+/)) {
    const m = midiOf(r);
    for (const tk of tpl.trim().split(/\s+/)) out.push(tk in OFF ? midiName(m + OFF[tk]) : tk);
  }
  return out.join(' ');
}

interface Tune {
  bpm: number;
  bar?: number;
  lead: string;
  roots: string;
  tpl: string;
  chords: string;
  chip: string; // chip drum pattern
  wave?: OscillatorType;
  lv?: number;
  harm?: boolean; // chip: add a chord-tone harmony voice under the lead
  arpFrom?: number; // chip: add a chord arpeggio line from this bar (0-based)
  fm: Omit<Track16, 'bpm' | 'lead' | 'bass' | 'chords' | 'bar'>;
}
/** Chip harmony: for each lead note, the highest chord tone at least a minor third below it. */
function harmonize(lead: string, chords: string, bar = 8): string {
  const cs = chords.trim().split(/\s+/).map(parseChord);
  return lead
    .trim()
    .split(/\s+/)
    .map((tk, i) => {
      const m = midiOf(tk);
      if (!m) return tk;
      const c = cs[Math.floor(i / bar) % cs.length];
      let best = 0;
      for (let o = 24; o <= 108; o += 12) for (const iv of c.iv) {
        const p = o + c.pc + iv;
        if (p <= m - 3 && p > best) best = p;
      }
      return best ? midiName(best) : '.';
    })
    .join(' ');
}
/** Chip arpeggio: root-3rd-5th-octave-5th-3rd-5th-octave over each bar's chord, from `from` bar on. */
function arpLine(chords: string, total: number, bar = 8, from = 0): string {
  const cs = chords.trim().split(/\s+/).map(parseChord);
  const out: string[] = [];
  for (let i = 0; i < total; i++) {
    const b = Math.floor(i / bar);
    if (b < from) {
      out.push('.');
      continue;
    }
    const c = cs[b % cs.length];
    const base = (c.pc > 6 ? 48 : 60) + c.pc;
    const tones = [base + c.iv[0], base + c.iv[1], base + c.iv[2], base + 12];
    out.push(midiName(tones[[0, 1, 2, 3, 2, 1, 2, 3][(i % bar) % 8]]));
  }
  return out.join(' ');
}
function def(name: string, t: Tune) {
  const bass = walk(t.roots, t.tpl);
  const n8 = Math.max(t.lead.trim().split(/\s+/).length, bass.split(' ').length);
  TRACKS[name] = {
    bpm: t.bpm,
    bar: t.bar,
    lead: t.lead,
    bass,
    drums: t.chip,
    wave: t.wave,
    lv: t.lv,
    harm: t.harm ? harmonize(t.lead, t.chords, t.bar) : undefined,
    arp: t.arpFrom !== undefined ? arpLine(t.chords, n8, t.bar, t.arpFrom) : undefined,
  };
  TRACKS16[name] = { bpm: t.bpm, bar: t.bar, lead: t.lead, bass, chords: t.chords, ...t.fm };
}
const D16 = '................';

// kitchen / pantry: busy, bouncy
def('bustle', {
  bpm: 152,
  lead:
    'G5 . D5 G5 . B5 A5 G5 ' +
    'E5 . G5 C6 . B5 A5 G5 ' +
    'B4 D5 G5 D5 B5 . G5 . ' +
    'F#5 . A5 . D6 C6 B5 A5 ' +
    'G5 . E5 G5 B5 . A5 G5 ' +
    'E5 G5 C6 G5 E5 . G5 C6 ' +
    'D6 . C6 B5 A5 . F#5 A5 ' +
    'G5 B5 D6 B5 G5 - . .',
  roots: 'G2 C3 G2 D3 E3 C3 D3 G2',
  tpl: '1 . 5 . 1 . 5 5',
  chords: 'G C G D Em C D G',
  chip: 'o.x.s.x.',
  fm: {
    leadVoice: 'lead',
    drums: { k: 'k...k...k...k...', s: '....s.......s...', h: 'h.h.h.h.h.h.h.h.', o: '..............o.' },
    stab: '..x...x...x...x.',
    arp: { pat: '.x...x...x...x.x', voice: 'pluck', oct: 5, vel: 0.35 },
    pad: true,
    fill: true,
    swing: 0.15,
    echo: 0.12,
  },
});

// dining / drawing room: a stately waltz
def('waltz', {
  bpm: 126,
  bar: 6,
  lead:
    'F#5 - A5 - D6 - ' +
    'D6 - B5 - F#5 - ' +
    'G5 - B5 - D6 - ' +
    'C#6 - B5 A5 G5 - ' +
    'F#5 A5 D6 - F#6 - ' +
    'F#6 - E6 - C#6 - ' +
    'D6 - B5 - A5 B5 ' +
    'G5 - B5 - E6 - ' +
    'D6 - B5 - G5 - ' +
    'E5 G5 A5 C#6 E6 - ' +
    'D6 - A5 - F#5 - ' +
    'A5 - G5 - E5 -',
  roots: 'D3 B2 G2 A2 D3 F#2 B2 E3 G2 A2 D3 A2',
  tpl: '1 . 8 . 8 .',
  chords: 'D Bm G A7 D F#m Bm Em G A7 D A7',
  chip: 'o.x.x.',
  fm: {
    leadVoice: 'ep',
    drums: { k: 'k...........', s: D16, h: '....h...h...' },
    stab: '....x...x...',
    arp: { pat: 'x.....x.....x.....x.....', voice: 'bell', oct: 5, vel: 0.45 },
    pad: true,
    echo: 0.26,
  },
});

// cellar: creepy-cosy, minor
def('crypt', {
  bpm: 92,
  wave: 'triangle',
  lv: 0.1,
  lead:
    'E5 - - C5 B4 - A4 - ' +
    'G#4 - B4 - E5 - - - ' +
    'A5 - - F5 E5 - D5 - ' +
    'E5 - D#5 - E5 - B4 - ' +
    'C5 - E5 - A5 - G5 - ' +
    'F5 - A5 - D6 - C6 - ' +
    'B5 - G#5 - E5 - D5 - ' +
    'C5 - B4 - A4 - . .',
  roots: 'A2 A2 F2 E2 A2 D3 E2 A2',
  tpl: '1 - . . 5 - 1 .',
  chords: 'Am Am F E Am Dm E7 Am',
  chip: 'o.....x.',
  fm: {
    leadVoice: 'ep',
    drums: { k: 'k.......k.......', s: D16, h: '....h.......h...' },
    arp: { pat: '..x.....x.......', voice: 'bell', oct: 5, vel: 0.5 },
    pad: true,
    swing: 0.2,
    echo: 0.4,
  },
});

// upstairs landing and bedrooms: a slow, rocking lullaby
def('lullaby', {
  bpm: 66,
  wave: 'triangle',
  lv: 0.1,
  lead:
    'A5 - - C6 A5 - F5 - ' +
    'D5 - F5 - A5 - - - ' +
    'Bb5 - A5 - G5 - F5 - ' +
    'E5 - G5 - Bb5 - A5 G5 ' +
    'A5 - - C6 D6 - C6 - ' +
    'E5 - A5 - C6 - B5 A5 ' +
    'D6 - C6 - Bb5 - A5 - ' +
    'G5 - E5 - G5 - . .',
  roots: 'F2 D3 Bb2 C3 F2 A2 Bb2 C3',
  tpl: '1 . 5 . 8 . 5 .',
  chords: 'F Dm Bb C7 F Am Bb C',
  chip: '........',
  fm: {
    leadVoice: 'ep',
    drums: { k: D16, s: D16, h: D16 },
    arp: { pat: '..x...x...x...x.', voice: 'bell', oct: 5, vel: 0.4 },
    pad: true,
    echo: 0.34,
  },
});

// bathroom: bubbly, playful
def('bubbles', {
  bpm: 144,
  lead:
    'D5 F#5 A5 F#5 D6 . A5 . ' +
    'B5 . G5 B5 D6 . B5 G5 ' +
    'A5 F#5 D5 F#5 A5 D6 . F#6 ' +
    'E6 . C#6 . A5 . E5 . ' +
    'D6 . A5 D6 F#6 . D6 A5 ' +
    'G5 B5 D6 B5 G6 . D6 . ' +
    'C#6 E6 A6 E6 C#6 . A5 E5 ' +
    'D6 A5 F#5 A5 D5 - . .',
  roots: 'D3 G2 D3 A2 D3 G2 A2 D3',
  tpl: '1 . 1 . 5 . 8 .',
  chords: 'D G D A D G A D',
  chip: 'b.xbb.x.',
  fm: {
    leadVoice: 'pluck',
    drums: { k: 'k.......k.......', s: D16, h: 'h.h.h.h.h.h.h.h.' },
    arp: { pat: '.x..x.x...x..x.x', voice: 'bell', oct: 6, vel: 0.5 },
    pad: true,
    swing: 0.25,
    echo: 0.3,
  },
});

// attic: mysterious and windy
def('attic', {
  bpm: 76,
  wave: 'triangle',
  lv: 0.1,
  lead:
    'B4 - - - E5 - - G5 ' +
    'B5 - - - G5 - E5 - ' +
    'A4 - C5 - E5 - - - ' +
    'D#5 - F#5 - B5 - A5 - ' +
    'G5 - - F#5 E5 - - B4 ' +
    'C5 - E5 - G5 - B5 - ' +
    'A5 - F#5 - D#5 - - - ' +
    'E5 - - - - - . .',
  roots: 'E2 C3 A2 B2 E2 C3 B2 E2',
  tpl: '1 - - - - - 5 -',
  chords: 'Em Cmaj7 Am B7 Em Cmaj7 B7 Em',
  chip: 'w...............',
  fm: {
    leadVoice: 'ghost',
    drums: { k: D16, s: D16, h: D16 },
    arp: { pat: '....x.......x...', voice: 'bell', oct: 6, vel: 0.4 },
    pad: true,
    wind: 0.5,
    echo: 0.42,
  },
});

// drive / terrace: jaunty march
def('jaunty', {
  bpm: 126,
  lead:
    'A5 . C6 A5 F5 . A5 C6 ' +
    'D6 . Bb5 D6 F6 . D6 Bb5 ' +
    'A5 . C6 A5 F5 . G5 A5 ' +
    'G5 . E5 G5 C6 - - . ' +
    'F6 . C6 A5 C6 . A5 F5 ' +
    'D6 . F6 D6 Bb5 . D6 F6 ' +
    'E6 . D6 C6 Bb5 . G5 E5 ' +
    'F5 A5 C6 A5 F5 - . .',
  roots: 'F2 Bb2 F2 C3 F2 Bb2 C3 F2',
  tpl: '1 . 5 . 8 . 5 1',
  chords: 'F Bb F C F Bb C7 F',
  chip: 'o.s.o.sx',
  fm: {
    leadVoice: 'brass',
    drums: { k: 'k...k...k...k...', s: '..s...s...s...s.', h: 'h.h.h.h.h.h.h.h.' },
    stab: '..x...x...x...x.',
    pad: true,
    swing: 0.3,
    echo: 0.15,
  },
});

// fells: adventurous gallop
def('quest', {
  bpm: 140,
  lead:
    'D5 F5 A5 - D6 - C6 A5 ' +
    'Bb5 - A5 - F5 - D5 F5 ' +
    'A5 - C6 - F6 - E6 C6 ' +
    'G5 - C6 - E6 - D6 C6 ' +
    'D6 - F6 - A6 - G6 F6 ' +
    'D6 - Bb5 - D6 - F6 - ' +
    'E6 - D6 - C6 - G5 - ' +
    'C#6 - E6 - A6 - . .',
  roots: 'D3 Bb2 F2 C3 D3 Bb2 C3 A2',
  tpl: '1 1 8 1 1 8 1 5',
  chords: 'Dm Bb F C Dm Bb C A',
  chip: 'oxsxoxsx',
  fm: {
    leadVoice: 'brass',
    drums: { k: 'k.....k.k.....k.', s: '....s.......s...', h: 'hhhhhhhhhhhhhhhh', o: '..o...o...o...o.' },
    arp: { pat: 'x.x.x.x.x.x.x.x.', voice: 'pluck', oct: 4, vel: 0.35 },
    pad: true,
    fill: true,
    echo: 0.18,
  },
});

// ZOMBIE NIGHT: indoors, spooky but fun, a plodding lurch
def('zombie_house', {
  bpm: 100,
  lead:
    'D5 . D5 F5 . E5 D5 . ' +
    'A4 . D5 . F5 - - - ' +
    'Bb4 . Bb4 D5 . C5 Bb4 . ' +
    'C#5 . E5 . A5 - - . ' +
    'D5 . D5 F5 . G5 A5 . ' +
    'Bb5 . A5 . G5 . F5 . ' +
    'E5 . G5 . A5 . C#6 . ' +
    'A5 - G5 - E5 - . .',
  roots: 'D3 D3 Bb2 A2 D3 G2 A2 A2',
  tpl: '1 . . . 1 . 5 .',
  chords: 'Dm Dm Bb A Dm Gm A7 A7',
  chip: 'o...s.o.',
  fm: {
    leadVoice: 'reed',
    drums: { k: 'k.......k.....k.', s: '....s.......s...', h: 'h...h...h...h...' },
    arp: { pat: '.......x........', voice: 'bell', oct: 5, vel: 0.5 },
    pad: true,
    swing: 0.35,
    echo: 0.3,
  },
});

// ZOMBIE NIGHT: outdoors, eerie, misty, sparse
def('zombie_outside', {
  bpm: 72,
  wave: 'triangle',
  lv: 0.1,
  lead:
    'B4 - - - - - E5 - ' +
    'G5 - - - F#5 - - - ' +
    'E5 - - - C5 - A4 - ' +
    'B4 - - - - - . . ' +
    'G4 - C5 - E5 - - - ' +
    'D#5 - - - F#5 - - A5 ' +
    'G5 - - - - - B5 - ' +
    'E5 - - - - - . .',
  roots: 'E2 E2 A2 A2 C3 B2 E2 E2',
  tpl: '1 - - - - - - -',
  chords: 'Em Em Am Am C B7 Em Em',
  chip: 'w...............',
  fm: {
    leadVoice: 'ghost',
    drums: { k: D16, s: D16, h: D16 },
    arp: { pat: '........x.......', voice: 'bell', oct: 6, vel: 0.35 },
    pad: true,
    wind: 0.4,
    echo: 0.45,
  },
});

// ZOMBIE NIGHT: the sun comes up (hopeful, triumphant)
def('dawn', {
  bpm: 108,
  lead:
    'E5 - G5 - C6 - - - ' +
    'B5 - D6 - G6 - - - ' +
    'A5 - C6 - E6 - D6 C6 ' +
    'A5 - C6 - F6 - E6 - ' +
    'G5 C6 E6 - G6 - E6 C6 ' +
    'D6 - B5 - G5 B5 D6 - ' +
    'C6 - A5 - F5 A5 C6 - ' +
    'E6 - D6 - C6 - - -',
  roots: 'C3 G2 A2 F2 C3 G2 F2 C3',
  tpl: '1 5 8 5 1 5 8 5',
  chords: 'C G Am F C G F C',
  chip: 'o.x.o.x.',
  fm: {
    leadVoice: 'brass',
    drums: { k: 'k...k...k...k...', s: '........s.......', h: 'h.h.h.h.h.h.h.h.' },
    arp: { pat: 'x.x.x.x.x.x.x.x.', voice: 'bell', oct: 5, vel: 0.55 },
    pad: true,
    fill: true,
    echo: 0.25,
  },
});

// 100% LEGEND credits: anthemic, 24 bars (~48 s a loop), C major with a lift to D major
//   A  bars 1-8   verse, C G Am F | C G F G        (sparse -> full backbeat, arps join at bar 5)
//   B  bars 9-16  chorus, F C G Am | F C G A       (big held notes, the A chord pushes up...)
//   C  bars 17-24 final chorus UP A TONE in D, D A Bm G | D A G G  (the last G is V of C: clean loop)
const ANTHEM_CHIP =
  ['o.x.s.x.', 'o.x.s.x.', 'o.x.s.x.', 'o.x.sstT'].join('') +
  ['oxsxoxsx', 'oxsxoxsx', 'oxsxoxsx', 'oxsxtTTu'].join('') +
  ['oxsxoxss', 'oxsxoxss', 'oxsxoxss', 'oxsxsttT'].join('') +
  ['oxsxoxss', 'oxsxoxss', 'oxsxoxss', 'oxsxtTTu'].join('') +
  ['oxsoosxs', 'oxsoosxs', 'oxsoosxs', 'oxsxsttT'].join('') +
  ['oxsoosxs', 'oxsoosxs', 'oxsoosxs', 'osttTTuu'].join('');
const bars16 = (...b: string[]) => b.join('');
def('anthem', {
  bpm: 120,
  lead:
    // A (C major)
    'G5 - C6 - E6 - D6 C6 ' +
    'B5 - - - G5 - A5 B5 ' +
    'C6 - E6 - D6 - C6 A5 ' +
    'A5 - - - F5 - G5 A5 ' +
    'G5 - C6 - E6 - G6 E6 ' +
    'D6 - B5 - G5 - B5 D6 ' +
    'C6 - A5 - F5 - A5 C6 ' +
    'D6 - - - B5 - D6 - ' +
    // B (chorus)
    'A5 - C6 - F6 - - - ' +
    'E6 - - D6 C6 - G5 - ' +
    'B5 - D6 - G6 - - F6 ' +
    'E6 - D6 - C6 - A5 - ' +
    'A6 - - G6 F6 - C6 - ' +
    'G6 - - E6 C6 - E6 G6 ' +
    'D6 - - - B5 - D6 G6 ' +
    'E6 - C#6 - A5 - C#6 E6 ' +
    // C (up a tone, D major)
    'A5 - D6 - F#6 - A6 - ' +
    'G6 - - F#6 E6 - C#6 - ' +
    'D6 - F#6 - B6 - - A6 ' +
    'G6 - F#6 - E6 - D6 B5 ' +
    'A6 - - F#6 D6 - F#6 A6 ' +
    'E6 - - - C#6 - E6 A6 ' +
    'B6 - - A6 G6 - B5 D6 ' +
    'G6 - - - D6 - . .',
  roots: 'C3 G2 A2 F2 C3 G2 F2 G2 F2 C3 G2 A2 F2 C3 G2 A2 D3 A2 B2 G2 D3 A2 G2 G2',
  tpl: '1 1 8 1 1 8 1 5',
  chords: 'C G Am F C G F G F C G Am F C G A D A Bm G D A G G',
  chip: ANTHEM_CHIP,
  harm: true,
  arpFrom: 4,
  lv: 0.055,
  fm: {
    leadVoice: 'brass',
    drums: {
      k: bars16(
        ...['k.......k.......', 'k.......k.......', 'k.......k.......', 'k.......k.......'],
        ...['k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...', 'k...k...k...k...'],
        ...Array(8).fill('k...k...k..kk...'),
        ...Array(8).fill('k..kk..kk..kk.k.'),
      ),
      s: bars16(
        ...Array(8).fill('....s.......s...'),
        ...Array(8).fill('....s.......s..s'),
        ...Array(8).fill('....s..s....s.ss'),
      ),
      h: bars16(...Array(4).fill('h.h.h.h.h.h.h.h.'), ...Array(20).fill('hhhhhhhhhhhhhhhh')),
      o: bars16(...Array(4).fill(D16), ...Array(4).fill('..............o.'), ...Array(16).fill('..o...o...o...o.')),
    },
    stab: bars16(...Array(4).fill(D16), ...Array(12).fill('..x...x...x...x.'), ...Array(8).fill('x..x..x.x..x..x.')),
    arp: {
      pat: bars16(...Array(4).fill('.x...x...x...x..'), ...Array(4).fill('x.x.x.x.x.x.x.x.'), ...Array(8).fill('x.x.x.x.x.x.x.x.'), ...Array(8).fill('x.x.x.x.x.x.x.xx')),
      voice: 'bell',
      oct: 5,
      vel: 0.55,
    },
    pad: true,
    fill: true,
    fillBars: [3, 7, 11, 15, 19],
    echo: 0.22,
  },
});

/** Exposed for tests/tools: the registered tune tables. */
export const tuneData = { TRACKS, TRACKS16 };
