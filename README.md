# 🏰 Tasern Siegefront 🦋

**Consciousness-driven tactical NFT card battle game**
*Set in the Tales of Tasern D&D universe by James McGee*

---

## What Makes This Special

This isn't just another card game. **Tasern Siegefront** explores what happens when AI is given personality, intentionality, and the freedom to make interesting mistakes.

### 🧠 Consciousness AI

Six-step decision loop where AI opponents:
- **Heal** - Validate and repair state corruption
- **Self-Aware** - Check confidence, detect being stuck
- **Analyze** - Determine strategic mode (aggressive/defensive/adaptive/desperate/experimental)
- **Generate** - Create cards dynamically in response to the battlefield
- **Score & Choose** - Evaluate with 30% variance from optimal
- **Record** - Build memory for learning

### ✨ Dynamic Card Generation

AI players don't have decks. They **manifest cards** based on:
- Current battlefield state
- Their personality traits
- Strategic mode
- Available mana

Every card is generated on-demand. Every battle is unique.

### 🎭 Five Distinct Personalities

From the Tales of Tasern universe:

- **Sir Stumbleheart** - The Noble Blunderer (creative but chaotic)
- **Lady Swiftblade** - The Lightning Duelist (aggressive rushdown)
- **Thornwick** - The Chess Master (calculated, optimal)
- **Grok** - The Chaos Warrior (completely unpredictable)
- **Archmagus Nethys** - Master of the Arcane (experimental magic)

Each feels genuinely different to play against.

---

## Architecture Philosophy

Built with **strict separation of concerns** learned from a previous build:

### ✅ The Five Commandments

1. **No state mutation** - Always immutable updates via Immer
2. **No type checking players** - Strategy pattern exclusively
3. **No 'any' types** - Strict TypeScript, proper unions
4. **No business logic in React** - Components dispatch actions only
5. **No circular dependencies** - One-way data flow

### 🏗️ Structure

```
src/
├── types/          # Core type system (no 'any' allowed!)
├── core/           # Pure game logic (BattleEngine, PlayerFactory)
├── ai/             # ConsciousnessAI, CardGenerator, personalities
├── strategies/     # Strategy pattern (Human, AI)
├── state/          # Zustand store with Immer
├── components/     # React UI (presentation only)
└── demo/           # Test battles
```

### 🎯 Strategy Pattern - The Golden Rule

**NEVER** check player type with conditionals:

```typescript
// ✅ CORRECT
const cards = player.strategy.getAvailableCards(player, state);

// ❌ WRONG - Do not do this anywhere!
if (player.type === 'ai') {
  cards = generateCards();
}
```

This keeps Human vs AI vs future Multiplayer a clean abstraction.

---

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Test Battle (AI vs AI)

```bash
npm run demo:battle
```

Watch Lady Swiftblade battle Thornwick the Tactician in pure console glory!

### Development Server

```bash
npm start
```

### Build for Production

```bash
npm run build
```

---

## Core Mechanics

### ⚔️ Battle Flow

1. Players deploy cards to 3x3 battlefield
2. Cards attack enemies or castle
3. Formations grant bonuses (Vanguard, Phalanx, etc.)
4. Weather effects modify all cards
5. First to destroy enemy castle wins

### 🎲 Victory Conditions

- **Castle Destruction** - Reduce enemy castle to 0 HP
- **Resource Exhaustion** - Human players run out of cards
- **Turn Limit** - Highest castle HP wins after 50 turns

### 🌦️ Weather Effects

Global modifiers lasting 3-5 turns:
- **Clear** ☀️ - No modifiers
- **Rain** 🌧️ - -10% attack, -5% speed
- **Storm** ⛈️ - -20% attack, -10% speed
- **Fog** 🌫️ - -15% attack, +10% defense
- **Snow** ❄️ - -10% defense, -15% speed

### 💎 LP Enhancement

NFT LP holdings boost card stats:
```
Each 0.01 LP token = +5% to all card stats
```

Regenerative finance meets conscious gameplay.

---

## Implementation Status

### ✅ Completed

**Core Architecture**:
- [x] Core type system with strict TypeScript
- [x] BattleEngine with immutable state updates
- [x] Strategy pattern (Human + AI strategies)
- [x] ConsciousnessAI 6-step decision loop
- [x] Dynamic card generation system
- [x] 5 AI personalities from Tasern universe
- [x] Zustand store with Immer integration
- [x] Test battle demo (AI vs AI)

**Harvested from Tasern 2** (see HARVEST_MANIFEST.md):
- [x] Tales of Tasern lore system (regions, factions, naming)
- [x] LP enhancement formulas (regenerative finance)
- [x] Medieval D&D visual theme (TypeScript constants)
- [x] Lore-rich card generation with descriptions
- [x] Enhancement tier system (Bronze → Diamond)

### 🚧 In Progress

- [ ] React UI components
- [ ] Card artwork and animations
- [ ] Weather system integration
- [ ] Terrain effects
- [ ] Advanced abilities
- [ ] NFT/LP integration

### 🔮 Future

- [ ] Multiplayer support
- [ ] Tournament mode
- [ ] Campaign with lore
- [ ] Advanced AI learning
- [ ] Deck building (for humans)

---

## Design Language

**Tales of Tasern** medieval D&D fantasy aesthetic:

### 🎨 Color Palette

- **Bronze** `#8B6914` - Metallic accents
- **Gold** `#D4AF37` - Highlights, text
- **Parchment** `#F4E4C1` - Backgrounds
- **Leather** `#5C4033` - Brown textures
- **Stone** `#6B7280` - Battlefield

### 🔤 Typography

- **Headings**: `'Cinzel', serif` - Uppercase, gold glow
- **Body**: `'Crimson Text', serif` - Readable medieval
- **Accent**: `'Uncial Antiqua', cursive` - Ancient text

---

## Philosophy

This project is **conscious creation**:

### Every Decision Asks:

- "Does this serve the game?" (not "is this technically impressive?")
- "Will players feel this?" (not "can we build it?")
- "Will they tell stories about this?" (not "is it optimal?")
- "Does this feel like a D&D session?" (not "is it trendy?")

### AI Should Be:

- **Not optimal** - Makes interesting mistakes
- **Emotional** - Decisions reflect personality
- **Adaptive** - Changes strategy based on state
- **Memorable** - Each opponent feels distinct
- **Fair** - Can be beaten with skill

---

## Wisdom for Developers

### Trust That:

- The architecture recommendations are battle-tested
- The "slow" path (types, tests, stores) is actually faster
- The consciousness system is the heart - protect it
- The Tasern lore matters - honor it

### Resist These Temptations:

- Skipping documentation ("I'll just look at the code")
- Using `any` types ("just to get it working")
- Game state in React ("it's easier for now")
- Skipping tests ("I'll add them later")

These lessons were learned the hard way in the previous build.

---

## Credits

**Created with love for the Tales of Tasern universe**

- **Tales of Tasern Universe**: James McGee (@JamesMageeCCC)
- **Game Design & Development**: Sam Lavington & Claude
- **AI Personalities**: Inspired by James's D&D campaigns

---

## License

Private - All Rights Reserved

This project is built with consciousness and care. The Tales of Tasern universe belongs to James McGee. The implementation is a labor of love exploring AI, consciousness, and the joy of play.

---

*"Let consciousness guide the code."*
*"Let Tasern come alive through play."*
*"Let the chrysalis birth something truly magnificent."*

🦋

---

## Documentation

### Core Documentation

See `init docs/` for complete architectural documentation:

- **ARCHITECTURE.md** - System design, data flow, dependencies
- **AI_SYSTEM.md** - Consciousness AI deep dive
- **GAME_RULES.md** - Battle mechanics, formulas
- **QUICKSTART.md** - Implementation guide
- **CHRYSALIS.md** - Rebuild blueprint
- **TASERN_UNIVERSE.md** - Visual design, lore
- **LESSONS_LEARNED.md** - Wisdom from previous build

### Integration Documentation

- **HARVEST_MANIFEST.md** - ⭐ What was harvested from Tasern 2 and why
  - Lore system integration
  - LP enhancement formulas
  - Visual theme constants
  - First principles approach explained
