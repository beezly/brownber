// "Legends": friends who've completed a 100% run (every friend + every item) in a mode.
// Shown as gold stars on the character select screen.

export type LegendMode = 'cosy' | 'classic' | 'zombie';

export function getLegends(): Record<string, LegendMode[]> {
  try {
    return JSON.parse(localStorage.getItem('bb-legends') || '{}') as Record<string, LegendMode[]>;
  } catch {
    return {};
  }
}

export function addLegend(hero: string, mode: LegendMode) {
  const all = getLegends();
  const list = all[hero] ?? [];
  if (!list.includes(mode)) list.push(mode);
  all[hero] = list;
  try {
    localStorage.setItem('bb-legends', JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
