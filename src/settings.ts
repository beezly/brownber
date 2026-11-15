// Player settings that persist between visits.
//  style: '8bit'  = the original look and chip sound
//         '16bit' = the optional upgrade: shaded 16-bit graphics and FM-synth music, in the
//                   spirit of the early-90s 16-bit consoles.

export type Style = '8bit' | '16bit';

let style: Style = '8bit';
try {
  if (localStorage.getItem('bb-style') === '16bit') style = '16bit';
} catch {
  /* storage unavailable */
}

const listeners: ((s: Style) => void)[] = [];

export function getStyle(): Style {
  return style;
}

export function is16(): boolean {
  return style === '16bit';
}

export function setStyle(s: Style) {
  if (s === style) return;
  style = s;
  try {
    localStorage.setItem('bb-style', s);
  } catch {
    /* ignore */
  }
  for (const fn of listeners) fn(s);
}

/** Called whenever the style changes (e.g. to re-bake textures or switch music voices). */
export function onStyleChange(fn: (s: Style) => void) {
  listeners.push(fn);
}
