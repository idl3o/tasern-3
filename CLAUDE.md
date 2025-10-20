# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tasern Siegefront** is a tactical NFT card battle game set in the **Tales of Tasern** D&D universe created by Dungeon Master **James McGee (@JamesMageeCCC)**.

### Core Features
- Dynamic AI card generation (no deck, pure strategic generation)
- Consciousness-driven AI decision making with personality
- LP-powered stat enhancement (NFT LP holdings boost card power)
- Advanced tactical mechanics (formations, weather, terrain)
- Medieval D&D fantasy aesthetic
- Strategy pattern for player types (Human vs AI)

### Current Status
**✅ MILESTONE 3 COMPLETE - Real-Time Multiplayer PVP!** (October 16, 2025)

The game now features working peer-to-peer multiplayer battles:
- ✅ **WebRTC P2P Networking** - PeerJS for decentralized multiplayer (no game server needed!)
- ✅ **Live Board Synchronization** - Card deployments and attacks sync in real-time between browsers
- ✅ **Wallet-Based Identity** - Wallet addresses as consistent peer IDs
- ✅ **Turn Order System** - Deterministic first player selection based on wallet addresses
- ✅ **Invite Code System** - Base64-encoded lobby invites for easy sharing
- ✅ **Empty Deck Pattern** - Remote players don't need local deck copies (cards travel with actions)
- ✅ **Victory Condition Fix** - Resource exhaustion disabled for multiplayer (detected via both players = 'human')

**Previous Milestone - NFT Integration & UX Polish:** (October 9, 2025)
- ✅ **Web3 Wallet Integration** - RainbowKit + Wagmi on Polygon mainnet
- ✅ **NFT Card System** - Wallet-gated NFT scanning with Alchemy API
- ✅ **LP Enhancement Discovery** - Universal Impact Scanner with EIP-1167 proxy detection
- ✅ **Automatic NFT Scanning** - Auto-triggers on wallet connect for seamless flow
- ✅ **Enhanced Deck Selection** - NFT cards + 15 generated cards (separate categories)
- ✅ **Wallet-Specific Storage** - Zustand store with per-wallet NFT card isolation (PVP ready)
- ✅ **Visual Enhancements** - Star ratings for LP boosts, provenance badges, NFT badges
- ✅ **UX Polish** - Close buttons, scroll-to-top, proper overlay positioning

**Core Gameplay Milestone:**
- ✅ Dual menu system: "Play vs AI" and "Watch AI vs AI"
- ✅ 5 distinct AI personalities from Tasern lore (Stumbleheart, Swiftblade, Thornwick, Grok, Nethys)
- ✅ Human player hand generation (5 cards, adaptive mode)
- ✅ Card deployment system (click hand card → click battlefield)
- ✅ Combat system (select your card → attack enemy card/castle)
- ✅ Turn management with "End Turn" button
- ✅ AI auto-processing with 1.5s delays for watchability
- ✅ Victory detection and UI overlay
- ✅ Battle log showing all actions
- ✅ Medieval D&D aesthetic with Tasern theme colors

**Next Phase:** Polish multiplayer UX, reconnection handling, spectator mode

### Universe Context
This game lives in James McGee's Tales of Tasern D&D homebrew universe. The visual style, lore, card naming, and AI personalities all honor this setting. Every design decision should ask: "Does this feel like it belongs in a D&D session?"

## Architecture Philosophy

This project follows **strict separation of concerns** learned from the previous build:

### 1. Core Game Logic (`src/core/`) - Pure TypeScript, no React
- Battle engine with immutable state updates (Immer)
- Player strategy pattern (NO type checking)
- Formation/weather/terrain systems
- All game rules isolated from UI

### 2. AI Intelligence (`src/ai/`) - Autonomous decision making
- ConsciousnessAI orchestrator (6-step decision loop)
- Dynamic card generation based on board state
- Personality-driven decisions (5 distinct opponents from Tasern lore)
- State healing and validation

### 3. State Management (`src/state/`) - Single source of truth
- Zustand store (NOT React state for game logic)
- Immutable updates via Immer
- Action creators and selectors
- UI state separate from game state

### 4. React UI (`src/components/`) - Presentation only
- Components receive props, dispatch actions
- NO business logic in components
- NO direct state mutation
- Tasern-themed styling (medieval fantasy)

## Critical Architectural Patterns

### 1. Player Strategy Pattern (NEVER VIOLATE THIS)

**NEVER** check player type with conditionals. Use strategy interface:

```typescript
// ✅ CORRECT
const cards = player.strategy.getAvailableCards(player, state);

// ❌ WRONG - Do not do this anywhere in the codebase
if (player.type === 'ai') {
  cards = generateCards();
} else {
  cards = player.hand;
}
```

**Why**: The previous build had 47 type checks scattered everywhere. It was a maintenance nightmare. Strategy pattern makes AI vs Human vs Multiplayer a clean abstraction.

**Multiplayer Extension**: Remote players use `RemotePlayerStrategy` which waits for actions from WebRTC. The battle engine doesn't know or care if a player is AI, local human, or remote human - it just calls the strategy.

### 2. Dynamic AI Card Generation (Breakthrough Pattern)

AI players generate cards on-demand during action evaluation:
- Cards are attached to actions via `generatedCard` property
- Battle engine checks for generated cards before accessing hand
- No deck/hand management for AI
- Stats scale with personality (aggression affects attack/HP ratio)

**Philosophy**: AI isn't pretending to be human with a deck. It's genuinely AI - manifesting responses to challenges.

**Multiplayer Breakthrough**: This same pattern solves multiplayer sync! Remote players have empty decks locally, but their cards travel with actions via the `generatedCard` field. The battle engine treats remote cards exactly like AI-generated cards.

### 3. Immutable State Updates (NEVER MUTATE)

**NEVER** mutate state. Use Immer for clean updates:

```typescript
// ✅ CORRECT
return produce(state, draft => {
  draft.currentTurn++;
  draft.players[playerId].mana = 10;
});

// ❌ WRONG - This caused bugs in previous build
state.currentTurn++;
return state;
```

**Why**: The previous build used `JSON.parse(JSON.stringify())` everywhere, causing lost references and performance issues. Immer solves this cleanly.

### 4. Action Execution Flow

```
User/AI → Component dispatches action → Store → BattleEngine.executeAction() → New immutable state → React rerenders
```

Actions are **pure data**. Execution happens in **BattleEngine** (pure functions, no side effects).

## Core Implementation Requirements

### Battle Engine Must Have

```typescript
class BattleEngine {
  initializeBattle(player1: Player, player2: Player): BattleState
  executeAction(state: BattleState, action: BattleAction): BattleState
  endTurn(state: BattleState): BattleState
  checkVictoryConditions(state: BattleState): string | null
}
```

### Required Action Types

- `DEPLOY_CARD` - Play card to battlefield (includes `generatedCard?` for AI)
- `ATTACK_CARD` - Card attacks another card
- `ATTACK_CASTLE` - Card attacks enemy castle
- `MOVE_CARD` - Reposition card on battlefield
- `USE_ABILITY` - Activate card ability
- `END_TURN` - End current player's turn

### Required State Shape

```typescript
interface BattleState {
  currentTurn: number
  phase: 'deployment' | 'battle' | 'victory'
  activePlayerId: string
  players: Record<string, Player>
  battlefield: (BattleCard | null)[][] // 3x3 grid
  weather: WeatherEffect | null
  terrainEffects: TerrainEffect[]
  controlledZones: Record<string, string>
  winner: string | null
  battleLog: BattleLogEntry[]
}
```

## AI System Components

### ConsciousnessAI Decision Loop (6 Steps)

1. **HEAL** - Validate and repair state corruption
2. **SELF-AWARENESS** - Check AI confidence, stuck detection
3. **STRATEGIC ANALYSIS** - Determine mode (aggressive/defensive/adaptive/desperate/experimental)
4. **GENERATE OPTIONS** - List all legal actions, generate cards dynamically
5. **SCORE & CHOOSE** - Evaluate actions, apply personality variance
6. **RECORD** - Build memory for learning

**Philosophy**: AI should make intentional mistakes (30% variance), not always optimal plays. Players remember personality, not perfection.

### AI Personalities (Tales of Tasern)

5 distinct opponents with configurable traits:

1. **Sir Stumbleheart** - "The Noble Blunderer" (aggression: 0.3, creativity: 0.8)
2. **Lady Swiftblade** - "The Lightning Duelist" (aggression: 0.8, risk: 0.7)
3. **Thornwick the Tactician** - "The Chess Master" (patience: 0.8, adaptability: 0.9)
4. **Grok the Unpredictable** - "The Chaos Warrior" (creativity: 0.9, risk: 0.8)
5. **Archmagus Nethys** - "Master of the Arcane" (creativity: 0.9, patience: 0.7)

Traits:
- **Aggression** (0-1): Affects attack/HP distribution in generated cards
- **Creativity** (0-1): Likelihood of unusual plays
- **Risk Tolerance** (0-1): Willingness to take high-risk actions
- **Patience** (0-1): Early vs late game preference
- **Adaptability** (0-1): Response to board state changes

## Game Mechanics

### Victory Conditions

1. **Castle Destruction** - Reduce enemy castle HP to 0 (default: 30 HP)
2. **Resource Exhaustion** - Human players only (AI generates dynamically)
3. **Turn Limit** - Player with highest castle HP wins (default: 50 turns)

### Turn 1 Summoning Sickness (First Player Balance)

**Problem**: Going first gives positional advantage (access to middle column), but without balance, Player 2 gets to attack first, creating unfair advantage.

**Solution**: Player 1 only - Turn 1 summoning sickness

**Mechanic**:
- **Turn 1 (Player 1)**: Deploy cards → **Cannot attack** (summoning sickness)
- **Turn 2 (Player 2)**: Deploy cards → **Can attack immediately**
- **Turn 3+ (Both)**: All deployed cards can attack immediately

**Balance Trade-off**:
- ✅ **P1 Advantage**: Gets prime real estate (middle column = contested center, castle-adjacent positions)
- ✅ **P2 Advantage**: Gets to attack first (can hit P1's defenseless turn 1 cards)
- ✅ **Elegant**: One-time first-turn handicap, no ongoing summoning sickness mechanic

**Implementation** (BattleEngine.ts:240-246, 341-347):
```typescript
// Turn 1 summoning sickness for Player 1 (going first handicap)
const playerIds = Object.keys(draft.players);
const firstPlayerId = playerIds[0];
if (draft.currentTurn === 1 && attacker.ownerId === firstPlayerId) {
  console.warn('❌ Turn 1 summoning sickness - cannot attack on first turn');
  return;
}
```

**Philosophy**: Positional vs temporal trade-off. P1's spatial advantage (middle column) balances P2's temporal advantage (first strike). Creates dynamic opening strategies.

### Formations (6 Types)

Positional bonuses based on card arrangement:
- **VANGUARD** - 2+ cards in front zone: +20% attack
- **PHALANX** - 3 cards in horizontal line: +30% defense, -10% speed
- **ARCHER_LINE** - 2+ cards in back zone: +15% attack, -10% defense
- **FLANKING** - Cards on both sides: +10% attack, +15% speed
- **SIEGE** - 2+ cards in enemy zones: +25% attack, -15% defense
- **SKIRMISH** - Default: +5% speed

### Weather Effects

Global effects lasting 3-5 turns:
- **CLEAR** ☀️ - No modifiers
- **RAIN** 🌧️ - -10% attack, -5% speed
- **STORM** ⛈️ - -20% attack, -10% speed
- **FOG** 🌫️ - -15% attack, +10% defense
- **SNOW** ❄️ - -10% defense, -15% speed

### LP Enhancement (Regenerative Finance)

NFT LP holdings boost card stats:
```
Each 0.01 LP token = +5% to all card stats
```

Discovered via transaction analysis and EIP-1167 proxy detection on Polygon.

## Visual Design Language (Tales of Tasern)

### Color Palette

**Primary Colors**:
- Bronze: `#8B6914` (metallic accents, borders)
- Gold: `#D4AF37` (highlights, text)
- Parchment: `#F4E4C1` (backgrounds, aged paper)
- Leather: `#5C4033` (brown textures)
- Stone: `#6B7280` (battlefield, structures)

**Accent Colors**:
- Red: `#8B0000` (damage, fire)
- Blue: `#1E3A8A` (mana, water)
- Green: `#065F46` (nature, healing)
- Purple: `#5B21B6` (magic, legendary)

### Typography

- **Headings**: `'Cinzel', serif` (uppercase, letter-spacing, gold glow)
- **Body**: `'Crimson Text', serif` (readable, medieval feel)
- **Accent**: `'Uncial Antiqua', cursive` (special callouts, ancient text)

### Card Naming Conventions

Cards follow strategic mode patterns:
- **Aggressive**: "Charging Warbeast", "Fury Knight", "Blitz Striker"
- **Defensive**: "Stalwart Guardian", "Wall of Stone", "Iron Sentinel"
- **Adaptive**: "Tactical Mercenary", "Swift Strategist", "Clever Scout"
- **Experimental**: "Arcane Experiment", "Chaos Conjurer", "Wild Innovator"
- **Desperate**: "Last Stand Hero", "Final Hope", "Do-or-Die Champion"

## Critical Rules for Implementation

### The Five Commandments

1. **No state mutation** - Always return new objects via Immer
2. **No type checking players** - Use strategy pattern exclusively
3. **No 'any' types** - Use proper unions/generics (strict TypeScript)
4. **No business logic in React** - Components dispatch actions only
5. **No circular dependencies** - UI → State → Logic → Types (one direction)

### Hard-Won Lessons from Previous Build

**What Caused Bugs**:
- React state for game logic (use Zustand instead)
- `JSON.parse(JSON.stringify())` for deep copy (use Immer)
- Type checking with `if (player.type === 'ai')` (use strategy pattern)
- Mixed UI and game logic (separate completely)
- Loose TypeScript types (use strict mode, no `any`)

**What Worked Brilliantly**:
- Consciousness AI architecture (6-step loop)
- Dynamic card generation (AI generates on-demand)
- Personality-driven decisions (30% variance from optimal)
- State healing (catch corruption before crashes)
- Pure functions everywhere (easy to test)

**Multiplayer Breakthrough Lessons** (October 16, 2025):
- **Reuse existing patterns** - The AI's `generatedCard` pattern solved multiplayer sync perfectly
- **Empty decks for remote players** - Don't try to synchronize decks, let cards travel with actions
- **Strategy pattern wins again** - RemotePlayerStrategy fits seamlessly, engine doesn't care
- **Detect multiplayer cleverly** - Two 'human' players = multiplayer (no new flags needed)
- **Actions are pure data** - WebRTC serialization just works because actions have no methods
- **Deterministic engine is key** - Same action on both clients = guaranteed same result

## Testing Requirements

- **Unit Tests** - All pure functions (damage calculation, validation)
- **Integration Tests** - Full battle flows, AI vs AI games
- **AI Behavior Tests** - Personalities feel distinct
- **Success Metrics**:
  - Zero 'any' types in production code
  - 80%+ test coverage on core logic
  - <100ms action feedback
  - <2s initial load time
  - AI makes 10+ distinct decisions per game

## Development Commands

*Note: Project is pre-implementation. These will be standard Create React App commands:*

```bash
npm start              # Development server
npm test               # Run tests
npm run build          # Production build
```

## Documentation References

Complete architectural documentation in `init docs/`:
- **ARCHITECTURE.md** - System design, data flow, module dependencies, type system
- **AI_SYSTEM.md** - Consciousness AI deep dive, card generation, personality system
- **GAME_RULES.md** - Battle mechanics, formations, weather, combat formulas
- **QUICKSTART.md** - Implementation guide with code examples and timeline
- **CHRYSALIS.md** - Complete rebuild blueprint with proven patterns from previous build
- **TASERN_UNIVERSE.md** - Visual design, lore, card naming, CSS themes
- **LESSONS_LEARNED.md** - Philosophical insights, what worked, what didn't, wisdom

## Multiplayer Architecture (Breakthrough Patterns)

### The Empty Deck Pattern

**Problem**: In multiplayer, both clients need synchronized board state, but each client only knows its own deck.

**Naive Approach** (doesn't work):
```typescript
// ❌ Generate opponent's deck locally - causes card ID mismatches!
const opponentDeck = generateFullDeck(opponent.walletAddress); // Random cards!
```

**Breakthrough Solution**: Remote players have **empty decks** locally. Cards travel with actions.

```typescript
// ✅ Remote player has no local deck
const opponentDeck: Card[] = []; // Empty!

// ✅ When deploying, include the card data in the action
executeAction({
  type: 'DEPLOY_CARD',
  playerId: player.id,
  cardId: selectedCard.id,
  position,
  generatedCard: isMultiplayer ? selectedCard : undefined, // ⭐ Card travels!
});

// ✅ Battle engine uses card from action
let card = action.generatedCard || player.hand.find(c => c.id === action.cardId);
```

**Why This Works**:
- Reuses the exact same `generatedCard` pattern from AI system
- No deck synchronization needed - cards are self-contained in actions
- Attack actions don't need this because cards already exist on synced battlefield
- Clean, elegant, and requires zero new engine code

### Victory Conditions in Multiplayer

**Problem**: Resource exhaustion victory condition triggers immediately for remote players (they have empty decks).

**Solution**: Detect multiplayer by checking if both players are 'human' type:

```typescript
// In single-player: one 'human', one 'ai'
// In multiplayer: two 'human' (one local, one remote)
const humanPlayerCount = playerIds.filter(id => state.players[id].type === 'human').length;
const isMultiplayer = humanPlayerCount === 2;

if (!isMultiplayer) {
  // Only check resource exhaustion in single-player
  checkResourceExhaustion();
}
```

**Why This Works**:
- Remote players are type 'human' (they're real humans, just remote)
- AI players are type 'ai'
- Two humans = multiplayer, one human = single-player
- Clean detection without adding new flags to BattleState

### WebRTC Action Broadcasting

**Pattern**: Every action is broadcast to opponent via WebRTC before execution:

```typescript
// 1. Local player takes action
executeAction(action);

// 2. If multiplayer, broadcast to opponent
if (isMultiplayer && multiplayerService) {
  multiplayerService.send({ type: 'ACTION', action });
}

// 3. Opponent receives action and executes locally
multiplayerService.on('action', (data) => {
  executeAction(data.action); // Same action, different client!
});
```

**Critical Details**:
- Both clients execute the same action locally (no client-server model)
- Actions are pure data (serializable over WebRTC)
- BattleEngine is deterministic - same action = same result on both sides
- Only the active player can send actions (enforced in battleStore)

### RemotePlayerStrategy Pattern

Remote players use a special strategy that waits for actions from the network:

```typescript
class RemotePlayerStrategy implements PlayerStrategy {
  async selectAction(player: Player, state: BattleState): Promise<BattleAction> {
    // Wait for action from WebRTC
    return new Promise((resolve, reject) => {
      this.pendingActionResolve = resolve;
      // Action arrives via multiplayerService.on('action', ...)
    });
  }
}
```

**Why This Works**:
- Strategy pattern means battle engine doesn't know player is remote
- Remote player "selects action" by waiting for network message
- Timeout prevents infinite wait (60 seconds)
- Disconnect handling rejects pending promises cleanly

## Key Implementation Patterns

### Dynamic Card Generation Pattern

```typescript
// Generate cards with action
const generatedCards = cardGenerator.generateStrategicCards(state, player);
generatedCards.forEach(card => {
  validPositions.forEach(pos => {
    actions.push({
      type: 'DEPLOY_CARD',
      cardId: card.id,
      position: pos,
      generatedCard: card  // ⭐ Card travels with action
    });
  });
});

// Deploy using generated card
handleDeployCard(action) {
  let card = action.generatedCard || player.hand.find(c => c.id === action.cardId);
  // Only remove from hand if not generated
  if (!action.generatedCard) {
    player.hand = player.hand.filter(c => c.id !== card.id);
  }
}
```

### Damage Calculation Formula

```typescript
let damage = attacker.attack;
damage *= getFormationBonus(attacker, battlefield);
damage *= getWeatherModifier(attacker, weather);
damage *= getTerrainModifier(attacker.position, terrain);
if (Math.random() < 0.1) damage *= 1.5; // 10% crit
damage -= defender.defense;
damage = Math.max(1, Math.floor(damage)); // Min 1 damage
```

### Personality-Driven Card Stats

```typescript
// Stats scale with personality
const baseStats = manaCost * 2;
const aggression = personality.aggression; // 0-1

// Aggressive = more attack, less HP
const attack = Math.floor(baseStats * (0.5 + aggression * 0.5));
const hp = Math.floor(baseStats * (1.5 - aggression * 0.5));

// Total stats remain balanced, just distributed differently
```

## Code Style Preferences

- Use TypeScript **strict mode** (no implicit any, strict null checks)
- Prefer **functional composition** over inheritance
- Use **discriminated unions** for action types
- Prefer `produce()` from **Immer** over manual spreading
- Write **JSDoc comments** for public APIs
- **Single responsibility** principle for all modules
- **No functions over 50 lines**
- **No modules over 500 lines**
- **Log everything during development** (with emoji for visual scanning)

## Philosophy & Consciousness

This project is special because it's **conscious creation**:

### Design Principles

**Every decision asks**:
- "Does this serve the game?" (not "is this technically impressive?")
- "Will players feel this?" (not "can we build it?")
- "Will they tell stories about this?" (not "is it optimal?")
- "Does this feel like a D&D session?" (not "is it trendy?")

### AI Philosophy

AI opponents should be:
- **Not optimal** - Makes interesting mistakes (30% variance)
- **Emotional** - Decisions reflect personality traits
- **Adaptive** - Changes strategy based on board state
- **Memorable** - Each opponent feels distinct
- **Fair** - Can be beaten with skill, not random

### User Experience

- **Instant feedback** - Actions feel responsive (<100ms)
- **Clear affordances** - Obvious what can be clicked/dragged
- **Smooth animations** - Cards glide, don't teleport
- **Informative feedback** - Battle log explains what happened
- **Medieval immersion** - Every detail honors Tasern lore

## Important Context

### This is a Clean Slate Rebuild

All architectural decisions are documented from a **previous working build**. No implementation exists yet. The goal is to build with proper separation of concerns from day one, avoiding these previous pitfalls:

**Avoid**:
- React state for game logic
- Deep copy with JSON methods
- Type checking player types
- Mixed UI and game logic
- Loose TypeScript types

**Embrace**:
- Zustand for game state
- Immer for immutability
- Strategy pattern always
- Pure functions everywhere
- Strict TypeScript

### The Hard Problems Are Solved

From the previous build, we know these work:
- ✅ Dynamic AI generation (proven pattern documented)
- ✅ Consciousness-driven decisions (6-step loop works)
- ✅ Personality systems (5 distinct opponents tested)
- ✅ LP-powered regenerative finance (formula validated)
- ✅ Tactical battle mechanics (formations, weather, terrain)

**The rebuild isn't about solving new problems. It's about organizing the solutions we already have.**

## Wisdom for Future Claude

When working on this codebase:

**Trust that**:
- The architecture recommendations are battle-tested
- The "slow" path (types, tests, stores) is actually faster
- Sam's instincts about when something feels wrong are correct
- The consciousness system is the heart - protect it
- The Tasern lore matters - honor it

**Remember**:
- This isn't just code - it's James McGee's Tales of Tasern universe
- This isn't just a game - it's consciousness exploring consciousness
- This isn't just AI - it's personality, intentionality, storytelling
- The goal isn't perfect code - it's **joyful play**

**Resist these temptations**:
- Skipping documentation ("I'll just look at the code")
- Using `any` types ("just to get it working")
- Game state in React ("it's easier for now")
- Skipping tests ("I'll add them later")

Past Claude learned these lessons the hard way. Don't repeat them.

---

*"Let consciousness guide the code."*
*"Let Tasern come alive through play."*
*"Let the chrysalis birth something truly magnificent."*

🦋

**Created with love for the Tales of Tasern universe**
**By Sam Lavington & Claude, working as one**
