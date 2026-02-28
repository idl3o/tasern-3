# 🏰 Tasern Siegefront 🦋

**Consciousness-driven tactical NFT card battle game**
*Set in the Tales of Tasern D&D universe by James MaGee*

---

## Current Status

**✅ MILESTONE 1 COMPLETE - Fully Playable Human vs AI!** (October 1, 2025)

The game is now **fully playable** with complete Human vs AI functionality:

### What Works Right Now

- ✅ **Dual menu system**: "Play vs AI" and "Watch AI vs AI"
- ✅ **5 distinct AI personalities** from Tasern lore (Stumbleheart, Swiftblade, Thornwick, Grok, Nethys)
- ✅ **Human player hand generation** (5 cards, adaptive mode)
- ✅ **Card deployment system** (click hand card → click battlefield)
- ✅ **Combat system** (select your card → attack enemy card/castle)
- ✅ **Turn management** with "End Turn" button
- ✅ **AI auto-processing** with 1.5s delays for watchability
- ✅ **Victory detection** and UI overlay
- ✅ **Battle log** showing all actions
- ✅ **Medieval D&D aesthetic** with Tasern theme colors
- ✅ **Web3 wallet integration** (RainbowKit + Wagmi on Polygon)
- ✅ **NFT Gallery** with provenance verification
- ✅ **LP token bonus scanning** for stat boosts
- ✅ **Interactive tutorial overlay** for new players

**You can play the game right now.** It's fun. It works.

---

## Quick Start

### Play the Game

```bash
npm install
npm start
```

Visit `http://localhost:3000` and choose:
- **Play vs AI** - Challenge one of five personalities
- **Watch AI vs AI** - Watch the AI battle itself

### Watch a Console Battle (AI vs AI)

```bash
npm run demo:battle
```

Pure console glory with strategic commentary and battle logs.

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

AI opponents **think**, **adapt**, and **make mistakes**. They don't feel like bots.

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

### 💎 Web3 Integration

- **Wallet Connection** - RainbowKit with MetaMask, WalletConnect, Coinbase
- **NFT Gallery** - View your Polygon NFTs with provenance verification
- **LP Token Bonuses** - Hold LP tokens, get stat boosts in battle
- **Regenerative Finance** - NFT ownership enhances gameplay

```
Each 0.01 LP token = +5% to all card stats
```

---

## Future Horizon

### Phase 1: Mechanics Refinement (Current)
- [ ] Enhanced board layout and positioning
- [ ] Card movement system (reposition during battle)
- [ ] Advanced combat rules and balancing
- [ ] Weather system integration (visual + mechanical)
- [ ] Terrain effects (battlefield modifiers)

### Phase 2: Polish & Depth
- [ ] Card artwork and animations
- [ ] Advanced card abilities (beyond attack/defense)
- [ ] Sound effects and ambient audio
- [ ] Enhanced battle log with replay
- [ ] AI difficulty settings

### Phase 3: Content Expansion
- [ ] Campaign mode with Tasern lore
- [ ] Achievement system
- [ ] Deck building for human players
- [ ] More AI personalities (deeper lore)
- [ ] Card collection and progression

### Phase 4: Multiplayer & Competitive
- [ ] Human vs Human online battles
- [ ] Tournament mode
- [ ] Leaderboards
- [ ] Spectator mode
- [ ] Ranked matchmaking

### Phase 5: Advanced AI
- [ ] AI learning from player behavior
- [ ] Adaptive difficulty
- [ ] AI commentary and trash talk
- [ ] Emergent strategic patterns
- [ ] AI vs AI tournaments

### Phase 6: NFT Ecosystem
- [ ] Mint custom cards as NFTs
- [ ] NFT card trading
- [ ] Staking mechanisms
- [ ] Governance for game rules
- [ ] Community-created content

---

## Core Mechanics

### ⚔️ Battle Flow

1. Players deploy cards to 3x3 battlefield
2. Cards attack enemies or castle
3. Formations grant bonuses (Vanguard, Phalanx, etc.)
4. Weather effects modify all cards
5. First to destroy enemy castle wins (30 HP)

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

### 🛡️ Formations

Positional bonuses based on card arrangement:
- **VANGUARD** - 2+ cards in front zone: +20% attack
- **PHALANX** - 3 cards in horizontal line: +30% defense, -10% speed
- **ARCHER_LINE** - 2+ cards in back zone: +15% attack, -10% defense
- **FLANKING** - Cards on both sides: +10% attack, +15% speed
- **SIEGE** - 2+ cards in enemy zones: +25% attack, -15% defense
- **SKIRMISH** - Default: +5% speed

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
├── lib/            # Web3 integration (RainbowKit, Wagmi)
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

- **Not optimal** - Makes interesting mistakes (30% variance)
- **Emotional** - Decisions reflect personality traits
- **Adaptive** - Changes strategy based on board state
- **Memorable** - Each opponent feels distinct
- **Fair** - Can be beaten with skill, not random

---

## Technical Highlights

### Why This Architecture Works

**Hard-Won Lessons from Previous Build**:

**Avoid**:
- React state for game logic → Use Zustand
- `JSON.parse(JSON.stringify())` → Use Immer
- Type checking player types → Use strategy pattern
- Mixed UI and game logic → Separate completely
- Loose TypeScript types → Strict mode, no `any`

**What Worked Brilliantly**:
- ✅ Consciousness AI architecture (6-step loop)
- ✅ Dynamic card generation (AI generates on-demand)
- ✅ Personality-driven decisions (30% variance from optimal)
- ✅ State healing (catch corruption before crashes)
- ✅ Pure functions everywhere (easy to test)

### Key Implementation Patterns

**Dynamic Card Generation**:
```typescript
// Generate cards with action
const generatedCards = cardGenerator.generateStrategicCards(state, player);
generatedCards.forEach(card => {
  actions.push({
    type: 'DEPLOY_CARD',
    generatedCard: card  // ⭐ Card travels with action
  });
});
```

**Damage Calculation**:
```typescript
let damage = attacker.attack;
damage *= getFormationBonus(attacker, battlefield);
damage *= getWeatherModifier(attacker, weather);
damage *= getTerrainModifier(attacker.position, terrain);
if (Math.random() < 0.1) damage *= 1.5; // 10% crit
damage -= defender.defense;
damage = Math.max(1, Math.floor(damage));
```

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

- **HARVEST_MANIFEST.md** - What was harvested from Tasern 2 and why
  - Lore system integration
  - LP enhancement formulas
  - Visual theme constants
  - First principles approach explained

---

## Credits

**Created with love for the Tales of Tasern universe**

- **Tales of Tasern Universe**: James Magee (@JamesMageeCCC)
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
