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
| Map | M / Tab | MAP (top left) |
| Sound | N, or the ♫ button | ♫ button |

## What's in the prototype

- Title screen with **Cosy** (no deaths) or **Classic** (5 lives, midnight deadline) mode.
- Character select with all 13 friends, each with a pixel portrait made from their photo and an ability based on their real-life quirk (see `src/abilities.ts`).
- 17 rooms across the ground floor, cellar, upstairs, attic, grounds and the Howgill Fells, with 51 party items. The rooms are split into `src/rooms.ts` and `src/rooms/{ground,upstairs,outside}.ts`.
- Binks the Vizsla (bouncy, knocks you flying, never hurts), a robot hoover, a flying marmalade jar, coffee-machine steam, the woodburner, crumbling floorboards, a conveyor, bouncy wellies and walk-up stairs.
- NPC dialogue with portraits. Your partner greets you differently.
- Forgiving jump handling: coyote time and jump buffering, plus a checkpoint each time you land somewhere safe.
- **Zombie Night** (the third mode on the title screen). It's 8pm to dawn, the power's out, and your friends are comedy zombies. Each has a thought bubble showing their favourite thing (Maffa's pork pie, Jonny's pint, Sophie's tea...). Find it and touch them to cure them. Zombies shamble after you but can't jump, and they avoid fire and lamps. A bite turns you zombie for a while (stand in the light to recover). Every ability has a zombie twist: Tom's speeches mesmerise them, Curtis makes them dance, Beez's stuff makes barricades, Debra tidies them into cupboards, Karla's tacos cure them, and so on. Cured friends gather at the fire pit, or the night ends at dawn (`src/zombie.ts`, `src/zombie-art.ts`).
- **Play as Binks** (unlocked once any friend has a legend star). Binks is fast, low and pounces instead of jumping. BARK (Talk) shoos friends away from you, so you herd them room to room, off ledges and down to the fire pit. SNIFF (Power) shows scent trails to treats and to wandering humans. Three treats trigger the zoomies. The robot hoover is his nemesis (bark to scare it off), and Luke keeps lying down. Bark at the fire pit to end the night.
- **16-bit mode** (POWER / X on the title screen): shaded sprites with coloured outlines, bevelled tiles, Victorian panelling, a dusk sky with parallax fells, clouds, scanlines, and FM-synth music and sound effects in the early-90s console style (`src/settings.ts`, `src/music.ts`, `src/sound.ts`). The choice is remembered.
- Progress saves automatically in the browser. The title screen offers to continue.
- A map screen showing explored rooms, items left, friends not yet met, and whether you have the lighter.
- The finale: light the fire pit with Maffa's lighter. Every friend you've talked to comes to the fire, and the ending depends on how many came and how much you found.

Room data is checked with `npm run check:rooms`.

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

Every push to `main` builds the game and deploys it to GitHub Pages automatically (`.github/workflows/deploy.yml`). It's live at **https://beez.ly/brownber/** a minute or two later.

Installed copies (Add to Home Screen) update themselves. Each build writes a `version.json`. The game checks it whenever it's opened or brought back to the foreground: on the title screen it reloads straight away, and mid-game it shows an UPDATE button that saves first. The build id appears in the top-left corner of the title screen.

`npm run deploy` is still there as a manual fallback. It pushes a build to the `gh-pages` branch, but Pages only serves that branch if you switch the Pages source back to "Deploy from a branch".
