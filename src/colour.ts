// Small colour helpers used by the 16-bit renderer.

export function lighten(c: number, k: number) {
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  return (Math.round(r + (255 - r) * k) << 16) | (Math.round(g + (255 - g) * k) << 8) | Math.round(b + (255 - b) * k);
}

export function darken(c: number, k: number) {
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  return (Math.round(r * (1 - k)) << 16) | (Math.round(g * (1 - k)) << 8) | Math.round(b * (1 - k));
}

export function mix(a: number, b: number, t: number) {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** Snap to the 9-bit (3 bits per channel) colour space of early-90s 16-bit consoles. */
export function snap9(c: number) {
  const q = (v: number) => Math.round(v / 36.43) * 36.43;
  const r = q((c >> 16) & 255);
  const g = q((c >> 8) & 255);
  const b = q(c & 255);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
