# Brownber Buddies: Game Plan

An 8-bit, flip-screen platform adventure set in and around Brownber Hall (Newbiggin-on-Lune, Cumbria). It plays in a browser on laptops and phones. You pick one of the friends to play. Everyone else is in the house as NPCs: they need things, they get in the way, they help you, and they wind each other up.

---

## 1. What "in the style of Jet Set Willy" should mean here

What we keep from the genre, and what we change so it's fun now (and fair for friends who don't play games):

| Keep (genre traits that make it work) | Change (why classic versions frustrate people) |
|---|---|
| Flip-screen rooms: each screen is a single room with a funny name | Checkpoint on every room entry, so you can never get stuck in a death loop |
| A large house you explore non-linearly, with outdoor areas and secrets | Optional map screen that fills in as you explore |
| A fixed, committed jump arc: precise and readable | Coyote time (~5 frames) and jump buffering (~7 frames), so jumps feel fair on touch screens |
| Moving "guardians" on fixed patrol paths: learn the pattern, time your move | Two modes: **Cosy** (infinite lives, hazards just bump you back) and **Classic** (lives, real danger) |
| Collect glowing items scattered across the house | Items counter per area, plus a hint from NPCs when you're stuck |
| Ropes, conveyors, crumbling floors, stairs as ramps | Short sessions: autosave after each item, so it works for a 3-minute phone play |
| A distinctive, slightly surreal sense of humour | NPCs with dialogue and quests (the classic genre had almost none) |

This is an original game: original rooms, characters, music and art, using the genre's mechanics. We won't reuse any names, levels, tunes or graphics from the original.

---

## 2. The premise

**"The Big Night In."** It's Saturday at Brownber Hall. The gang are all here for the weekend, and tonight is the big party around the fire pit, followed by stargazing under the Cumbrian dark skies. But nothing is ready. The hamper has been raided, the prosecco has gone walkabout, Binks has hidden things all over the estate, and everyone has their own little crisis.

You have from **4pm (check-in) to midnight**. An in-game clock runs (1 real minute = 15 game minutes, so about 30 minutes for a full run). You need to:

1. **Collect party items** scattered through the house and grounds (about 60 in total).
2. **Help your friends** with their personal quests. Each solved quest brings that friend to the fire pit.
3. Get to the **fire pit finale** before midnight. The ending depends on how many friends made it and how many items you found: anything from "a damp evening with three people and some crisps" up to the full gang, a roaring fire, and a shooting star.

In Cosy mode the clock is just decoration, and you can keep playing after midnight.

---

## 3. The map: based on the real Hall

The Hall's floor plan gives us a real layout to work from. About 40 screens, in five zones:

### Ground floor (real rooms)
- **The Porch**: start screen, with a pile of wellies (a bouncy platform).
- **Sitting Room**: the woodburner (a fire hazard with rising sparks), sofas as platforms.
- **Drawing Room**: big bay window, armchairs, a round table. It's a "quiet" room with a sleeping NPC you mustn't wake.
- **Dining Room**: the table for 16 is a long platform. A dinner service is set and the plates spin.
- **Kitchen**: the bean-to-cup coffee machine (steam jets), the enormous fridge (climbable, the door swings open), 2 dishwashers.
- **Pantry**: sourdough, Amanda's marmalade, cakes. A guarded treasure room.
- **Laundry**: washing lines as **ropes** to swing on, tumble-dryer conveyor.
- **Powder Room**, **Bedroom 12**, the **main staircase** (diagonal ramp, like the genre's stairs).

### First floor (real rooms)
- **The Landing**: a long corridor hub with doors to every bedroom.
- **Bedrooms 1–7**, each "belonging" to a couple or friend during the stay and decorated to suit them (and their mess). Bedroom doors only open once you've talked to the occupant.
- **Family Bathroom**: a roll-top bath with rising bubbles as moving platforms, and a slippery floor.

### Invented interior (secret and fun spaces)
- **The Cellar**: wine racks, dripping pipes, dark rooms you light with a torch.
- **The Attic / Roof**: chimney stacks, slates, the weathervane. Best views and hardest jumps.
- **Bar Snug** and **DVD Cinema Room** (both mentioned on the Hall's website), where a film is playing and the screen flickers.

### The grounds
- **South-facing Terrace**, **The Lawn**, **The Fire Pit** (finale screen), **BBQ**.
- **The Drive & Cattle Grid**: wobbly bars over a drop. The website warns that taking the wrong road means you're "doomed", so that becomes the room name.
- **The Lodge** at the gate, and **Brownber House** next door (a couple of bonus screens).

### Beyond the walls (bonus zone, unlocked mid-game)
- **Howgill Fells**: sheep (patrolling guardians), wind gusts.
- **Cautley Spout**: a vertical waterfall climb.
- **Smardale** viaduct and the **Settle–Carlisle railway**: a train passes on a timer.
- **River Eden wild-swimming pool**: a swimming screen.

Room names are a big part of the genre's charm. Ideas: *"Shush You!" Said The Satnav*, *The Fridge That Ate Debra*, *Binks Was Here*, *Marmalade Mountain*, *Bedroom 4 (Do Not Disturb)*, *Doomed At The Cattle Grid*.

---

## 4. Characters

### Playable roster (12) plus Binks

| Character | Partner | Starting idea for an ability (to tune once I know them) |
|---|---|---|
| Beth | Curtis | |
| Curtis | Beth | |
| Tom | Luke | **Binks companion**: Binks follows you and sniffs out hidden items |
| Luke | Tom | **Binks companion** (as for Tom) |
| Maffa | — | |
| Debra | — | |
| Beez | — | |
| Nick | Karla | |
| Karla | Nick | |
| Leo | Sophie | |
| Sophie | Leo | |
| Johnny | Becca | |
| Becca | Johnny | |

**Abilities (built, from each friend's real quirk):** Beth: Five More Minutes (slows the world). Curtis: Keyboard Solo (guardians freeze). Tom: Here, Binks! (Binks follows him and fetches items). Luke: Little Lie Down (untouchable; Binks follows). Maffa: Laser Pointer (Binks and the hoover chase the dot). Debra: Tidy Up (items drift to her). Beez: Leaves Stuff Around (drop piles to climb). Nick: Panic! (sprint). Karla: Taco Shield (survive a hit). Leo: Power Chord (double jump). Sophie: Cockatiel Glide. Jonny: Pint? (guardians stop for a drink). Becca: Quiz Whizz (points to the nearest item).

Original notes: **Every character gets one small, distinct ability**, so who you pick changes how you play and gives replay value. The pool of abilities to assign by personality:
- **Double jump**, **Float** (glide down slowly), **Sprint**, **Wall-jump**, **Small** (fit through gaps), **Charm** (guardians pause briefly when you're nearby), **Night vision** (dark rooms are lit), **Strong** (push furniture), **Swimmer** (outdoor water zones), **Talker** (NPCs give extra hints).

Abilities should feel like a joke about the person ("Beez can talk their way past anything" and so on). **This is where your input matters most** (see section 10).

### Couples mechanics
Couples are a real feature, not just flavour:
- **Partner bonus**: when you play as someone in a couple, your partner is the NPC who gives you hints and a quest that unlocks your ability's upgraded version.
- **"Where's my other half?"**: each partner NPC moves between a few rooms on a schedule, according to the time of day (in the kitchen at 6pm, in the bath at 9pm, and so on). Finding them is a mini puzzle.
- **Couple finale bonus**: both partners at the fire pit gives a little heart animation and bonus points.
- Singles (Maffa, Debra, Beez) get their own special things instead: a unique secret room each, and the "matchmaker" side quest, or they lead the bonus zone.

### Binks the Vizsla
Binks is the star NPC. Energetic and bouncy, as described:
- **For most characters**: Binks is a friendly but chaotic "guardian". He zooms across rooms at random, bounces off walls, and knocks you back (never hurts you, just sends you flying). Sometimes he's carrying a party item in his mouth, and you have to catch him.
- **For Tom and Luke**: Binks is a companion who follows you around, sniffs out hidden items (he points at them), and can be sent to fetch things from places you can't reach.
- **The Binks quest**: Binks has buried things all over the lawn. A dig-them-up side quest.

### NPC interaction
- Walk up to someone and press **Talk**. A speech bubble appears with an 8-bit portrait (the bigger version of their face) and a line of dialogue.
- Each NPC has: a greeting, a quest ("I've lost my…"), a hint about where an item is, and reaction lines once you've helped them.
- Dialogue changes depending on who you are playing ("Oh, it's YOU. Have you seen Nick?" when you're Karla, and so on). With 12 characters, a short per-relationship line table gives a lot of personality for little effort.

---

## 5. Hazards and set pieces (all original, all Brownber-flavoured)

- **Guardians** (fixed patrols): a rogue robot hoover, flying marmalade jars, spinning plates, wasps by the bins, sheep on the fells, a cow at the cattle grid, a mischievous goose.
- **Static hazards**: woodburner sparks, steam from the coffee machine, a hot bath tap, a stack of Monopoly money (it's a trap!), nettles in the garden.
- **Movement features**: washing-line ropes, a tumble-dryer conveyor, rotten floorboards that crumble, the bouncy wellies, the bath bubbles, the swinging fridge door, the staircase ramps.
- **Set pieces**: the Settle–Carlisle train crossing, the dark cellar (with a torch beam), rising water at Cautley Spout, a "find your way in the dark" stargazing room with binoculars.

### Collectibles
Taken from what the Hall actually provides: sourdough loaves, marmalade jars, cakes, cookies, prosecco bottles, tea bags, coffee, the Monopoly box, binoculars, a Thermos, blankets, firewood for the fire pit, marshmallows, fairy lights. Each friend also has one personal item that's part of their quest.

**Key items** gate the story, not just the score:
- **The Lighter**: Maffa's (he's a smoker, so he's the one person who reliably has a lighter, until he doesn't). You can't light the fire pit without it, so there's no finale until it's found. Maffa asks you to find it. If you play as Maffa, you're hunting for your own lighter, and the others tease you about it. It's hidden somewhere fiendish (Binks is the prime suspect). In the prototype it sits at the top of the Grand Staircase.
- More to come, e.g. firewood from the log store, and the corkscrew.

---

## 6. Art direction: turning your photos into 8-bit characters

### Style
- An authentic 8-bit **look** without the hardest limitations of the old machines: a fixed **16-colour palette** (a chunky, warm palette that suits a Victorian country house, plus bright colours for items and NPC clothes), and no colour clash.
- Native resolution **256×192** (a nod to the classic home computers), scaled up in whole-pixel steps so it stays crisp.
- Characters are **16×24 px "big head" sprites** in game: readable, cute, very retro. Plus a **48×48 px portrait** of each character for the character select screen and the dialogue boxes. That's where the likeness to the real people comes through.

### Why not just auto-pixelate the photos
Shrinking a photo to 16 pixels across makes everyone look like the same brown blob. What works:
1. **Portraits (48×48)**: crop each photo to the face, posterise it to the palette with a script, then clean it up by hand (hair shape, glasses, beard, a smile). This is where the likeness lives.
2. **In-game sprites (16×24)**: one shared body template (run, jump, idle, fall animations) and then for each person: hair shape and colour, skin tone, signature outfit colour, and one defining feature (glasses, beard, a hat, a famous jumper). Instantly recognisable to friends even at small size.
3. **Binks**: a dedicated 4-legged sprite with a bouncy run cycle and a "zoomies" animation. Russet-gold coat.

I can do steps 1 and 2 programmatically (scripts plus hand-tuned pixel data), and you can review a "contact sheet" of all 13 before we go further.

### What I need from you
- **For each person**: one clear, front-facing, head-and-shoulders photo in good light, and ideally one full-length photo in a typical outfit.
- **For Binks**: a side-on photo, plus one mid-bounce if you have one!
- **Optionally**: photos of the Hall's rooms you know well (or that are on the website), so the backgrounds feel right.

### Privacy
The real photos are only used as reference to draw the pixel art. **They are never shipped in the game or put on the web.** Only the finished pixel sprites go into the build. Keep the photos in a folder that's excluded from the code repository. Before putting it online, make sure everyone is happy to appear in it. And, if the game is going to be public rather than shared just among the group, ask the Hall's owners about using the Hall's name and layout.

---

## 7. Sound

**Status:** the prototype ships with two short original chiptune loops (title and house), played by a tiny Web Audio sequencer in `src/music.ts`, so there are no licence worries.

**Free tracks to add** (CC0, no credit needed, licences checked on the pages): Zane Little's "A Bag of Chips" pack (https://opengameart.org/node/153320). It covers all our slots: "Post-Adventure Tea Party" (house), "Stumble Around" (fells), "Sinister Abode" (cellar), "100 Victories" (finale). Juhani Junkala's "Chiptune Adventures" loops are an alternative (https://opengameart.org/content/4-chiptunes-adventure).

**Leo's music, made 8-bit:** the best results come from him handing over **MIDI per part** (melody, bass, drums), or failing that separate stems plus tempo and key. Full-mix audio is the worst starting point. Pipeline: MIDI goes straight into FamiStudio (free, MIT, actively maintained), or into our own Web Audio sequencer. If we only have audio: Demucs (stem separation), then Spotify's Basic Pitch (audio to MIDI, one instrument at a time), then tidy up by hand, then render. There's no "make this song 8-bit" AI service worth trusting yet. Things that translate well: a strong single-line melody, triangle-wave bass, arpeggios instead of chords, sparse drums, and 8-16 bar loops. If it's a cover of a copyrighted song, an 8-bit version is still covered by the original's copyright.

- Chiptune sound effects (jump, collect, bump, talk "blips" pitched differently per character) generated with a retro sfx tool.
- A small set of original looping chiptune tracks: house theme, grounds theme, fells theme, a cellar track, and the finale. Each friend could have a 2-bar "theme" that plays when you meet them.
- Mute button always visible (people will play this in bed).

---

## 8. Controls: laptop and phone

### Laptop
- **Arrow keys / A-D**: move. **Space / W / Up**: jump. **E / Enter**: talk. **M**: map. **Esc**: pause.
- Gamepad support (free with the engine).

### Phone (landscape)
Phones are much wider than the 4:3 game screen, so the side spaces become the controls. The touch buttons never cover the game:

```
┌─────────┬───────────────────────────┬─────────┐
│         │                           │  [MAP]  │
│         │                           │         │
│  ◀  ▶   │      GAME (256×192)       │  (TALK) │
│         │                           │  (JUMP) │
└─────────┴───────────────────────────┴─────────┘
```

- **Left side**: left/right buttons (big, a forgiving tap area, with sliding your thumb between them allowed).
- **Right side**: big Jump button, smaller Talk button.
- Multi-touch so you can hold a direction and jump at the same time.
- Haptic tap on jump and bump (where the browser supports it).
- Portrait mode shows a "turn your phone sideways" screen.
- **Installable** to the home screen (as a PWA), works offline, plays full screen.

Jump timing on touch screens is the biggest risk, which is why coyote time and jump buffering are essential, and the level design should avoid pixel-perfect jumps in the main path (save those for optional secret items).

---

## 9. Technology

| Area | Choice | Why |
|---|---|---|
| Engine | **Phaser 4** (TypeScript) | The most widely used 2D web game framework: built-in arcade physics, tilemaps, sprite animation, scaling, touch and gamepad input, sound. Phaser 3.90 is the fallback if any plugin we need isn't ready for 4 yet. |
| Build | **Vite** | Fast dev server, simple static build. |
| Level design | **Tiled** map editor (JSON) | Each room is a Tiled map: tiles, guardian paths, items, NPC spawn points and exits. You could edit rooms yourself if you want. |
| Art | Aseprite or Piskel (free), plus a palette-conversion script | Standard pixel-art tools. |
| Saving | Browser local storage | Progress, unlocked characters, best endings. |
| Hosting | GitHub Pages, Netlify or Cloudflare Pages (free) | A static site; can be put behind a simple password or an unlisted URL if it's just for the group. |

The game is data-driven: rooms, NPCs, dialogue, quests and items live in JSON files, so adding a friend, room or joke doesn't need code changes.

---

## 10. Build phases

1. **Prototype (the feel)**: one character with placeholder art, 4 rooms (Porch, Sitting Room, Kitchen, Staircase), the jump, flip-screen transitions, a guardian, items, and touch controls. **Goal: the jumping feels good on a phone.** Test it on your phone at this point.
2. **Characters**: you supply the photos. I make the 13 sprites and portraits and a contact sheet for you to review. Character select screen.
3. **The house**: all ground and first floor rooms from the floor plan, plus the cellar and attic. Hazards, ropes, conveyors and crumbling floors.
4. **NPCs and quests**: dialogue system, all 12 friends placed with schedules, quests, the couples mechanic, Binks.
5. **The grounds and the fells**: outdoor zone, bonus zone, clock, finale and multiple endings.
6. **Polish**: music, sound, map screen, Cosy/Classic modes, save system, PWA install, performance on older phones.
7. **Playtest weekend**: send the link to the group, collect the bugs and the "you made me look ridiculous" complaints, tune.

A playable first version (phases 1–4, the house with everyone in it) is the first real milestone. Phases 5–6 make it a complete game.

---

## 11. What I need from you to personalise it

The game will be far funnier with real details. For **each friend** (and Binks), 2–3 of these:
- A catchphrase or something they always say.
- A famous habit, hobby, or quirk ("always loses their phone", "can't resist a cheese board", "goes running at 6am").
- Something they'd be most likely to lose or want at a party.
- A running joke or memory from a stay at Brownber.
- What their ability should be, if anything springs to mind.

Plus:
- **Photos** (section 6).
- **Who sleeps in which bedroom** (or I'll assign them).
- **Which of the Hall's actual traditions** to include (fire pit, a particular film night, a games night, a walk up the fells).
- **Who it's for**: just the group (private link) or public?
- **Any no-go areas**: jokes or topics to avoid for anyone.
