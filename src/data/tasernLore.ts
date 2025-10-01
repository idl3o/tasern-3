/**
 * Tales of Tasern Lore Database
 *
 * The living world created by Dungeon Master James McGee (@JamesMageeCCC).
 * Every card name, every description honors this universe.
 *
 * This is NOT game logic - this is pure data that gives cards soul.
 */

export const TASERN_LORE = {
  // Regions and Realms of Tasern
  regions: [
    'Kardov',
    'Ironhold',
    'Shadowmere',
    'Brightlands',
    'Thornwood',
    'Stormwatch',
    'Goldenhaven',
    'Dragonspire',
    'Frostpeak',
    'Voidlands',
  ] as const,

  // Factions and Organizations
  factions: [
    'Sentinels of Kardov',
    'Ironhold Guard',
    'Forest Spirits',
    'Stone Wardens',
    'Crystal Mages',
    'Shadow Brotherhood',
    'Golden Order',
    'Storm Riders',
    'Frost Clan',
    'Void Touched',
  ] as const,

  // Character Types
  characterTypes: [
    'Sentinel',
    'Guardian',
    'Mystic',
    'Archer',
    'Warrior',
    'Mage',
    'Construct',
    'Spirit',
    'Ranger',
    'Paladin',
    'Assassin',
    'Druid',
  ] as const,

  // Magical Elements
  elements: [
    'Earth',
    'Forest',
    'Crystal',
    'Shadow',
    'Light',
    'Storm',
    'Frost',
    'Void',
    'Fire',
    'Wind',
  ] as const,

  // Creature Types
  creatures: [
    'Elemental',
    'Construct',
    'Beast',
    'Dragon',
    'Golem',
    'Wisp',
    'Shade',
    'Griffin',
    'Wolf',
    'Phoenix',
  ] as const,

  // Artifacts and Equipment
  artifacts: [
    'Blade',
    'Staff',
    'Shield',
    'Orb',
    'Tome',
    'Crown',
    'Ring',
    'Amulet',
    'Cloak',
    'Gauntlets',
  ] as const,
} as const;

/**
 * Card naming templates that honor Tasern lore
 */
export interface CardNamingTemplate {
  namePattern: string[];
  descriptionPattern: string[];
}

export const CARD_NAMING_TEMPLATES = {
  sentinel: {
    namePattern: [
      '{region} Sentinel',
      '{element} Guardian',
      'Keeper of {region}',
      '{faction} Defender',
    ],
    descriptionPattern: [
      'A stalwart defender from the {region} realm, sworn to protect the ancient towers.',
      'This {element} guardian has stood watch for centuries, empowered by sacred duty.',
      'Elite warrior of the {faction}, trained in the ancient arts of siege defense.',
      'Blessed by the spirits of {region}, this sentinel never yields in battle.',
    ],
  },

  mystic: {
    namePattern: [
      '{element} Mystic',
      '{region} Sage',
      'Arcane {characterType}',
      'Master of {element}',
    ],
    descriptionPattern: [
      'A powerful mage who has mastered the {element} arts through years of study.',
      'This wise {characterType} channels the ancient magics of {region}.',
      'Keeper of forbidden knowledge, wielding {element} magic with deadly precision.',
      'A scholar-warrior from {faction}, blending sword and sorcery.',
    ],
  },

  construct: {
    namePattern: [
      '{element} Golem',
      '{region} Construct',
      'Ancient {artifact}bearer',
      '{element} Automaton',
    ],
    descriptionPattern: [
      'An ancient construct forged from {element} magic, powered by DDD energy.',
      'This mechanical guardian was built to defend {region} from eternal threats.',
      'A creation of the old masters, infused with {element} essence.',
      'Tireless sentinel of stone and magic, animated by ancient rituals.',
    ],
  },

  creature: {
    namePattern: [
      '{element} {creature}',
      'Wild {creature}',
      '{region} {creature}',
      'Ancient {creature}',
    ],
    descriptionPattern: [
      'A majestic {creature} native to the wilds of {region}.',
      'This {element}-touched {creature} serves as mount and ally to worthy heroes.',
      'Fierce predator of the {region} wilderness, bonded through ancient pacts.',
      'A legendary {creature} said to appear only in times of great need.',
    ],
  },

  // AI Mode-specific templates
  aggressive: {
    namePattern: [
      'Charging {creature}',
      'Fury {characterType}',
      'Blitz {element} Striker',
      'Raging {region} Warrior',
    ],
    descriptionPattern: [
      'This aggressive {creature} charges into battle with reckless abandon.',
      'Fueled by rage and {element} power, this warrior knows no fear.',
      'A berserker from {region}, driven by bloodlust and glory.',
    ],
  },

  defensive: {
    namePattern: [
      'Stalwart {characterType}',
      'Wall of {element}',
      'Iron {region} Sentinel',
      '{element} Bulwark',
    ],
    descriptionPattern: [
      'An immovable defender, rooted like the mountains of {region}.',
      'This {element} guardian shields allies with unwavering resolve.',
      'Trained in the defensive arts of {faction}, impenetrable and patient.',
    ],
  },

  adaptive: {
    namePattern: [
      'Tactical {characterType}',
      'Swift {element} Strategist',
      'Clever {region} Scout',
      'Versatile {faction} Agent',
    ],
    descriptionPattern: [
      'A tactical genius from {region}, adapting to any battlefield.',
      'This {element} warrior reads the flow of battle and responds perfectly.',
      'Trained by {faction} to excel in any situation.',
    ],
  },

  experimental: {
    namePattern: [
      'Arcane {element} Experiment',
      'Chaos {creature}',
      'Wild {region} Innovator',
      'Strange {artifact}bearer',
    ],
    descriptionPattern: [
      'The result of forbidden experiments in {region}, unpredictable and powerful.',
      'This {element} creation defies conventional magic.',
      'A chaos-touched entity from the {faction} archives.',
    ],
  },

  desperate: {
    namePattern: [
      'Last Stand {characterType}',
      'Final {element} Hope',
      'Do-or-Die {region} Champion',
      'Sacrificial {creature}',
    ],
    descriptionPattern: [
      'When all seems lost, this {region} hero emerges.',
      'Fueled by desperation and {element} magic, fighting to the last breath.',
      'A final gambit from {faction}, risking everything.',
    ],
  },
} as const;

/**
 * Helper to get random element from array
 */
export function randomChoice<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Fill template with random lore elements
 */
export function fillLoreTemplate(template: string): string {
  let result = template;

  // Replace each placeholder with random lore element
  result = result.replace(/{region}/g, randomChoice(TASERN_LORE.regions));
  result = result.replace(/{faction}/g, randomChoice(TASERN_LORE.factions));
  result = result.replace(/{element}/g, randomChoice(TASERN_LORE.elements));
  result = result.replace(/{characterType}/g, randomChoice(TASERN_LORE.characterTypes));
  result = result.replace(/{creature}/g, randomChoice(TASERN_LORE.creatures));
  result = result.replace(/{artifact}/g, randomChoice(TASERN_LORE.artifacts));

  return result;
}

/**
 * Generate lore-rich name based on template
 */
export function generateLoreName(templateKey: string): string {
  const template = CARD_NAMING_TEMPLATES[templateKey as keyof typeof CARD_NAMING_TEMPLATES];
  if (!template) {
    return 'Unknown Entity';
  }

  const nameTemplate = randomChoice(template.namePattern) as string;
  return fillLoreTemplate(nameTemplate);
}

/**
 * Generate lore-rich description based on template
 */
export function generateLoreDescription(templateKey: string): string {
  const template = CARD_NAMING_TEMPLATES[templateKey as keyof typeof CARD_NAMING_TEMPLATES];
  if (!template) {
    return 'A mysterious entity from the Tales of Tasern.';
  }

  const descTemplate = randomChoice(template.descriptionPattern) as string;
  return fillLoreTemplate(descTemplate);
}
