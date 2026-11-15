# Brownber Buddies

An 8-bit, flip-screen platform game set at Brownber Hall. It plays in the browser on laptops and phones. See [PLAN.md](PLAN.md) for the full design.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. The dev server also listens on your local network, so you can open the "Network" address it prints on your phone, as long as it's on the same Wi-Fi.

## Controls

| | Laptop | Phone (landscape) |
|---|---|---|
| Move | Arrow keys / A, D | ◀ ▶ buttons (bottom left) |
| Jump | Space / W / ↑ | JUMP (bottom right) |
| Talk | E / Enter | TALK |
| Ability | X / Shift | POWER |
| Sound | M, or the ♫ button | ♫ button |

## What's in the prototype

- Title screen with **Cosy** (no deaths) or **Classic** (5 lives, midnight deadline) mode.
- Character select with all 13 friends, each with a pixel portrait made from their photo and an ability based on their real-life quirk (see `src/abilities.ts`).
- 4 rooms: the Porch, Sitting Room, Kitchen and Grand Staircase, with 12 party items to find.
- Binks the Vizsla (bouncy, knocks you flying, never hurts), a robot hoover, a flying marmalade jar, coffee-machine steam, the woodburner, crumbling floorboards, a conveyor, bouncy wellies and walk-up stairs.
- NPC dialogue with portraits. Your partner greets you differently.
- Forgiving jump handling: coyote time and jump buffering, plus a checkpoint each time you land somewhere safe.

## Project layout

| Path | What it is |
|---|---|
| `src/rooms.ts` | Room maps as ASCII (legend at the top), guardians, NPCs, items |
| `src/characters.ts` | Each friend's look (hair, glasses, beard, outfit) and the sprite builder |
| `src/GameScene.ts` | Physics, collisions, rooms, dialogue, HUD |
| `src/MenuScenes.ts` | Boot, title and character select |
| `src/input.ts` | Keyboard and touch controls |
| `src/sound.ts` | Chiptune sound effects (Web Audio, no files) |
| `tools/make_portraits.py` | Turns photos into 48×48 8-bit portraits |
| `public/portraits/` | The generated portraits (these ARE shipped) |
| `original-characters/` | Private reference photos (git-ignored, never shipped) |

## Adding a friend's photo

1. Put the photo in `original-characters/<name>.jpg`, e.g. `luke.jpg`.
2. Add a crop for them to `CROPS` in `tools/make_portraits.py`, then run `python3 tools/make_portraits.py --preview /tmp/p.png` and check the preview.
3. In `src/characters.ts`, set their `portrait: '<name>'`, remove `placeholder: true`, and adjust their hair, glasses, beard and outfit to match.

## Build

```bash
npm run build
```

This outputs a static site in `dist/` that can be hosted anywhere.

## Publish

```bash
npm run deploy
```

This builds the game and force-pushes `dist/` to the `gh-pages` branch. GitHub Pages serves it at **https://beez.ly/brownber/**.
