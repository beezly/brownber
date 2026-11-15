// The game's 16-colour palette. Keep in sync with tools/make_portraits.py.
export const PAL = {
  ink: 0x1a1c2c,
  white: 0xf4f4f4,
  lgrey: 0x94b0c2,
  grey: 0x566c86,
  slate: 0x333c57,
  plum: 0x5d275d,
  red: 0xb13e53,
  orange: 0xef7d57,
  yellow: 0xffcd75,
  lime: 0xa7f070,
  green: 0x38b764,
  teal: 0x257179,
  navy: 0x29366f,
  blue: 0x3b5dc9,
  brown: 0x8a5a3b,
  peach: 0xf4c09a,
} as const;

export type PalName = keyof typeof PAL;

export const css = (c: number) => '#' + c.toString(16).padStart(6, '0');
