// Progress is saved in the browser (localStorage), so you can close the tab and carry on later.

export interface SaveData {
  v: 1;
  hero: string;
  mode: 'cosy' | 'classic';
  room: string;
  x: number;
  y: number;
  collected: string[];
  talked: string[];
  visited: string[];
  clock: number;
  lives: number;
  lighter: boolean;
  deaths: number;
}

const KEY = 'bb-save';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as SaveData;
    return d && d.v === 1 ? d : null;
  } catch {
    return null;
  }
}

export function writeSave(d: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage full or blocked: playing on without saving is fine */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
