// Tiny chiptune sound effects made with the Web Audio API (no audio files needed).

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

export const sfx = {
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
