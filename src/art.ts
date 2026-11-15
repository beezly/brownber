// Real artwork from around Brownber Hall (pixelated by the Kodachrome 8/16 lab).
// Wall pieces hang in the rooms; the Art Trail pieces are bonus collectibles.
// Images live in public/art (made by tools/make_art.py), in _16 (full colour) and _8 (palette) versions.

export interface WallArt {
  key: string; // public/art/wall_<key>_{8,16}.png
  x: number; // centre of the space it hangs in (px)
  y: number; // top (px)
}

export const WALL_ART: Record<string, WallArt[]> = {
  stairs: [{ key: 'motion', x: 68, y: 74 }], // a man walking, on the stairs
  bathroom: [{ key: 'anatomy', x: 124, y: 32 }],
  drawing: [{ key: 'stripes', x: 124, y: 32 }],
  dining: [{ key: 'malawi', x: 124, y: 32 }],
  tomluke: [{ key: 'dogphoto', x: 108, y: 16 }], // Binks's portrait, obviously
};

export interface TrailArt {
  key: string; // public/art/trail_<key>_{icon,full}_{8,16}.png
  title: string;
  room: string;
  x: number; // top-left of the icon (px)
  y: number;
}

export const ART_TRAIL: TrailArt[] = [
  { key: 'sculpture', title: 'THE BALLOON BOUQUET', room: 'sitting', x: 100, y: 52 },
  { key: 'shelfprint', title: 'THE SHELF PRINT', room: 'landing', x: 124, y: 12 },
  { key: 'triptych', title: 'THE SKULL TRIPTYCH', room: 'attic', x: 120, y: 44 },
  { key: 'gallery', title: 'THE GALLERY WALL', room: 'porch', x: 164, y: 78 },
];

export const artFiles = () => [
  ...Object.values(WALL_ART).flat().map((a) => `wall_${a.key}`),
  ...ART_TRAIL.flatMap((a) => [`trail_${a.key}_icon`, `trail_${a.key}_full`]),
];
