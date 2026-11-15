// Static checks for room data. Run with:  npm run check:rooms
// Exits non-zero if there are errors. Warnings are printed but don't fail.
import { ROOMS, EXTRA_SPRITES, START_ROOM, TOTAL_ITEMS } from '../src/rooms';
import { CHARACTERS } from '../src/characters';

const LEGAL = new Set('#X=-C<>B^F~*PN.GDWO'.split(''));
const SUPPORT = new Set('#X=-C<>~BGDO'.split(''));
const SOLID = new Set('#XBGD'.split(''));
const BUILTIN_SPRITES = new Set(['hoover', 'jar']);
const ITEM_KEYS = new Set([
  'sourdough', 'marmalade', 'prosecco', 'cake', 'cookie', 'coffee', 'tea', 'cheese', 'boot', 'blanket',
  'binoculars', 'thermos', 'porkpie', 'milk', 'lighter',
]);
const OPP: Record<string, string> = { left: 'right', right: 'left', up: 'down', down: 'up' };

let errors = 0;
let warnings = 0;
const err = (room: string, msg: string) => {
  errors++;
  console.log(`ERROR  [${room}] ${msg}`);
};
const warn = (room: string, msg: string) => {
  warnings++;
  console.log(`warn   [${room}] ${msg}`);
};

const charIds = new Set(CHARACTERS.map((c) => c.id));
const npcSeen = new Map<string, string>();
const posSeen = new Map<string, string>();

for (const [key, room] of Object.entries(ROOMS)) {
  if (room.id !== key) err(key, `id '${room.id}' does not match its key`);
  const m = room.map;
  if (m.length !== 22) err(key, `map has ${m.length} rows, needs 22`);
  m.forEach((row, r) => {
    if (row.length !== 32) err(key, `row ${r} has ${row.length} chars, needs 32: '${row}'`);
    for (const ch of row) if (!LEGAL.has(ch)) err(key, `row ${r} has illegal char '${ch}'`);
  });
  const at = (c: number, r: number) => (r < 0 || r >= m.length ? '.' : (m[r][c] ?? '.'));

  // items
  const stars = m.join('').split('*').length - 1;
  if (stars > 0 && room.items.length === 0) err(key, `has ${stars} items (*) but an empty items list`);
  for (const it of room.items) if (!ITEM_KEYS.has(it) && !EXTRA_SPRITES['item_' + it]) err(key, `unknown item sprite '${it}' (add 'item_${it}' to your SPRITES)`);
  if (room.items.length < stars) warn(key, `${stars} items but only ${room.items.length} sprite names (they repeat)`);

  // NPCs
  const nCount = m.join('').split('N').length - 1;
  if (nCount !== room.npcs.length) err(key, `${nCount} N tiles but ${room.npcs.length} npcs defined`);
  m.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] === 'N' && !SUPPORT.has(at(c, r + 1))) err(key, `NPC at row ${r} col ${c} is floating (nothing to stand on at row ${r + 1})`);
      if (row[c] === '*') {
        // items should not be buried in walls
        if (SOLID.has(at(c, r))) err(key, `item at row ${r} col ${c} is inside a wall`);
      }
    }
  });
  for (const n of room.npcs) {
    if (!charIds.has(n.id)) err(key, `unknown NPC id '${n.id}'`);
    if (npcSeen.has(n.id)) warn(key, `${n.id} also stands in '${npcSeen.get(n.id)}'`);
    else npcSeen.set(n.id, key);
    for (const h of Object.keys(n.byHero ?? {})) if (!charIds.has(h)) err(key, `byHero uses unknown character '${h}'`);
  }

  // guardians
  for (const g of room.guardians) {
    if ('sprite' in g && !EXTRA_SPRITES[g.sprite] && !BUILTIN_SPRITES.has(g.sprite))
      err(key, `guardian uses unknown sprite '${g.sprite}'`);
  }

  // map position
  if (!room.pos) err(key, 'missing pos');
  else {
    const p = `${room.pos.x},${room.pos.y}`;
    if (posSeen.has(p)) err(key, `map pos ${p} already used by '${posSeen.get(p)}'`);
    posSeen.set(p, key);
  }

  // edges and exits
  const openRows = (col: number) => m.map((row, r) => (SOLID.has(row[col]) ? -1 : r)).filter((r) => r >= 0);
  const openCols = (row: number) => [...(m[row] ?? '')].map((ch, c) => (SOLID.has(ch) ? -1 : c)).filter((c) => c >= 0);
  const edges: Record<string, number[]> = {
    left: openRows(0),
    right: openRows(31),
    up: openCols(0),
    down: openCols(21).filter((c) => m[21]?.[c] !== 'W'), // water in the floor is a hazard, not an exit
  };
  for (const dir of ['left', 'right', 'up', 'down'] as const) {
    const target = room.exits[dir];
    if (!target) {
      if (edges[dir].length && dir !== 'up') warn(key, `${dir} edge is open (${edges[dir].join(',')}) but has no exit`);
      continue;
    }
    const other = ROOMS[target];
    if (!other) {
      err(key, `${dir} exit goes to unknown room '${target}'`);
      continue;
    }
    if (other.exits[OPP[dir] as 'left'] !== key) err(key, `${dir} exit to '${target}' is not matched by its ${OPP[dir]} exit`);
    if (!edges[dir].length) err(key, `${dir} exit to '${target}' but that edge is fully walled`);
    const om = other.map;
    if (dir === 'left' || dir === 'right') {
      const oCol = dir === 'left' ? 31 : 0;
      const theirs = om.map((row, r) => (SOLID.has(row[oCol]) ? -1 : r)).filter((r) => r >= 0);
      if (edges[dir].join(',') !== theirs.join(','))
        err(key, `${dir} doorway rows [${edges[dir].join(',')}] don't match '${target}' rows [${theirs.join(',')}]`);
      // there should be something to stand on under the doorway
      const lowest = Math.max(...edges[dir]);
      const c = dir === 'left' ? 0 : 31;
      if (lowest < 21 && !SUPPORT.has(at(c, lowest + 1))) warn(key, `${dir} doorway has no floor under row ${lowest}`);
    } else if (dir === 'up') {
      const theirs = new Set([...(om[21] ?? '')].map((ch, c) => (SOLID.has(ch) ? -1 : c)).filter((c) => c >= 0));
      for (const c of edges.up) if (!theirs.has(c)) err(key, `ceiling gap col ${c} is walled in '${target}' floor (row 21)`);
    }
  }
}

// connectivity from the start room
const seen = new Set<string>();
const q = [START_ROOM];
while (q.length) {
  const id = q.shift()!;
  if (seen.has(id) || !ROOMS[id]) continue;
  seen.add(id);
  for (const t of Object.values(ROOMS[id].exits)) if (t) q.push(t);
}
for (const id of Object.keys(ROOMS)) if (!seen.has(id)) err(id, `not reachable from '${START_ROOM}'`);

const finale = Object.values(ROOMS).filter((r) => r.map.join('').includes('O'));
if (finale.length !== 1) warn('*', `expected exactly one room with a fire pit 'O', found ${finale.length}`);
if (!Object.values(ROOMS).some((r) => r.items.includes('lighter'))) warn('*', 'nobody has placed the lighter');
const missing = CHARACTERS.filter((c) => !npcSeen.has(c.id)).map((c) => c.id);
if (missing.length) warn('*', `friends not placed as NPCs yet: ${missing.join(', ')}`);

console.log(`\n${Object.keys(ROOMS).length} rooms, ${TOTAL_ITEMS} items. ${errors} errors, ${warnings} warnings.`);
process.exit(errors ? 1 : 0);
