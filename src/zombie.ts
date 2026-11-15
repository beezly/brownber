// ZOMBIE NIGHT: shared data for the zombie mode.
// Friends turn into (friendly, daft) zombies. Bring each one their favourite thing to cure them.

/** The item that cures each friend. Keys are item sprite names (item_<key>). */
export const CURES: Record<string, string> = {
  beth: 'mirror', // getting ready (still)
  curtis: 'keyboard',
  tom: 'mic', // for the speeches
  luke: 'blanket', // a little lie down
  maffa: 'porkpie',
  debra: 'duster', // tidying
  beez: 'phone', // he lost it, obviously
  nick: 'umbrella', // in case it rains
  karla: 'taco',
  leo: 'plectrum',
  sophie: 'tea',
  jonny: 'pint',
  becca: 'trophy', // quiz champion
};

/**
 * In zombie mode some item slots hold different items, so every cure can be found.
 * room id -> item index (reading order of '*') -> item key.
 */
export const ZOMBIE_ITEM_OVERRIDES: Record<string, Record<number, string>> = {
  kitchen: { 1: 'pint' },
  drive: { 2: 'umbrella' },
  cellar: { 1: 'plectrum' },
  attic: { 2: 'trophy' },
  pantry: { 2: 'duster' },
  bathroom: { 0: 'mirror', 1: 'phone' },
  drawing: { 0: 'cracker' },
  dining: { 2: 'mic' },
};

/** What a friend says once cured. */
export const CURED_LINES: Record<string, string[]> = {
  beth: ['Urgh... is it 11:45 already? I just need five more minutes to get un-zombied.'],
  curtis: ['My keyboard! I was groaning in B flat minor, did you notice?'],
  tom: ['Can I just say... thank you. You are a legend. A credit to the living.'],
  luke: ['Mmm, blanket. Being a zombie is exhausting. Time for a lie down.'],
  maffa: ['A pork pie! I was dreaming of brains, but this is better. Got a glass of milk?'],
  debra: ['A duster! Look at the state of this place. Zombies are SO messy.'],
  beez: ['My phone! Wait... where did I leave my keys? And my other shoe?'],
  nick: ['An umbrella! Thumbs up! Is it raining? Has it stopped? Thumbs up!'],
  karla: ['Taco? Is that one of mine? It cured me. Of course it did.'],
  leo: ['My plectrum! I feel a song coming on. "Zombie Dawn in the Dales".'],
  sophie: ['Tea! Proper tea! The cockatiel will be so relieved.'],
  jonny: ['Pint! Cheers! Best pint I have ever had. Do zombies get hangovers?'],
  becca: ['My quiz trophy! Question: what is a zombie\'s favourite food? ...Me, apparently.'],
};

export const ZOMBIE_START = 20 * 60; // 8pm
export const ZOMBIE_DAWN = 30 * 60; // 6am (the clock just keeps counting past midnight)
