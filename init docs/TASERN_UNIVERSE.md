# 🏰 Tales of Tasern - Universe Guide & Styling

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Code Author**: Sam Lavington (Idl3o/@modsias)
**Universe Creator**: James McGee (@JamesMageeCCC) - Dungeon Master

---

## Table of Contents

1. [Universe Overview](#universe-overview)
2. [Visual Design Language](#visual-design-language)
3. [Card Naming Conventions](#card-naming-conventions)
4. [Lore-Based Card Generation](#lore-based-card-generation)
5. [AI Personalities & Lore](#ai-personalities--lore)
6. [CSS Theme System](#css-theme-system)
7. [Asset Guidelines](#asset-guidelines)

---

## Universe Overview

### Tales of Tasern

**Tales of Tasern** is a D&D homebrew universe created and run by Dungeon Master **James McGee (@JamesMageeCCC)**. The universe combines classic fantasy elements with unique lore, memorable characters, and rich storytelling.

### Key Locations

#### **Tasern** (The Kingdom)
- Central kingdom, seat of power
- Medieval fantasy aesthetic
- Knights, nobles, royal court
- Stone castles, banners, heraldry

#### **Kardov** (The Frontier City)
- Border city, rough and tumble
- Guards, mercenaries, adventurers
- Wooden fortifications, muddy streets
- Practical, utilitarian aesthetic

### Key Character Archetypes

- **Paladins** - Holy warriors, divine magic
- **Sentinels** - Guardians, defensive stalwarts
- **Knights** - Martial prowess, cavalry
- **Guards** - City watch, law enforcement
- **Mercenaries** - Hired blades, pragmatic
- **Mages** - Arcane casters, scholars
- **Clerics** - Divine healers, support
- **Rogues** - Sneaky, cunning, dexterous

---

## Visual Design Language

### D&D Medieval Fantasy Aesthetic

**Core Pillars**:
1. **Medieval Immersion** - Stone, wood, metal, parchment
2. **Fantasy Elements** - Magic, creatures, legendary items
3. **Tactile Feel** - Weathered, lived-in, authentic
4. **Heraldic Style** - Crests, banners, emblems

### Color Palette

#### **Primary Colors**
```css
--tasern-bronze: #8B6914;        /* Bronze metallic */
--tasern-gold: #D4AF37;          /* Gold accents */
--tasern-parchment: #F4E4C1;     /* Aged paper */
--tasern-leather: #5C4033;       /* Brown leather */
--tasern-stone: #6B7280;         /* Gray stone */
--tasern-iron: #4A5568;          /* Dark metal */
```

#### **Accent Colors**
```css
--tasern-red: #8B0000;           /* Dark red (danger, fire) */
--tasern-blue: #1E3A8A;          /* Deep blue (water, ice) */
--tasern-green: #065F46;         /* Forest green (nature) */
--tasern-purple: #5B21B6;        /* Royal purple (magic) */
--tasern-amber: #92400E;         /* Amber (warning, earth) */
```

#### **UI Colors**
```css
--bg-primary: #1A1410;           /* Dark background */
--bg-secondary: #2D2416;         /* Card backgrounds */
--text-primary: #F4E4C1;         /* Light text */
--text-secondary: #D4AF37;       /* Gold highlights */
--border-color: #8B6914;         /* Bronze borders */
```

### Typography

#### **Primary Font: Cinzel**
Used for: Headings, card names, important text
```css
font-family: 'Cinzel', serif;
font-weight: 700;
letter-spacing: 0.05em;
text-transform: uppercase;
```

#### **Secondary Font: Crimson Text**
Used for: Body text, descriptions, lore
```css
font-family: 'Crimson Text', serif;
font-weight: 400;
line-height: 1.6;
```

#### **Accent Font: Uncial Antiqua**
Used for: Special callouts, ancient text, runes
```css
font-family: 'Uncial Antiqua', cursive;
font-weight: 400;
font-size: 1.2em;
```

### Visual Effects

#### **Text Shadows**
```css
/* Bronze glow for headings */
text-shadow: 0 0 10px rgba(212, 175, 55, 0.5),
             0 0 20px rgba(139, 105, 20, 0.3);

/* Parchment depth for body text */
text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
```

#### **Box Shadows**
```css
/* Card elevation */
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3),
            0 1px 3px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);

/* Glowing hover effect */
box-shadow: 0 0 20px rgba(212, 175, 55, 0.6),
            0 0 40px rgba(139, 105, 20, 0.4);
```

#### **Borders**
```css
/* Ornate border */
border: 2px solid var(--tasern-bronze);
border-image: linear-gradient(
  45deg,
  var(--tasern-bronze),
  var(--tasern-gold),
  var(--tasern-bronze)
) 1;

/* Weathered edge */
border: 3px solid var(--tasern-leather);
border-radius: 8px;
filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
```

### Background Patterns

#### **Parchment Texture**
```css
background: linear-gradient(
  135deg,
  #F4E4C1 0%,
  #E8D4A8 50%,
  #F4E4C1 100%
);
background-image: url('data:image/svg+xml,...'); /* Paper fiber texture */
```

#### **Stone Texture**
```css
background: linear-gradient(
  180deg,
  #6B7280 0%,
  #4B5563 100%
);
/* Add noise/grain for stone feel */
```

#### **Leather Texture**
```css
background: linear-gradient(
  45deg,
  #5C4033 0%,
  #3E2723 50%,
  #5C4033 100%
);
/* Add subtle grain pattern */
```

---

## Card Naming Conventions

### Naming Patterns for Dynamic Generation

#### **Strategic Mode: Aggressive**
Pattern: `[Action Verb] + [Creature/Type]`

Examples:
- Charging Warbeast
- Blitz Striker
- Fury Knight
- Rampage Beast
- Storm Raider
- Savage Berserker
- Lightning Assault
- Blazing Vanguard
- Thunder Warrior
- Crushing Champion

#### **Strategic Mode: Defensive**
Pattern: `[Defensive Adjective] + [Guardian/Protector]`

Examples:
- Stalwart Guardian
- Wall of Stone
- Shield Bearer
- Fortified Defender
- Bastion Keeper
- Iron Sentinel
- Steadfast Bulwark
- Unyielding Protector
- Granite Warden
- Immovable Wall

#### **Strategic Mode: Adaptive**
Pattern: `[Tactical Adjective] + [Versatile Role]`

Examples:
- Tactical Mercenary
- Swift Strategist
- Adaptive Warrior
- Clever Scout
- Versatile Fighter
- Cunning Operative
- Agile Duelist
- Resourceful Ranger
- Sharp-Minded Tactician
- Quick-Thinking Soldier

#### **Strategic Mode: Experimental**
Pattern: `[Magical/Chaotic Adjective] + [Unpredictable Type]`

Examples:
- Arcane Experiment
- Wild Innovator
- Chaos Conjurer
- Unpredictable Mage
- Rogue Alchemist
- Erratic Sorcerer
- Volatile Enchanter
- Unstable Warlock
- Whimsical Trickster
- Bizarre Illusionist

#### **Strategic Mode: Desperate**
Pattern: `[Last Stand Phrase] + [Hero/Champion]`

Examples:
- Last Stand Hero
- Desperate Gambit
- Final Hope
- Cornered Beast
- Do-or-Die Champion
- All-or-Nothing Warrior
- Back-to-the-Wall Fighter
- Final Hour Defender
- Last Resort Knight
- Dying Light Paladin

### Lore-Based Names

#### **From Tasern (Royal/Noble)**
- Sir [Name] the [Virtue]
  - Sir Bramble the Brave
  - Sir Thornwick the Wise
  - Sir Galahad the Pure
  - Sir Cedric the Bold

- Lady [Name] [Title]
  - Lady Swiftblade
  - Lady Moonwhisper
  - Lady Ashenheart
  - Lady Stormborn

#### **From Kardov (Rough/Practical)**
- [Name] [Descriptor]
  - Grok the Unpredictable
  - Thrain the Ironhanded
  - Bjorn the Unyielding
  - Magnus the Mountain

- Guards of [Location]
  - Guards of Kardov
  - Sentinels of the Gate
  - Watchmen of the Wall
  - Defenders of the March

#### **Magical Entities**
- [Title] [Name] [Domain]
  - Archmagus Nethys
  - Oracle Seraphina
  - Elementalist Zara
  - Necromancer Malthus

---

## Lore-Based Card Generation

### Identifying Tales of Tasern NFTs

**Pattern Recognition** (for smart NFT detection):

```typescript
const TASERN_LORE_PATTERNS = {
  locations: [
    'tasern', 'kardov', 'the march', 'the borderlands',
    'castle', 'keep', 'citadel', 'fortress'
  ],

  classes: [
    'paladin', 'knight', 'sentinel', 'guard',
    'mage', 'wizard', 'sorcerer', 'warlock',
    'cleric', 'priest', 'druid', 'ranger',
    'rogue', 'assassin', 'thief', 'scout',
    'warrior', 'fighter', 'barbarian', 'champion',
    'mercenary', 'soldier', 'veteran'
  ],

  titles: [
    'sir', 'lady', 'lord', 'baron', 'duke',
    'archmagus', 'high priest', 'grand', 'master',
    'captain', 'commander', 'general', 'marshal'
  ],

  fantasyTerms: [
    'dragon', 'beast', 'elemental', 'demon', 'angel',
    'undead', 'spirit', 'guardian', 'keeper', 'warden',
    'blade', 'shield', 'hammer', 'staff', 'bow'
  ]
};

function isTasernNFT(nftName: string, nftDescription: string): boolean {
  const text = `${nftName} ${nftDescription}`.toLowerCase();

  // Check for location mentions
  const hasLocation = TASERN_LORE_PATTERNS.locations.some(loc =>
    text.includes(loc)
  );

  // Check for class/archetype
  const hasClass = TASERN_LORE_PATTERNS.classes.some(cls =>
    text.includes(cls)
  );

  // Check for title
  const hasTitle = TASERN_LORE_PATTERNS.titles.some(title =>
    text.includes(title)
  );

  // Check for fantasy terms
  const hasFantasyTerm = TASERN_LORE_PATTERNS.fantasyTerms.some(term =>
    text.includes(term)
  );

  // Needs at least 2 matches to be confident
  const matches = [hasLocation, hasClass, hasTitle, hasFantasyTerm]
    .filter(Boolean).length;

  return matches >= 2;
}
```

### Dynamic Description Generation

```typescript
function generateCardDescription(
  card: GameCard,
  strategicMode: StrategicMode
): string {
  const modeDescriptions = {
    aggressive: [
      'A fierce warrior charging into battle.',
      'Strikes with overwhelming force.',
      'No mercy, no retreat, only victory.',
      'Born for the thrill of combat.'
    ],
    defensive: [
      'An unyielding guardian of the realm.',
      'Stands firm against any assault.',
      'Protection is the highest duty.',
      'A wall that shall not fall.'
    ],
    adaptive: [
      'A versatile combatant ready for anything.',
      'Adapts tactics to any situation.',
      'Clever and resourceful in battle.',
      'Thinks as quickly as they strike.'
    ],
    experimental: [
      'Unpredictable and dangerous magic.',
      'Chaos incarnate on the battlefield.',
      'Innovation through arcane madness.',
      'Never the same strategy twice.'
    ],
    desperate: [
      'Fighting with nothing left to lose.',
      'When all hope fades, they remain.',
      'The last stand of a true hero.',
      'Desperation breeds determination.'
    ]
  };

  const descriptions = modeDescriptions[strategicMode];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}
```

---

## AI Personalities & Lore

### The Five Opponents

#### **1. Sir Stumbleheart**
```typescript
{
  name: 'Sir Stumbleheart',
  title: 'The Noble Blunderer',
  lore: `A well-meaning knight of Tasern who combines genuine
         bravery with spectacularly creative mistakes. His heart
         is pure, his sword arm strong, but his tactics...
         questionable at best.`,
  voiceLines: [
    "For honor and... wait, what was I doing?",
    "A tactical retreat! (He tripped)",
    "That was EXACTLY my plan!",
    "Chivalry demands I... oh no."
  ],
  aesthetic: 'Bronze armor, dented shield, slightly singed tabard'
}
```

#### **2. Lady Swiftblade**
```typescript
{
  name: 'Lady Swiftblade',
  title: 'The Lightning Duelist',
  lore: `A master swordswoman from the noble houses of Tasern.
         She strikes like lightning and takes audacious risks.
         Every duel is a dance, every battle a performance.`,
  voiceLines: [
    "Too slow!",
    "Speed is the ultimate weapon.",
    "You can't hit what you can't catch!",
    "Let's make this interesting."
  ],
  aesthetic: 'Silver rapier, flowing cape, elegant armor'
}
```

#### **3. Thornwick the Tactician**
```typescript
{
  name: 'Thornwick the Tactician',
  title: 'The Chess Master',
  lore: `A veteran commander who has studied every battle in
         Tasern's history. Patient, methodical, and devastatingly
         effective. He plays war like chess, three moves ahead.`,
  voiceLines: [
    "Just as I calculated.",
    "Patience wins wars.",
    "You're playing checkers. I'm playing chess.",
    "Every move has a purpose."
  ],
  aesthetic: 'War table, maps, strategic insignia, graying beard'
}
```

#### **4. Grok the Unpredictable**
```typescript
{
  name: 'Grok the Unpredictable',
  title: 'The Chaos Warrior',
  lore: `A barbarian from the borderlands who fights with wild
         abandon. No one, including Grok, knows what he'll do next.
         This makes him both terrifying and occasionally hilarious.`,
  voiceLines: [
    "GROK SMASH!",
    "What doing? GROK not know! EXCITING!",
    "Maybe hit? Maybe run? GROK DECIDE LATER!",
    "This good plan or bad plan? WHO CARES!"
  ],
  aesthetic: 'Mismatched armor, multiple weapons, wild hair'
}
```

#### **5. Archmagus Nethys**
```typescript
{
  name: 'Archmagus Nethys',
  title: 'Master of the Arcane',
  lore: `The court wizard of Tasern, ancient and impossibly skilled.
         He sees battle as an arcane puzzle to be solved with elegant
         magical solutions. Every spell is perfectly placed.`,
  voiceLines: [
    "Fascinating magical resonance.",
    "Let me demonstrate proper spellwork.",
    "Magic is an art, not a weapon.",
    "You're about to learn something."
  ],
  aesthetic: 'Star-covered robes, floating tomes, staff crackling with power'
}
```

---

## CSS Theme System

### Complete Theme Implementation

```css
/* ========================================
   TASERN UNIVERSE THEME
   Medieval D&D Fantasy
   ======================================== */

:root {
  /* Primary Palette */
  --tasern-bronze: #8B6914;
  --tasern-gold: #D4AF37;
  --tasern-parchment: #F4E4C1;
  --tasern-leather: #5C4033;
  --tasern-stone: #6B7280;
  --tasern-iron: #4A5568;

  /* Accent Colors */
  --tasern-red: #8B0000;
  --tasern-blue: #1E3A8A;
  --tasern-green: #065F46;
  --tasern-purple: #5B21B6;
  --tasern-amber: #92400E;

  /* UI Colors */
  --bg-primary: #1A1410;
  --bg-secondary: #2D2416;
  --bg-tertiary: #3E3020;
  --text-primary: #F4E4C1;
  --text-secondary: #D4AF37;
  --text-muted: #9CA3AF;
  --border-color: #8B6914;
  --hover-color: #D4AF37;

  /* Rarity Colors */
  --rarity-common: #9CA3AF;
  --rarity-rare: #3B82F6;
  --rarity-epic: #8B5CF6;
  --rarity-legendary: #F59E0B;

  /* Typography */
  --font-heading: 'Cinzel', serif;
  --font-body: 'Crimson Text', serif;
  --font-accent: 'Uncial Antiqua', cursive;
}

/* Global Styles */
body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-body);
  line-height: 1.6;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.5),
               0 0 20px rgba(139, 105, 20, 0.3);
}

/* Card Styling */
.card {
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 100%
  );
  border: 2px solid var(--tasern-bronze);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3),
              0 1px 3px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.6),
              0 0 40px rgba(139, 105, 20, 0.4);
}

.card-name {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-description {
  font-family: var(--font-body);
  font-size: 0.9rem;
  color: var(--text-primary);
  font-style: italic;
}

/* Rarity Borders */
.card.common { border-color: var(--rarity-common); }
.card.rare { border-color: var(--rarity-rare); }
.card.epic { border-color: var(--rarity-epic); }
.card.legendary {
  border-color: var(--rarity-legendary);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
}

/* Battle Board */
.battle-board {
  background:
    linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
    url('/assets/textures/stone-texture.jpg');
  background-size: cover;
  border: 3px solid var(--tasern-stone);
  border-radius: 12px;
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.8);
}

.battle-cell {
  background: rgba(107, 114, 128, 0.2);
  border: 1px solid rgba(139, 105, 20, 0.3);
  transition: background 0.2s;
}

.battle-cell:hover {
  background: rgba(212, 175, 55, 0.2);
  border-color: var(--tasern-gold);
}

/* Weather Display */
.weather-display {
  background: linear-gradient(
    90deg,
    rgba(139, 105, 20, 0.8),
    rgba(212, 175, 55, 0.8)
  );
  border: 2px solid var(--tasern-gold);
  border-radius: 8px;
  padding: 1rem;
  font-family: var(--font-accent);
  text-align: center;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
}

/* Mana Display */
.mana-display {
  color: var(--tasern-blue);
  font-family: var(--font-heading);
  font-weight: 700;
  text-shadow: 0 0 10px rgba(30, 58, 138, 0.8);
}

/* HP Display */
.hp-display {
  color: var(--tasern-red);
  font-family: var(--font-heading);
  font-weight: 700;
  text-shadow: 0 0 10px rgba(139, 0, 0, 0.8);
}

/* Button Styling */
.btn-primary {
  background: linear-gradient(
    135deg,
    var(--tasern-bronze) 0%,
    var(--tasern-gold) 100%
  );
  border: 2px solid var(--tasern-gold);
  color: var(--bg-primary);
  font-family: var(--font-heading);
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.8);
}

/* Battle Log */
.battle-log {
  background: rgba(244, 228, 193, 0.1);
  border: 2px solid var(--tasern-leather);
  border-radius: 8px;
  padding: 1rem;
  font-family: var(--font-body);
  max-height: 400px;
  overflow-y: auto;
}

.battle-log-entry {
  padding: 0.5rem;
  border-bottom: 1px solid rgba(139, 105, 20, 0.2);
  font-size: 0.9rem;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--tasern-bronze);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--tasern-gold);
}

/* Animations */
@keyframes card-deploy {
  0% {
    opacity: 0;
    transform: translateY(-50px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes attack-flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes damage-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.card-deploying {
  animation: card-deploy 0.5s ease-out;
}

.card-attacking {
  animation: attack-flash 0.3s ease-in-out;
}

.card-taking-damage {
  animation: damage-shake 0.3s ease-in-out;
}
```

---

## Asset Guidelines

### Card Art Style

**Preferred Style**: Medieval fantasy illustration
- Hand-drawn or painted aesthetic
- Rich colors, dramatic lighting
- Character-focused (not abstract)
- Clear silhouette for card readability

**Dimensions**:
- Card image: 300x400px (3:4 ratio)
- Icon/avatar: 100x100px (square)
- Background: 1920x1080px (16:9 ratio)

**File Formats**:
- PNG with transparency for cards
- JPEG for backgrounds
- SVG for icons/UI elements

### Icon Set

**Card Stats Icons**:
- ⚔️ Attack - Crossed swords
- ❤️ HP - Heart/shield
- ⚡ Speed - Lightning bolt
- 🛡️ Defense - Shield
- 💎 Mana - Crystal/gem

**Rarity Gems**:
- Common: Gray stone
- Rare: Blue sapphire
- Epic: Purple amethyst
- Legendary: Gold/orange topaz

### Background Layers

**Battle Scene Layers** (for parallax):
1. Sky/horizon (furthest)
2. Mountains/distant terrain
3. Castle/buildings
4. Battlefield grid
5. Weather effects (rain, fog, etc.)
6. Foreground elements (banners, debris)

---

## Implementation Examples

### Card Component with Tasern Styling

```typescript
interface CardProps {
  card: GameCard;
  onClick?: () => void;
}

export function TasernCard({ card, onClick }: CardProps) {
  const rarityClass = `card-${card.rarity}`;

  return (
    <div
      className={`tasern-card ${rarityClass}`}
      onClick={onClick}
    >
      {/* Header with name and mana */}
      <div className="card-header">
        <span className="card-name">{card.name}</span>
        <span className="mana-display">💎 {card.manaCost}</span>
      </div>

      {/* Card art */}
      <div className="card-image">
        {card.image ? (
          <img src={card.image} alt={card.name} />
        ) : (
          <div className="card-placeholder">
            {/* Procedural art or default image */}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="card-stats">
        <div className="stat">
          <span className="stat-icon">⚔️</span>
          <span className="stat-value">{card.attack}</span>
        </div>
        <div className="stat">
          <span className="stat-icon">❤️</span>
          <span className="stat-value">{card.hp}</span>
        </div>
        <div className="stat">
          <span className="stat-icon">⚡</span>
          <span className="stat-value">{card.speed}</span>
        </div>
      </div>

      {/* Description */}
      <div className="card-description">
        {card.description}
      </div>

      {/* Abilities */}
      {card.abilities.length > 0 && (
        <div className="card-abilities">
          {card.abilities.map(ability => (
            <div key={ability.name} className="ability-badge">
              {ability.name}
            </div>
          ))}
        </div>
      )}

      {/* Rarity indicator */}
      <div className="card-rarity">
        <span className="rarity-gem"></span>
        <span className="rarity-text">{card.rarity}</span>
      </div>
    </div>
  );
}
```

### Weather Display Component

```typescript
interface WeatherDisplayProps {
  weather: WeatherEffect | null;
}

export function WeatherDisplay({ weather }: WeatherDisplayProps) {
  if (!weather) return null;

  const weatherIcons = {
    CLEAR: '☀️',
    RAIN: '🌧️',
    STORM: '⛈️',
    FOG: '🌫️',
    SNOW: '❄️'
  };

  const weatherDescriptions = {
    CLEAR: 'Clear skies, normal conditions',
    RAIN: 'Rainfall dampens attacks (-10%)',
    STORM: 'Raging storm hinders combat (-20% attack)',
    FOG: 'Thick fog obscures vision (-15% attack, +10% defense)',
    SNOW: 'Heavy snow slows movement (-15% speed)'
  };

  return (
    <div className="weather-display">
      <span className="weather-icon">{weatherIcons[weather.type]}</span>
      <span className="weather-name">{weather.type}</span>
      <span className="weather-description">
        {weatherDescriptions[weather.type]}
      </span>
      <span className="weather-duration">
        {weather.duration} turns remaining
      </span>
    </div>
  );
}
```

---

## Future Expansions

### Potential Locations to Add

- **The Shadowfen** - Dark swamps, necromantic themes
- **Skyreach Mountains** - High peaks, dragon lairs
- **The Emerald Vale** - Lush forests, druidic magic
- **Port Stormhaven** - Coastal city, pirates and sailors
- **The Ashen Wastes** - Volcanic badlands, fire elementals

### Potential Character Classes

- **Bard** - Support/buffing abilities
- **Monk** - Unarmed combat, speed focus
- **Artificer** - Mechanical constructs
- **Warlock** - Dark pacts, unique abilities
- **Summoner** - Brings additional units

### Seasonal Themes

- **Spring Festival** - Bright colors, nature magic
- **Summer Solstice** - Solar themes, light magic
- **Autumn Harvest** - Earth tones, abundance
- **Winter Solstice** - Ice themes, survival

---

**This is the visual soul of Tales of Tasern. Every card, every effect, every animation should feel like it belongs in James's D&D universe.** 🏰

**When in doubt**: *Would this fit at a D&D table? Does it honor the lore? Does it feel medieval fantasy?*

If yes to all three - it's Tasern. ⚔️
