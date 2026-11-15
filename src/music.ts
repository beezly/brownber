// Music: two kinds of track.
//  - Chip tunes (TRACKS): original, played live by a tiny Web Audio sequencer
//    (square-wave lead, triangle bass, noise hi-hat). Written for this game.
//  - Recorded CC0 tracks (FILES): mp3s in public/music, streamed and looped.
// playMusic(name) picks whichever kind `name` refers to.

import { getAudio, isMuted } from './sound';

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

export function playMusic(name: string) {
  if (current === name && timer !== null) return;
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
}

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
  const file = FILES[current];
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
  const t = TRACKS[current];
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
