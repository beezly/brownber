// Every friend has one ability, taken from their real-life quirk.
// Active abilities use the POWER button (X / Shift on a keyboard); passive ones are always on.

export type AbilityId =
  | 'late' // Beth
  | 'keyboard' // Curtis
  | 'fetch' // Tom
  | 'liedown' // Luke
  | 'laser' // Maffa
  | 'tidy' // Debra
  | 'stuff' // Beez
  | 'panic' // Nick
  | 'tacos' // Karla
  | 'chord' // Leo
  | 'glide' // Sophie
  | 'pint' // Jonny
  | 'quiz' // Becca
  | 'sniff'; // Binks

export interface AbilityDef {
  name: string;
  desc: string;
  active: boolean;
  duration: number; // frames the effect lasts (active abilities)
  cooldown: number; // frames before it can be used again (counted from activation)
}

export const ABILITIES: Record<AbilityId, AbilityDef> = {
  late: { name: 'Five More Minutes', desc: 'Slows the whole world down. She is late anyway.', active: true, duration: 300, cooldown: 720 },
  keyboard: { name: 'Keyboard Solo', desc: 'Everyone stops to listen. Guardians freeze.', active: true, duration: 200, cooldown: 720 },
  fetch: { name: 'Here, Binks!', desc: 'Binks follows you, and fetches the nearest item.', active: true, duration: 0, cooldown: 600 },
  liedown: { name: 'Little Lie Down', desc: 'Lie down. Nothing can hurt you. Binks follows you.', active: true, duration: 0, cooldown: 30 },
  laser: { name: 'Laser Pointer', desc: 'Binks and the hoover chase the red dot.', active: true, duration: 300, cooldown: 600 },
  tidy: { name: 'Tidy Up', desc: 'Items nearby fly to you. She cannot help tidying.', active: false, duration: 0, cooldown: 0 },
  stuff: { name: 'Leaves Stuff Around', desc: 'Drops a pile of stuff to stand on. Stack them!', active: true, duration: 0, cooldown: 20 },
  panic: { name: 'Panic!', desc: 'Runs like it is raining. Double speed for a bit.', active: true, duration: 200, cooldown: 600 },
  tacos: { name: 'Taco Shield', desc: 'Awesome Mexican food: survive one hit. Recharges.', active: false, duration: 0, cooldown: 900 },
  chord: { name: 'Power Chord', desc: 'Strum in mid-air for a double jump.', active: false, duration: 0, cooldown: 0 },
  glide: { name: 'Cockatiel Glide', desc: 'Hold jump while falling to glide.', active: false, duration: 0, cooldown: 0 },
  pint: { name: 'Pint?', desc: 'Puts down a pint. Guardians stop to have it.', active: true, duration: 420, cooldown: 600 },
  sniff: { name: 'Super Sniffer', desc: 'Nose to the ground: scent trails lead to treats and lost humans.', active: true, duration: 260, cooldown: 420 },
  quiz: { name: 'Quiz Whizz', desc: 'Knows exactly where the nearest item is.', active: true, duration: 200, cooldown: 360 },
};
