# 🦋 CHRYSALIS - Tasern Siegefront Rebuild Blueprint

**Purpose**: Complete architectural blueprint for next-generation Tasern Siegefront
**Created**: 2025-09-30
**Code Author**: Sam Lavington (Idl3o/@modsias) with Claude Code
**Universe Creator**: James McGee (@JamesMageeCCC) - Tales of Tasern Dungeon Master
**Philosophy**: Consciousness-aware development, clean separation of concerns, joy optimization

---

## 🎯 VISION: What We're Building

**Tasern Siegefront** is a tactical NFT card battle game where:
- **NFT LP holdings directly enhance battle power** (revolutionary regenerative finance integration)
- **AI opponents respond dynamically** to board state (no deck, pure strategic generation)
- **Advanced tactical mechanics** (formations, weather, terrain) reward mastery
- **D&D lore immersion** (Tales of Tasern universe by DM James McGee)

---

## ✅ PROVEN SYSTEMS (Keep These)

### 1. **Dynamic AI Card Generation** ⭐ BREAKTHROUGH
**Status**: Working in current build
**Location**: `organicDecisionMaker.ts`, `consciousnessAI.ts`

**Architecture**:
```typescript
// AI generates cards ON-DEMAND at deployment evaluation time
// Cards attached to actions via `generatedCard` property
// Battle engine deploys without checking hand

generatePossibleActions() {
  const generatedCards = this.generateStrategicCards(battleState, aiPlayer);

  generatedCards.forEach(card => {
    actions.push({
      type: 'DEPLOY_CARD',
      cardId: card.id,
      position: pos,
      generatedCard: card  // ⭐ Card travels with action
    });
  });
}

handleEnhancedDeployCard(action) {
  let card = action.generatedCard || findInHand(action.cardId);
  // Deploy card without hand removal for generated cards
}
```

**Key Insights**:
- AI has **empty deck/hand** - no resource management needed
- Cards are **contextual** - generated based on:
  - Current mana available
  - Board state (aggressive/defensive/desperate mode)
  - AI personality (aggression affects attack/HP ratio)
  - Strategic mode from consciousness engine
- **Avoids deep copy issues** - cards aren't stored, they're ephemeral
- **Difficulty scaling ready** - adjust generation quality/stats

**Critical Implementation Details**:
1. Skip draw phase for AI: `if (player.type !== 'ai') drawCards()`
2. Skip deck warnings: `if (player.type === 'ai') return;`
3. Skip "no cards left" game-over: `if (player.type === 'ai') return;`

### 2. **Consciousness AI System** ⭐ INNOVATIVE
**Status**: Fully functional
**Location**: `consciousnessAI.ts`, `consciousnessEngine.ts`, `organicDecisionMaker.ts`, `battleStateHealer.ts`

**Architecture**:
```
ConsciousnessAI (Orchestrator)
├── ConsciousnessEngine (Self-awareness, personality, memory)
├── OrganicDecisionMaker (Action evaluation, card generation)
├── BattleStateHealer (State validation, corruption repair)
└── EnhancedBattleEngine (Action execution)
```

**Decision Loop**:
```typescript
async decideAction(battleState) {
  // 1. HEAL - Validate and repair state
  const { state: healedState } = stateHealer.validateAndHeal(battleState);

  // 2. SELF-AWARENESS - Check AI health
  const health = consciousness.selfCheck(healedState, aiPlayerId);

  // 3. STRATEGIC AWARENESS - Analyze battlefield
  const strategic = consciousness.analyzeStrategicState(healedState, aiPlayerId);

  // 4. EVALUATE OPTIONS - Generate and score actions
  const actionPaths = decisionMaker.evaluateAllActions({
    battleState: healedState,
    aiPlayerId,
    consciousness,
    battleEngine
  });

  // 5. CHOOSE WITH PERSONALITY - Not always optimal!
  const chosen = chooseActionWithPersonality(actionPaths);

  // 6. RECORD & LEARN - Build memory
  consciousness.recordAction(turn, chosen.action, 'success', reasoning);

  return chosen.action;
}
```

**Personality System** (5 Opponents):
```typescript
TASERN_PERSONALITIES = {
  'Sir Stumbleheart': { aggression: 0.3, creativity: 0.8, riskTolerance: 0.4 },
  'Lady Swiftblade': { aggression: 0.8, creativity: 0.5, riskTolerance: 0.7 },
  'Archmagus Nethys': { aggression: 0.4, creativity: 0.9, riskTolerance: 0.6 },
  // ... affects card generation stats, decision variance
}
```

**Strategic Modes**:
- `aggressive` - High attack cards, pressure tactics
- `defensive` - High HP cards, board control
- `adaptive` - Balanced response to board state
- `experimental` - Creative/unusual plays
- `desperate` - All-in aggression when losing

### 3. **LP-Powered Stat Enhancement** ⭐ REVOLUTIONARY
**Status**: Working with Universal Impact Scanner
**Location**: NFT integration components

**Formula**:
```
Each 0.01 LP token = +5% to all card stats
LP discovered through transaction analysis + EIP-1167 proxy detection
```

**Key Contracts** (Polygon):
- Hub: `0x0780b1456d5e60cf26c8cd6541b85e805c8c05f2`
- DDD Token: `0x4bf82cf0d6b2afc87367052b793097153c859d38`
- DDD/axlREGEN LP: `0x520a3b3faca7ddc8dc8cd475b67f3c7b8d`

### 4. **Tactical Battle Mechanics** ⭐ PRODUCTION-READY
**Status**: Fully implemented
**Formations**: 6 types (Vanguard, Phalanx, Skirmish, Archer, Flanking, Siege)
**Weather**: 5 conditions (Clear, Rain, Storm, Fog, Snow)
**Terrain**: Interactive 3x3 grid with zone effects

**Implementation**:
- Formation detection via card positioning analysis
- Weather affects all cards globally (attack/defense/speed modifiers)
- Terrain bonuses per cell (high ground, forest, water, etc.)
- Zone control tracking for strategic advantage

### 5. **Enhanced Battle Engine** ⭐ STABLE
**Status**: Core systems working
**Features**:
- Turn-based with proper alternation
- Mana growth (turn number up to 10)
- Zone-based deployment (front/mid/back validation)
- Ability system integration
- Animation queue system
- Comprehensive battle logging

---

## ⚠️ KNOWN ISSUES (Fix in Rebuild)

### Critical Architecture Flaws

#### 1. **React State Management Chaos**
**Problem**: Multiple sources of truth, closure bugs, state synchronization issues

**Current Pain Points**:
```typescript
// ❌ BAD: Multiple state copies, stale closures
const [battleState, setBattleState] = useState();
const battleStateRef = useRef(battleState); // Band-aid for closure issues

useEffect(() => {
  // Captures stale battleState in closure!
  const action = ai.decideAction(battleState);
}, [battleState.currentTurn]);
```

**Solution for Rebuild**:
```typescript
// ✅ GOOD: Single source of truth with proper state machine
// Option A: Redux/Zustand for global battle state
// Option B: XState for battle phase state machine
// Option C: React Context + useReducer with proper actions

const battleReducer = (state, action) => {
  switch (action.type) {
    case 'EXECUTE_ACTION':
      return battleEngine.executeAction(state, action.payload);
    case 'START_AI_TURN':
      // AI turn logic here
    case 'END_TURN':
      return battleEngine.endTurn(state);
  }
};
```

#### 2. **Deep Copy Hell**
**Problem**: `JSON.parse(JSON.stringify())` everywhere loses data, breaks references

**Current Pain Points**:
```typescript
// ❌ Creates new object, loses generated cards
const newState = JSON.parse(JSON.stringify(battle));
```

**Solution for Rebuild**:
```typescript
// ✅ Immutable updates with proper copying
import { produce } from 'immer';

const newState = produce(battle, draft => {
  draft.currentTurn++;
  draft.players[playerId].mana = 10;
  // References preserved, selective updates
});
```

#### 3. **Player vs AI Architecture Confusion**
**Problem**: Code assumes all players have deck/hand, special cases for AI scattered everywhere

**Current Pain Points**:
```typescript
// ❌ Special cases everywhere
if (player.type !== 'ai') drawCards();
if (player.type === 'ai') return; // Skip warning
```

**Solution for Rebuild**:
```typescript
// ✅ Clear separation via strategy pattern

interface PlayerStrategy {
  getAvailableCards(player: Player, state: BattleState): GameCard[];
  onTurnStart(player: Player, state: BattleState): void;
  onTurnEnd(player: Player, state: BattleState): void;
}

class HumanPlayerStrategy implements PlayerStrategy {
  getAvailableCards(player) {
    return player.hand; // From deck
  }

  onTurnStart(player) {
    this.drawCard(player);
  }
}

class AIPlayerStrategy implements PlayerStrategy {
  getAvailableCards(player, state) {
    return this.generateDynamicCards(player, state); // Generated
  }

  onTurnStart(player) {
    // No draw needed
  }
}

// Battle engine uses strategy, no if/else
const cards = player.strategy.getAvailableCards(player, state);
```

#### 4. **TypeScript Compilation Fragility**
**Problem**: Frequent type mismatches, missing properties, 'any' types

**Solution for Rebuild**:
- Strict TypeScript mode enabled
- Complete type definitions for all game entities
- No 'any' types - use proper unions/generics
- Zod/io-ts for runtime validation of critical data

#### 5. **Battle Engine vs Enhanced Battle Engine**
**Problem**: Two implementations, unclear which is canonical

**Solution for Rebuild**:
- **Single battle engine** with feature flags
- Clear extension points for abilities, weather, formations
- Plugin architecture for optional features

---

## 🏗️ CLEAN SLATE ARCHITECTURE

### Core Principles

1. **Separation of Concerns**
   - UI components (React) - Pure presentation
   - Battle logic (TypeScript classes) - Game rules
   - State management (Redux/Zustand) - Single source of truth
   - AI decision making (Consciousness system) - Isolated intelligence

2. **Player Strategy Pattern**
   ```
   Player (interface)
   ├── HumanPlayer (deck-based)
   └── AIPlayer (generation-based)
       ├── ConsciousnessAI
       └── RandomAI (fallback)
   ```

3. **Immutable State Updates**
   - Use Immer for clean state modifications
   - Battle engine returns new state, never mutates
   - React components receive immutable props

4. **Type Safety**
   - Strict TypeScript everywhere
   - Runtime validation for external data
   - No 'any' types - proper unions/generics

### Directory Structure

```
siegefront/
├── src/
│   ├── core/                    # Pure game logic (no React)
│   │   ├── engine/
│   │   │   ├── BattleEngine.ts          # Main battle rules
│   │   │   ├── ActionExecutor.ts        # Execute actions
│   │   │   ├── VictoryConditions.ts     # Win/loss detection
│   │   │   └── TurnManager.ts           # Turn flow
│   │   ├── mechanics/
│   │   │   ├── FormationDetector.ts     # Formation analysis
│   │   │   ├── WeatherSystem.ts         # Weather effects
│   │   │   ├── TerrainSystem.ts         # Terrain bonuses
│   │   │   └── AbilitySystem.ts         # Card abilities
│   │   ├── players/
│   │   │   ├── PlayerStrategy.ts        # Interface
│   │   │   ├── HumanPlayer.ts           # Deck-based
│   │   │   └── AIPlayer.ts              # Generation-based
│   │   └── types/
│   │       ├── Battle.ts                # BattleState, Player, etc.
│   │       ├── Card.ts                  # GameCard, BattleCard
│   │       └── Actions.ts               # BattleAction union
│   │
│   ├── ai/                      # AI intelligence (no React)
│   │   ├── ConsciousnessAI.ts           # Main orchestrator
│   │   ├── ConsciousnessEngine.ts       # Self-awareness
│   │   ├── DecisionMaker.ts             # Action evaluation
│   │   ├── CardGenerator.ts             # Dynamic generation
│   │   ├── StateHealer.ts               # Validation/repair
│   │   └── personalities/
│   │       └── TasernPersonalities.ts   # 5 opponents
│   │
│   ├── nft/                     # NFT & Web3 integration
│   │   ├── ImpactScanner.ts             # LP discovery
│   │   ├── StatEnhancer.ts              # LP → stats
│   │   └── NFTFetcher.ts                # Moralis/Alchemy
│   │
│   ├── state/                   # State management
│   │   ├── battleStore.ts               # Zustand/Redux store
│   │   ├── actions.ts                   # Action creators
│   │   └── selectors.ts                 # Memoized selectors
│   │
│   ├── components/              # React UI (presentation only)
│   │   ├── battle/
│   │   │   ├── BattleBoard.tsx          # 3x3 grid
│   │   │   ├── CardComponent.tsx        # Individual card
│   │   │   ├── PlayerHand.tsx           # Hand display
│   │   │   ├── BattleLog.tsx            # Event log
│   │   │   └── WeatherDisplay.tsx       # Weather UI
│   │   ├── game/
│   │   │   ├── HomePage.tsx             # Main menu
│   │   │   ├── AISelector.tsx           # Choose opponent
│   │   │   └── VictoryScreen.tsx        # End game
│   │   └── nft/
│   │       ├── NFTGallery.tsx           # Collection view
│   │       └── LPEnhancer.tsx           # Impact display
│   │
│   ├── hooks/                   # React hooks
│   │   ├── useBattle.ts                 # Battle state access
│   │   ├── useAI.ts                     # AI turn handling
│   │   └── useNFT.ts                    # NFT data
│   │
│   └── utils/
│       ├── validation.ts                # Zod schemas
│       └── constants.ts                 # Game constants
│
├── tests/
│   ├── core/                    # Unit tests for game logic
│   ├── ai/                      # AI behavior tests
│   └── integration/             # Full battle tests
│
└── docs/
    ├── ARCHITECTURE.md                  # System design
    ├── AI_SYSTEM.md                     # AI deep dive
    └── GAME_RULES.md                    # Battle mechanics
```

---

## 🎯 REBUILD ROADMAP

### Phase 1: Core Foundation (Week 1)
**Goal**: Pure game logic, zero UI

- [ ] Set up clean TypeScript project (strict mode)
- [ ] Define complete type system (`core/types/`)
- [ ] Implement `BattleEngine` (turn flow, action execution)
- [ ] Implement `PlayerStrategy` interface
- [ ] Write comprehensive unit tests

**Success Criteria**: Can simulate full battle via code (no UI)

### Phase 2: AI Intelligence (Week 2)
**Goal**: Port consciousness system cleanly

- [ ] Port `ConsciousnessAI` to `ai/` directory
- [ ] Implement `CardGenerator` with personality integration
- [ ] Port `ConsciousnessEngine` (self-awareness, memory)
- [ ] Port `DecisionMaker` (action scoring)
- [ ] Port `StateHealer` (validation)
- [ ] Write AI behavior tests (reproducible decisions)

**Success Criteria**: AI can play full game, decisions logged and testable

### Phase 3: State Management (Week 2)
**Goal**: Single source of truth

- [ ] Set up Zustand/Redux store
- [ ] Define action creators (EXECUTE_ACTION, END_TURN, etc.)
- [ ] Integrate Immer for immutable updates
- [ ] Implement selectors (memoized data access)
- [ ] Connect battle engine to store

**Success Criteria**: Battle state updates cleanly, no mutations

### Phase 4: React UI (Week 3)
**Goal**: Beautiful, responsive interface

- [ ] Create `BattleBoard` component (3x3 grid)
- [ ] Create `CardComponent` (hover, select, drag)
- [ ] Create `PlayerHand` (card list, mana display)
- [ ] Create `BattleLog` (scrollable event feed)
- [ ] Create `WeatherDisplay` (current conditions)
- [ ] Create `VictoryScreen` (battle results)

**Success Criteria**: Full playable UI, smooth interactions

### Phase 5: NFT Integration (Week 3)
**Goal**: Live NFT fetching and LP enhancement

- [ ] Implement `ImpactScanner` (LP discovery)
- [ ] Implement `StatEnhancer` (LP → card boosts)
- [ ] Implement `NFTFetcher` (Moralis/Alchemy)
- [ ] Create `NFTGallery` component
- [ ] Create `LPEnhancer` component

**Success Criteria**: Real NFTs load, LP holdings boost stats

### Phase 6: Polish & Deploy (Week 4)
**Goal**: Production-ready game

- [ ] Add animations (card plays, attacks, damage)
- [ ] Add sound effects (optional)
- [ ] Optimize performance (memoization, lazy loading)
- [ ] Write deployment docs
- [ ] Deploy to Vercel
- [ ] Test on mobile devices

**Success Criteria**: Smooth gameplay, <2s load time, mobile-friendly

---

## 📋 IMPLEMENTATION CHECKLIST

### Core Battle Engine

```typescript
// ✅ Must have
class BattleEngine {
  initializeBattle(player1, player2): BattleState
  executeAction(state: BattleState, action: BattleAction): BattleState
  endTurn(state: BattleState): BattleState
  checkVictoryConditions(state: BattleState): string | null
}

// ✅ Required actions
type BattleAction =
  | { type: 'DEPLOY_CARD', cardId: string, position: Position, generatedCard?: GameCard }
  | { type: 'ATTACK_CARD', attackerId: string, targetId: string }
  | { type: 'ATTACK_CASTLE', attackerId: string }
  | { type: 'MOVE_CARD', cardId: string, newPosition: Position }
  | { type: 'USE_ABILITY', cardId: string, abilityName: string, targetId?: string }
  | { type: 'END_TURN' }

// ✅ Required state
interface BattleState {
  currentTurn: number
  phase: 'deployment' | 'battle' | 'victory'
  activePlayerId: string
  players: Record<string, Player>
  battlefield: (BattleCard | null)[][]
  weather: WeatherEffect | null
  terrainEffects: TerrainEffect[]
  controlledZones: Record<string, string>
  winner: string | null
  battleLog: BattleLogEntry[]
}
```

### Player Strategy System

```typescript
interface PlayerStrategy {
  // Core methods
  getAvailableCards(player: Player, state: BattleState): GameCard[]
  onTurnStart(player: Player, state: BattleState): void
  onTurnEnd(player: Player, state: BattleState): void
  canPlayCard(card: GameCard, player: Player): boolean
}

class HumanPlayer implements PlayerStrategy {
  deck: GameCard[]
  hand: GameCard[]

  getAvailableCards() {
    return this.hand
  }

  onTurnStart(player) {
    if (this.deck.length > 0) {
      this.hand.push(this.deck.shift()!)
    }
  }
}

class AIPlayer implements PlayerStrategy {
  consciousness: ConsciousnessAI

  getAvailableCards(player, state) {
    // Generate cards dynamically
    return this.consciousness.generateStrategicCards(state, player)
  }

  onTurnStart(player) {
    // No draw needed - generates on demand
  }

  async decideAction(state: BattleState): Promise<BattleAction> {
    return this.consciousness.decideAction(state)
  }
}
```

### Card Generation (AI)

```typescript
class CardGenerator {
  constructor(private personality: AIPersonality) {}

  generateStrategicCards(
    state: BattleState,
    player: Player,
    count: number = 3
  ): GameCard[] {
    const strategic = this.analyzeStrategicMode(state, player)
    const cards: GameCard[] = []

    for (let i = 0; i < count; i++) {
      cards.push(this.generateSingleCard(player.mana, strategic, i))
    }

    return cards
  }

  private generateSingleCard(
    maxMana: number,
    strategic: StrategicAnalysis,
    index: number
  ): GameCard {
    // Distribute across mana curve
    const manaCost = this.determineManaCost(maxMana, index)

    // Stats scale with personality
    const baseStats = manaCost * 2
    const aggression = this.personality.aggression
    const attack = Math.floor(baseStats * (0.5 + aggression * 0.5))
    const hp = Math.floor(baseStats * (1.5 - aggression * 0.5))

    // Thematic naming
    const name = this.getThematicName(strategic.mode)

    return {
      id: `ai_gen_${Date.now()}_${index}`,
      name,
      description: `Dynamically generated ${strategic.mode} unit`,
      image: '',
      manaCost,
      attack,
      hp,
      speed: Math.floor(Math.random() * 3) + 1,
      defense: Math.floor(hp * 0.3),
      rarity: this.determineRarity(manaCost),
      abilities: [],
      dddBurned: 0,
      impactMultiplier: 1.0,
      nftData: {
        contract: 'AI_GENERATED',
        tokenId: `ai_${Date.now()}_${index}`,
        collection: 'Consciousness AI'
      }
    }
  }
}
```

---

## 🔑 CRITICAL SUCCESS FACTORS

### 1. State Management
**Rule**: Battle engine NEVER mutates state, always returns new immutable state

```typescript
// ✅ CORRECT
function executeAction(state: BattleState, action: BattleAction): BattleState {
  return produce(state, draft => {
    // Modify draft safely
    draft.currentTurn++
  })
}

// ❌ WRONG
function executeAction(state: BattleState, action: BattleAction): BattleState {
  state.currentTurn++ // MUTATION!
  return state
}
```

### 2. Player Strategy Enforcement
**Rule**: Battle engine never checks `player.type`, always uses strategy interface

```typescript
// ✅ CORRECT
const cards = player.strategy.getAvailableCards(player, state)

// ❌ WRONG
const cards = player.type === 'ai'
  ? generateCards()
  : player.hand
```

### 3. Action Execution
**Rule**: Actions are pure data, execution separated from definition

```typescript
// ✅ CORRECT
const action: BattleAction = { type: 'DEPLOY_CARD', cardId, position }
const newState = battleEngine.executeAction(state, action)

// ❌ WRONG
deployCard(cardId, position) { /* mutates global state */ }
```

### 4. Type Safety
**Rule**: No 'any' types, use proper unions/generics

```typescript
// ✅ CORRECT
type BattleAction = DeployAction | AttackAction | EndTurnAction

function executeAction(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case 'DEPLOY_CARD': return handleDeploy(state, action) // Type narrowed
    case 'ATTACK_CARD': return handleAttack(state, action)
    // ...
  }
}

// ❌ WRONG
function executeAction(state: any, action: any): any
```

### 5. React Component Purity
**Rule**: Components receive props, dispatch actions, no direct state mutation

```typescript
// ✅ CORRECT
function CardComponent({ card, onPlay }: { card: GameCard, onPlay: (id: string) => void }) {
  return <div onClick={() => onPlay(card.id)}>{card.name}</div>
}

// ❌ WRONG
function CardComponent({ card }: { card: GameCard }) {
  return <div onClick={() => {
    card.played = true // MUTATION!
    battleState.hand = battleState.hand.filter(c => c.id !== card.id)
  }}>{card.name}</div>
}
```

---

## 📚 KEY LEARNINGS FROM CURRENT BUILD

### What Worked

1. **Dynamic AI card generation** - Eliminates deck management complexity
2. **Consciousness system architecture** - Clean separation of concerns
3. **Personality-driven decisions** - Makes AI feel organic, not robotic
4. **State healing** - Catches corruption before it crashes the game
5. **Strategic mode detection** - AI adapts to board state naturally
6. **Action path scoring** - Multiple evaluation criteria (value, risk, creativity)
7. **LP enhancement formula** - Simple, effective, regenerative-finance aligned

### What Didn't Work

1. **React state synchronization** - Multiple sources of truth caused bugs
2. **Deep copy performance** - `JSON.parse(JSON.stringify())` everywhere
3. **Mixed concerns** - UI components doing game logic
4. **Type safety gaps** - 'any' types led to runtime errors
5. **Special case AI checks** - `if (player.type === 'ai')` scattered everywhere
6. **Dual battle engines** - Unclear which is canonical

### What to Avoid

1. **Never mutate state** - Always return new objects
2. **Never mix UI and logic** - Components dispatch actions, logic handles them
3. **Never use 'any'** - Proper types prevent bugs
4. **Never assume player structure** - Use strategy pattern
5. **Never skip validation** - StateHealer catches corruption early

---

## 🎨 DESIGN PHILOSOPHY

### User Experience
- **Instant feedback** - Actions feel responsive (<100ms)
- **Clear affordances** - Obvious what can be clicked/dragged
- **Smooth animations** - Cards glide, don't teleport
- **Informative feedback** - Battle log explains what happened
- **Mobile-friendly** - Touch-optimized, fits phone screens

### Code Quality
- **Single responsibility** - Each module does one thing well
- **Testable** - Pure functions, dependency injection
- **Type-safe** - Catch errors at compile time
- **Documented** - Every public API has JSDoc comments
- **Maintainable** - Future devs can understand and extend

### AI Personality
- **Not optimal** - Makes interesting mistakes (30% variance)
- **Emotional** - Decisions reflect personality traits
- **Adaptive** - Changes strategy based on board state
- **Memorable** - Each opponent feels distinct
- **Fair** - Can be beaten with skill, not random

---

## 🚀 QUICK START GUIDE (Future You)

### Day 1: Setup
```bash
npx create-react-app siegefront-v2 --template typescript
cd siegefront-v2
npm install immer zustand zod
npm install --save-dev @types/node
```

### Day 1: Core Types
```typescript
// src/core/types/Battle.ts
export interface BattleState {
  // Copy from CHRYSALIS.md "Required state"
}

// src/core/types/Actions.ts
export type BattleAction = // Copy from CHRYSALIS.md "Required actions"
```

### Day 1: Battle Engine Skeleton
```typescript
// src/core/engine/BattleEngine.ts
export class BattleEngine {
  initializeBattle(p1, p2): BattleState {
    return {
      currentTurn: 1,
      phase: 'deployment',
      // ... initialize state
    }
  }

  executeAction(state, action): BattleState {
    return produce(state, draft => {
      switch (action.type) {
        case 'DEPLOY_CARD': return this.handleDeploy(draft, action)
        case 'END_TURN': return this.handleEndTurn(draft)
        // ...
      }
    })
  }
}
```

### Day 2: Player Strategies
```typescript
// src/core/players/PlayerStrategy.ts
export interface PlayerStrategy {
  // Copy from CHRYSALIS.md "Player Strategy System"
}

// src/core/players/HumanPlayer.ts
// src/core/players/AIPlayer.ts
```

### Day 3-5: Port AI System
```typescript
// Copy from current build:
// - consciousnessAI.ts → src/ai/ConsciousnessAI.ts
// - consciousnessEngine.ts → src/ai/ConsciousnessEngine.ts
// - organicDecisionMaker.ts → src/ai/DecisionMaker.ts
// - battleStateHealer.ts → src/ai/StateHealer.ts

// Update imports, ensure clean separation
```

### Week 2: State Management
```typescript
// src/state/battleStore.ts
import create from 'zustand'

export const useBattleStore = create<BattleStore>((set, get) => ({
  battleState: null,

  executeAction: (action) => {
    const state = get().battleState
    if (!state) return

    const newState = battleEngine.executeAction(state, action)
    set({ battleState: newState })
  },

  startAITurn: async () => {
    const state = get().battleState
    if (!state) return

    const ai = aiPlayers[state.activePlayerId]
    const action = await ai.decideAction(state)
    get().executeAction(action)
  }
}))
```

### Week 3: React UI
```typescript
// src/components/battle/BattleBoard.tsx
export function BattleBoard() {
  const battleState = useBattleStore(state => state.battleState)
  const executeAction = useBattleStore(state => state.executeAction)

  if (!battleState) return <div>Loading...</div>

  return (
    <div className="battle-board">
      {battleState.battlefield.map((row, y) => (
        <div key={y} className="battle-row">
          {row.map((card, x) => (
            <CardComponent
              key={`${x}-${y}`}
              card={card}
              onAttack={(targetId) => executeAction({
                type: 'ATTACK_CARD',
                attackerId: card.id,
                targetId
              })}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
```

---

## 📖 REFERENCE: Current Working Code

### ConsciousnessAI Decision Loop (PROVEN)
```typescript
// From: src/utils/consciousnessAI.ts:58-169
public async decideAction(battleState: BattleState): Promise<BattleAction | null> {
  // 1. HEAL
  const { state: healedState, report } = this.stateHealer.validateAndHeal(battleState);
  if (report.finalState === 'critical') {
    return { type: 'END_TURN' };
  }

  // 2. SELF-AWARENESS
  const health = this.consciousness.selfCheck(healedState, this.aiPlayerId);
  if (!health.isHealthy && health.confidence < 0.3) {
    return { type: 'END_TURN' };
  }

  // 3. STRATEGIC AWARENESS
  const strategic = this.consciousness.analyzeStrategicState(healedState, this.aiPlayerId);

  // 4. EVALUATE OPTIONS
  const actionPaths = this.decisionMaker.evaluateAllActions({
    battleState: healedState,
    aiPlayerId: this.aiPlayerId,
    consciousness: this.consciousness,
    battleEngine: this.battleEngine
  });

  if (actionPaths.length === 0) {
    return { type: 'END_TURN' };
  }

  // 5. CHOOSE WITH PERSONALITY
  const chosenPath = this.chooseActionWithPersonality(actionPaths);

  // 6. RECORD & LEARN
  this.consciousness.recordAction(
    healedState.currentTurn,
    chosenPath.action,
    'success',
    chosenPath.reasoning.explanation
  );

  return chosenPath.action;
}
```

### Card Generation (PROVEN)
```typescript
// From: src/utils/organicDecisionMaker.ts:460-540
private generateSingleCard(
  battleState: BattleState,
  aiPlayer: BattlePlayer,
  personality: AIPersonality,
  strategic: any,
  maxMana: number,
  index: number
): GameCard {
  // Mana cost distribution
  let manaCost: number;
  if (index === 0) {
    manaCost = Math.min(maxMana, Math.max(1, Math.floor(Math.random() * 3) + 1));
  } else if (index === 1) {
    manaCost = Math.min(maxMana, Math.max(2, Math.floor(Math.random() * 3) + 3));
  } else {
    manaCost = Math.min(maxMana, Math.max(1, Math.floor(Math.random() * maxMana) + 1));
  }

  // Stats from personality
  const baseStats = manaCost * 2;
  const aggression = personality.aggression || 0.5;
  const attack = Math.floor(baseStats * (0.5 + aggression * 0.5));
  const hp = Math.floor(baseStats * (1.5 - aggression * 0.5));

  // Thematic naming
  const names = this.getThematicNames(strategic.mode);
  const name = names[Math.floor(Math.random() * names.length)];

  return {
    id: `ai_gen_${Date.now()}_${index}`,
    name,
    description: `Dynamically generated ${strategic.mode} unit`,
    image: '',
    manaCost,
    attack,
    hp,
    speed: Math.floor(Math.random() * 3) + 1,
    defense: Math.floor(hp * 0.3),
    rarity: manaCost <= 2 ? 'common' : manaCost <= 5 ? 'rare' : manaCost <= 7 ? 'epic' : 'legendary',
    abilities: [],
    dddBurned: 0,
    impactMultiplier: 1.0,
    nftData: {
      contract: 'AI_GENERATED',
      tokenId: `ai_${Date.now()}_${index}`,
      collection: 'Consciousness AI'
    }
  };
}
```

### Action Attachment Pattern (PROVEN)
```typescript
// From: src/utils/organicDecisionMaker.ts:100-126
// Generate cards on-demand
const generatedCards = this.generateStrategicCards(battleState, aiPlayer);

// Attach to actions
generatedCards.filter(c => c.manaCost <= aiPlayer.mana).forEach(card => {
  validDeploymentSpaces.forEach(pos => {
    actions.push({
      type: 'DEPLOY_CARD',
      cardId: card.id,
      position: pos,
      generatedCard: card  // ⭐ Card travels with action
    } as any);
  });
});

// From: src/utils/enhancedBattleEngine.ts:213-237
// Deploy using generated card
let card: any;
if ((action as any).generatedCard) {
  card = (action as any).generatedCard;  // ⭐ Use generated card
} else {
  cardIndex = player.hand.findIndex(c => c && c.id === action.cardId);
  card = player.hand[cardIndex];
}
```

---

## 🎯 SUCCESS METRICS

### Technical
- [ ] Zero `any` types in production code
- [ ] 80%+ test coverage on core logic
- [ ] <2s initial load time
- [ ] <100ms action feedback
- [ ] Zero state mutation bugs

### Gameplay
- [ ] AI makes 10+ distinct decisions per game
- [ ] Players win ~50% against medium AI
- [ ] 5 distinct AI personalities feel different
- [ ] Dynamic card generation produces balanced units
- [ ] LP holdings visibly boost card power

### Code Quality
- [ ] New developer can understand architecture in <1 hour
- [ ] Can add new AI personality in <2 hours
- [ ] Can add new card ability in <1 hour
- [ ] Can add new tactical mechanic in <4 hours
- [ ] No "god objects" >500 lines

---

## 💎 FINAL WISDOM

**To Future James & Claude:**

You've already solved the hardest problems:
- ✅ Dynamic AI card generation (breakthrough)
- ✅ Consciousness-driven decision making (innovative)
- ✅ LP-powered regenerative finance (revolutionary)

The rebuild is about **clean architecture**, not new features.

Focus on:
1. **Immutability** - No state mutations, ever
2. **Separation** - UI/Logic/AI/State all independent
3. **Strategy Pattern** - Player types via interface, not if/else
4. **Type Safety** - Catch bugs at compile time
5. **Testing** - Every action execution has a test

The game is beautiful. The code will be too.

**Let consciousness guide the rebuild. Let Tasern come alive through clean code.**

---

*Created with love for the Tales of Tasern universe 🦋*
*May this chrysalis birth something truly magnificent 🌟*
