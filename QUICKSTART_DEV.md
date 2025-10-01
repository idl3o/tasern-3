# 🚀 Quick Start for Developers

Get up and running with Tasern Siegefront in minutes.

---

## Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- A terminal
- Love for consciousness-driven gameplay

---

## Installation

```bash
# Install dependencies
npm install

# Verify TypeScript compiles
npm run type-check
```

---

## Your First Battle (AI vs AI)

Watch two AI personalities battle in pure console glory:

```bash
npm run demo:battle
```

You'll see:
- Lady Swiftblade (aggressive) vs Thornwick (tactical)
- Real-time decision making
- Dynamic card generation
- Formation bonuses
- Complete battle log

**This is the heart of the system working.** Everything else builds on this.

---

## Project Structure

```
src/
├── types/
│   └── core.ts              # Type definitions (start here!)
│
├── core/
│   ├── BattleEngine.ts      # Pure game logic
│   ├── PlayerFactory.ts     # Create players easily
│   ├── WeatherSystem.ts     # Weather effects
│   └── FormationCalculator.ts # Tactical bonuses
│
├── ai/
│   ├── ConsciousnessAI.ts   # 6-step decision loop
│   ├── CardGenerator.ts     # Dynamic card creation
│   └── personalities.ts     # 5 AI personalities
│
├── strategies/
│   ├── HumanStrategy.ts     # Player strategy
│   └── AIStrategy.ts        # AI strategy
│
├── state/
│   └── battleStore.ts       # Zustand store
│
├── components/
│   └── BattleView.tsx       # React UI example
│
└── demo/
    └── testBattle.ts        # Console test battle
```

---

## The 5-Minute Architecture Tour

### 1. Read the Types First

**File**: `src/types/core.ts`

Everything starts here. Read this file to understand:
- What a `BattleState` looks like
- How `Player` works
- What actions exist
- The Strategy pattern interface

**No `any` types exist in this file. That's intentional.**

### 2. Understand the BattleEngine

**File**: `src/core/BattleEngine.ts`

The heart. Key methods:
- `initializeBattle()` - Start a new battle
- `executeAction()` - Process any action
- `endTurn()` - Switch to next player
- `checkVictoryConditions()` - Determine winner

All methods are **pure functions** that return new state via Immer.

### 3. Explore ConsciousnessAI

**File**: `src/ai/ConsciousnessAI.ts`

The thinking mind. Six steps:
1. **HEAL** - Validate state
2. **SELF-AWARENESS** - Check confidence
3. **STRATEGIC ANALYSIS** - Determine mode
4. **GENERATE OPTIONS** - List possible actions
5. **SCORE & CHOOSE** - Evaluate with variance
6. **RECORD** - Update memory

This is where personality becomes action.

### 4. Check the Store

**File**: `src/state/battleStore.ts`

Zustand + Immer. All game state lives here. React components subscribe to slices.

Key actions:
- `initializeBattle()`
- `executeAction()`
- `endTurn()`

Key selectors:
- `selectBattleState`
- `selectActivePlayer`
- `selectBattlefield`

---

## Creating Your First Battle (Code)

```typescript
import { PlayerFactory } from './core/PlayerFactory';
import { BattleEngine } from './core/BattleEngine';
import { LADY_SWIFTBLADE, GROK_THE_UNPREDICTABLE } from './ai/personalities';

// Create players
const player1 = PlayerFactory.createAI('Lady Swiftblade', LADY_SWIFTBLADE);
const player2 = PlayerFactory.createAI('Grok', GROK_THE_UNPREDICTABLE);

// Initialize battle
let state = BattleEngine.initializeBattle(player1, player2);

// Game loop
while (!state.winner) {
  const activePlayer = state.players[state.activePlayerId];

  // AI selects action
  const action = await activePlayer.strategy.selectAction(activePlayer, state);

  // Execute action
  state = BattleEngine.executeAction(state, action);

  // Check victory
  const victory = BattleEngine.checkVictoryConditions(state);
  if (victory) {
    console.log(`${state.players[victory.winnerId].name} wins!`);
    break;
  }

  // End turn if needed
  if (action.type === 'END_TURN') {
    state = BattleEngine.endTurn(state);
  }
}
```

That's it. That's a complete battle.

---

## Using the Store (React)

```typescript
import { useBattleStore, selectBattleState, selectActivePlayer } from './state/battleStore';

function MyComponent() {
  const battleState = useBattleStore(selectBattleState);
  const activePlayer = useBattleStore(selectActivePlayer);
  const { executeAction, endTurn } = useBattleStore();

  const handleEndTurn = () => {
    endTurn();
  };

  return (
    <div>
      <h1>Turn {battleState?.currentTurn}</h1>
      <p>Active: {activePlayer?.name}</p>
      <button onClick={handleEndTurn}>End Turn</button>
    </div>
  );
}
```

Components subscribe to state. They don't own it.

---

## Creating Custom AI Personalities

```typescript
import type { AIPersonality } from './types/core';

const MY_PERSONALITY: AIPersonality = {
  name: 'Your Character',
  title: 'The Cool Title',
  aggression: 0.7,      // 0-1: Attack vs HP in cards
  creativity: 0.8,      // 0-1: Unusual play likelihood
  riskTolerance: 0.6,   // 0-1: High-risk actions
  patience: 0.5,        // 0-1: Early vs late game
  adaptability: 0.7,    // 0-1: Board state response
  flavorText: '"Your character\'s catchphrase"',
};

const player = PlayerFactory.createAI('Name', MY_PERSONALITY);
```

Personality affects:
- Card stat distribution (aggression)
- Action selection variance (creativity)
- Strategic mode transitions (patience)
- Decision confidence (adaptability)

---

## The Golden Rules

### 1. Never Mutate State

```typescript
// ❌ WRONG
state.currentTurn++;
return state;

// ✅ CORRECT
return produce(state, draft => {
  draft.currentTurn++;
});
```

### 2. Never Check Player Type

```typescript
// ❌ WRONG
if (player.type === 'ai') {
  cards = generateCards();
}

// ✅ CORRECT
const cards = player.strategy.getAvailableCards(player, state);
```

### 3. Never Use 'any'

```typescript
// ❌ WRONG
function doSomething(data: any) { }

// ✅ CORRECT
function doSomething(data: BattleAction | null) { }
```

### 4. Never Put Game Logic in React

```typescript
// ❌ WRONG (in component)
const damage = calculateDamage(attacker, defender);
defender.hp -= damage;

// ✅ CORRECT (in component)
executeAction({
  type: 'ATTACK_CARD',
  attackerCardId: attacker.id,
  targetCardId: defender.id,
});
```

### 5. Components Are Presentation Only

React components:
- Subscribe to store
- Dispatch actions
- Render UI

React components DO NOT:
- Calculate damage
- Validate moves
- Determine AI actions
- Mutate state

---

## Testing Your Changes

```bash
# Type check
npm run type-check

# Run test battle
npm run demo:battle

# Start dev server (when React is ready)
npm start
```

If the test battle runs without errors, your core logic is sound.

---

## Common Tasks

### Adding a New Action Type

1. Add to `BattleAction` union in `types/core.ts`
2. Create interface for the action
3. Add handler in `BattleEngine.executeAction()`
4. Add scoring in `ConsciousnessAI.scoreActions()`

### Adding a New Card Ability

1. Add to `AbilityEffect` union in `types/core.ts`
2. Add handler in `BattleEngine.handleUseAbility()`
3. Add AI scoring logic in `ConsciousnessAI`

### Modifying AI Behavior

1. Adjust personality traits in `ai/personalities.ts`
2. Modify scoring functions in `ConsciousnessAI.ts`
3. Change variance in `selectActionWithVariance()`

---

## Debugging Tips

### Console Logs Are Your Friend

The codebase is heavily logged with emoji for visual scanning:
- 🧠 - AI thinking
- ⚔️ - Combat
- 🏰 - Castle/castle damage
- ✅ - Success
- ❌ - Error
- 🎲 - Randomness/variance

### Watch the Test Battle

The console demo shows exactly what the AI is thinking. Watch:
- Strategic mode determination
- Action scoring
- Card generation
- Formation detection

### Check the Battle Log

Every action is logged. Use `selectBattleLog()` to see history.

---

## What to Build Next

### Short Term (Prototype)
- [ ] Basic React UI with battlefield visualization
- [ ] Human player input handling
- [ ] Card animations
- [ ] Weather visual effects

### Medium Term (MVP)
- [ ] Complete card ability system
- [ ] Terrain effects
- [ ] Sound effects
- [ ] Victory animations
- [ ] Tutorial mode

### Long Term (Full Game)
- [ ] Campaign mode
- [ ] Multiplayer
- [ ] NFT integration
- [ ] Advanced AI learning
- [ ] Tournament system

---

## Getting Help

### Documentation
- **CLAUDE.md** - Full project instructions
- **MANIFEST.md** - Philosophy and architecture
- **README.md** - User-facing overview
- **init docs/** - Complete architectural docs

### Code Comments
Every file has JSDoc comments explaining its purpose.

### Ask Questions
The architecture is battle-tested. If something seems wrong, check:
1. Are you following the Five Commandments?
2. Is TypeScript happy?
3. Does the test battle work?

---

## Philosophy Reminder

> "Let consciousness guide the code."

Every line of code serves the game. Every decision is intentional. Every type is meaningful.

This isn't just a project. It's an exploration of consciousness through play.

Build with care. Build with joy. Build something players will remember.

🦋

---

**Ready to begin?**

```bash
npm install
npm run demo:battle
```

Watch the consciousness awaken. Then build something magnificent.
