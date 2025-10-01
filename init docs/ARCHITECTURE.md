# 🏛️ Tasern Siegefront - System Architecture

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Code Author**: Sam Lavington (Idl3o/@modsias)
**Universe Creator**: James McGee (@JamesMageeCCC)

---

## Table of Contents

1. [Overview](#overview)
2. [Architectural Principles](#architectural-principles)
3. [System Layers](#system-layers)
4. [Data Flow](#data-flow)
5. [Module Dependencies](#module-dependencies)
6. [State Management](#state-management)
7. [Type System](#type-system)
8. [Extension Points](#extension-points)

---

## Overview

Tasern Siegefront is built on a **layered architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                      React UI Layer                      │
│            (Presentation, User Interaction)              │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                  State Management Layer                  │
│            (Zustand/Redux, Actions, Selectors)           │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                    Game Logic Layer                      │
│         (Battle Engine, Turn Flow, Rule Validation)      │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                   AI Intelligence Layer                  │
│      (Consciousness AI, Decision Making, Generation)     │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                  Blockchain Integration                  │
│            (NFT Fetching, LP Discovery, Stats)           │
└─────────────────────────────────────────────────────────┘
```

**Key Design Goals**:
- **Testability** - Core logic pure, no side effects
- **Immutability** - All state transitions explicit
- **Type Safety** - Zero runtime type errors
- **Modularity** - Features can be added/removed independently
- **Performance** - <100ms action feedback, <2s initial load

---

## Architectural Principles

### 1. Immutable State
**Rule**: State is never mutated, always replaced

```typescript
// ✅ CORRECT - New state returned
function executeAction(state: BattleState, action: BattleAction): BattleState {
  return produce(state, draft => {
    draft.currentTurn++;
    draft.players[playerId].mana = 10;
  });
}

// ❌ WRONG - State mutated
function executeAction(state: BattleState, action: BattleAction): BattleState {
  state.currentTurn++; // MUTATION!
  return state;
}
```

**Benefits**:
- Time travel debugging possible
- Easy undo/redo implementation
- React rerenders work correctly
- State can be serialized/persisted

### 2. Single Source of Truth
**Rule**: Battle state lives in ONE place (Zustand/Redux store)

```typescript
// ✅ CORRECT - Single store
const useBattleStore = create<BattleStore>((set) => ({
  battleState: null,
  executeAction: (action) => {
    const state = get().battleState;
    const newState = battleEngine.executeAction(state, action);
    set({ battleState: newState });
  }
}));

// ❌ WRONG - Multiple copies
const [battleState1, setBattleState1] = useState();
const [battleState2, setBattleState2] = useState(); // DUPLICATE!
const battleStateRef = useRef(); // ANOTHER COPY!
```

### 3. Separation of Concerns
**Rule**: UI, Logic, and State are independent layers

```typescript
// ✅ CORRECT - Clean separation
// UI Component (presentation only)
function CardComponent({ card, onPlay }: Props) {
  return <div onClick={() => onPlay(card.id)}>{card.name}</div>;
}

// Container (state connection)
function CardContainer({ cardId }: { cardId: string }) {
  const card = useBattleStore(state =>
    state.battleState?.battlefield.flat().find(c => c?.id === cardId)
  );
  const executeAction = useBattleStore(state => state.executeAction);

  return <CardComponent
    card={card}
    onPlay={(id) => executeAction({ type: 'DEPLOY_CARD', cardId: id })}
  />;
}

// ❌ WRONG - Mixed concerns
function CardComponent({ card }: { card: GameCard }) {
  return <div onClick={() => {
    // UI component doing state management AND game logic!
    card.played = true;
    battleState.hand = battleState.hand.filter(c => c.id !== card.id);
    if (checkVictory()) { /* ... */ }
  }}>{card.name}</div>;
}
```

### 4. Strategy Pattern for Player Types
**Rule**: Never check `player.type`, always use strategy interface

```typescript
// ✅ CORRECT - Strategy pattern
interface PlayerStrategy {
  getAvailableCards(player: Player, state: BattleState): GameCard[];
}

class HumanPlayer implements PlayerStrategy {
  getAvailableCards(player: Player) {
    return player.hand; // From deck
  }
}

class AIPlayer implements PlayerStrategy {
  getAvailableCards(player: Player, state: BattleState) {
    return this.generateCards(player, state); // Dynamic
  }
}

// Battle engine uses strategy
const cards = player.strategy.getAvailableCards(player, state);

// ❌ WRONG - Type checking everywhere
if (player.type === 'ai') {
  cards = generateCards();
} else {
  cards = player.hand;
}
```

### 5. Pure Functions
**Rule**: Functions have no side effects, output determined solely by input

```typescript
// ✅ CORRECT - Pure function
function calculateDamage(attacker: BattleCard, defender: BattleCard): number {
  const baseDamage = attacker.attack - defender.defense;
  return Math.max(1, baseDamage); // Always same output for same input
}

// ❌ WRONG - Side effects
function calculateDamage(attacker: BattleCard, defender: BattleCard): number {
  const baseDamage = attacker.attack - defender.defense;
  defender.hp -= baseDamage; // SIDE EFFECT - mutates defender!
  logToServer({ attacker, defender, damage: baseDamage }); // SIDE EFFECT - network call!
  return baseDamage;
}
```

---

## System Layers

### Layer 1: React UI (Presentation)

**Responsibility**: Display game state, capture user input

**Components**:
```
src/components/
├── battle/
│   ├── BattleBoard.tsx       - 3x3 battlefield grid
│   ├── CardComponent.tsx     - Individual card display
│   ├── PlayerHand.tsx        - Hand + mana display
│   ├── BattleLog.tsx         - Scrollable event log
│   ├── WeatherDisplay.tsx    - Current weather UI
│   └── CastleDisplay.tsx     - Castle HP + portrait
├── game/
│   ├── HomePage.tsx          - Main menu
│   ├── AISelector.tsx        - Choose opponent
│   ├── DeckBuilder.tsx       - Deck construction
│   └── VictoryScreen.tsx     - Battle results
└── nft/
    ├── NFTGallery.tsx        - Collection viewer
    └── LPEnhancer.tsx        - LP stat display
```

**Rules**:
- Components receive props, dispatch actions
- NO business logic in components
- NO direct state mutation
- Use hooks for state access (`useBattleStore`)

**Example**:
```typescript
export function BattleBoard() {
  const battleState = useBattleStore(state => state.battleState);
  const executeAction = useBattleStore(state => state.executeAction);

  if (!battleState) return <LoadingScreen />;

  const handleCardPlay = (cardId: string, position: Position) => {
    executeAction({
      type: 'DEPLOY_CARD',
      cardId,
      position
    });
  };

  return (
    <div className="battle-board">
      {battleState.battlefield.map((row, y) =>
        row.map((card, x) => (
          <CardComponent
            key={`${x}-${y}`}
            card={card}
            position={{ x, y }}
            onPlay={handleCardPlay}
          />
        ))
      )}
    </div>
  );
}
```

### Layer 2: State Management

**Responsibility**: Single source of truth, action dispatching

**Store Structure**:
```typescript
interface BattleStore {
  // State
  battleState: BattleState | null;
  isProcessingAction: boolean;
  selectedCard: string | null;

  // Actions
  initializeBattle: (player1: Player, player2: Player) => void;
  executeAction: (action: BattleAction) => void;
  startAITurn: () => Promise<void>;
  endTurn: () => void;
  selectCard: (cardId: string | null) => void;

  // Selectors (computed state)
  getActivePlayer: () => Player | null;
  getPlayerHand: (playerId: string) => GameCard[];
  canPlayCard: (cardId: string) => boolean;
}
```

**Implementation** (Zustand):
```typescript
export const useBattleStore = create<BattleStore>((set, get) => ({
  battleState: null,
  isProcessingAction: false,
  selectedCard: null,

  initializeBattle: (player1, player2) => {
    const initialState = battleEngine.initializeBattle(player1, player2);
    set({ battleState: initialState });
  },

  executeAction: (action) => {
    const state = get().battleState;
    if (!state || get().isProcessingAction) return;

    set({ isProcessingAction: true });

    const newState = battleEngine.executeAction(state, action);

    set({
      battleState: newState,
      isProcessingAction: false
    });
  },

  startAITurn: async () => {
    const state = get().battleState;
    if (!state) return;

    const activePlayer = state.players[state.activePlayerId];
    if (activePlayer.strategy instanceof AIPlayer) {
      const action = await activePlayer.strategy.decideAction(state);
      get().executeAction(action);
    }
  },

  getActivePlayer: () => {
    const state = get().battleState;
    return state ? state.players[state.activePlayerId] : null;
  }
}));
```

### Layer 3: Game Logic

**Responsibility**: Battle rules, turn flow, victory conditions

**Core Modules**:
```
src/core/engine/
├── BattleEngine.ts          - Main orchestrator
├── ActionExecutor.ts        - Handle each action type
├── TurnManager.ts           - Turn flow, phase transitions
├── VictoryConditions.ts     - Win/loss detection
└── DeploymentValidator.ts   - Zone validation
```

**BattleEngine API**:
```typescript
export class BattleEngine {
  constructor(private config: BattleConfig) {}

  // Initialize new battle
  initializeBattle(
    player1: Player,
    player2: Player
  ): BattleState {
    // Create initial state
    // Shuffle decks, draw starting hands
    // Set up battlefield
    return initialState;
  }

  // Execute single action (pure function)
  executeAction(
    state: BattleState,
    action: BattleAction
  ): BattleState {
    return produce(state, draft => {
      switch (action.type) {
        case 'DEPLOY_CARD':
          this.handleDeployCard(draft, action);
          break;
        case 'ATTACK_CARD':
          this.handleAttackCard(draft, action);
          break;
        case 'END_TURN':
          this.handleEndTurn(draft);
          break;
        // ...
      }

      // Check victory conditions
      this.checkVictory(draft);
    });
  }

  // Validate action is legal
  validateAction(
    state: BattleState,
    action: BattleAction
  ): { valid: boolean; reason?: string } {
    // Check legality without executing
  }
}
```

### Layer 4: AI Intelligence

**Responsibility**: Autonomous decision making, card generation

**AI System Architecture**:
```
src/ai/
├── ConsciousnessAI.ts       - Main orchestrator
├── ConsciousnessEngine.ts   - Self-awareness, memory
├── DecisionMaker.ts         - Action scoring
├── CardGenerator.ts         - Dynamic card creation
├── StateHealer.ts           - State validation
└── personalities/
    └── TasernPersonalities.ts
```

**Decision Flow**:
```typescript
export class ConsciousnessAI {
  async decideAction(state: BattleState): Promise<BattleAction> {
    // 1. HEAL - Validate state
    const healedState = this.stateHealer.validateAndHeal(state);

    // 2. SELF-AWARENESS - Check AI health
    const health = this.consciousness.selfCheck(healedState);
    if (!health.isHealthy) {
      return { type: 'END_TURN' };
    }

    // 3. STRATEGIC ANALYSIS - Understand board
    const strategic = this.consciousness.analyzeStrategicState(healedState);

    // 4. GENERATE OPTIONS - List possible actions
    const actionPaths = this.decisionMaker.evaluateAllActions(healedState);

    // 5. SCORE & CHOOSE - Select best action with personality
    const chosen = this.chooseWithPersonality(actionPaths);

    // 6. RECORD - Build memory
    this.consciousness.recordAction(chosen);

    return chosen.action;
  }
}
```

### Layer 5: Blockchain Integration

**Responsibility**: NFT fetching, LP discovery, stat enhancement

**Modules**:
```
src/nft/
├── NFTFetcher.ts           - Moralis/Alchemy API
├── ImpactScanner.ts        - LP token discovery
├── StatEnhancer.ts         - Apply LP bonuses
└── LoreDetector.ts         - ToT NFT identification
```

**LP Enhancement Flow**:
```typescript
// 1. Fetch user's NFTs
const nfts = await nftFetcher.fetchNFTs(walletAddress);

// 2. Scan for LP holdings
const lpHoldings = await impactScanner.scanForLPTokens(nfts);

// 3. Calculate enhancement
const enhancement = statEnhancer.calculateBonus(lpHoldings);
// Each 0.01 LP = +5% stats

// 4. Apply to cards
const enhancedCards = cards.map(card =>
  statEnhancer.applyBonus(card, enhancement)
);
```

---

## Data Flow

### Action Execution Flow

```
User Click
    ↓
Component dispatches action
    ↓
Store.executeAction(action)
    ↓
BattleEngine.executeAction(state, action)
    ↓
    1. Validate action is legal
    2. Execute action (immutably)
    3. Check victory conditions
    4. Return new state
    ↓
Store updates state
    ↓
React rerenders affected components
```

### AI Turn Flow

```
Human ends turn
    ↓
Store.endTurn()
    ↓
Active player switches to AI
    ↓
Store.startAITurn()
    ↓
ConsciousnessAI.decideAction(state)
    ↓
    1. Heal state
    2. Self-check
    3. Analyze board
    4. Generate action options
    5. Score options
    6. Choose with personality
    ↓
Returns chosen action
    ↓
Store.executeAction(aiAction)
    ↓
Battle engine executes
    ↓
State updated, UI rerenders
```

---

## Module Dependencies

```
React Components
    ↓
    depends on
    ↓
State Management (Zustand)
    ↓
    depends on
    ↓
Battle Engine ← → AI System
    ↓                ↓
    depends on       depends on
    ↓                ↓
Type Definitions    Personalities
```

**Dependency Rules**:
1. UI depends on State, never directly on Logic
2. State depends on Logic, never on UI
3. Logic depends on Types, never on UI or State
4. AI depends on Logic, never on UI
5. NO circular dependencies

**Import Validation**:
```typescript
// ✅ CORRECT - Flows downward
// Component imports hook
import { useBattleStore } from '@/state/battleStore';

// Hook imports engine
import { BattleEngine } from '@/core/engine/BattleEngine';

// Engine imports types
import { BattleState, BattleAction } from '@/core/types/Battle';

// ❌ WRONG - Circular dependency
// BattleEngine imports useBattleStore ← FORBIDDEN!
```

---

## State Management

### State Shape

```typescript
interface BattleStore {
  // Core battle state
  battleState: BattleState | null;

  // UI state
  isProcessingAction: boolean;
  selectedCard: string | null;
  hoveredPosition: Position | null;

  // NFT data
  nftCollection: GameCard[];
  lpHoldings: LPHolding[];

  // Actions
  initializeBattle: (p1: Player, p2: Player) => void;
  executeAction: (action: BattleAction) => void;
  startAITurn: () => Promise<void>;
  endTurn: () => void;

  // UI actions
  selectCard: (cardId: string | null) => void;
  hoverPosition: (pos: Position | null) => void;

  // NFT actions
  loadNFTs: (address: string) => Promise<void>;
  enhanceCard: (cardId: string) => void;
}
```

### State Updates

All state updates use **Immer** for clean immutability:

```typescript
executeAction: (action) => {
  const state = get().battleState;

  const newState = produce(state, draft => {
    // Draft can be mutated - Immer handles immutability
    draft.currentTurn++;
    draft.players[playerId].mana = 10;
    draft.battlefield[y][x] = newCard;
  });

  set({ battleState: newState });
}
```

---

## Type System

### Core Types

```typescript
// Battle state
export interface BattleState {
  currentTurn: number;
  phase: 'deployment' | 'battle' | 'victory';
  activePlayerId: string;
  players: Record<string, Player>;
  battlefield: (BattleCard | null)[][];
  weather: WeatherEffect | null;
  terrainEffects: TerrainEffect[];
  controlledZones: Record<string, string>;
  winner: string | null;
  battleLog: BattleLogEntry[];
}

// Player
export interface Player {
  id: string;
  name: string;
  type: 'human' | 'ai';
  strategy: PlayerStrategy;
  mana: number;
  maxMana: number;
  castleHp: number;
  maxCastleHp: number;
  cardsOnField: BattleCard[];
}

// Actions (discriminated union)
export type BattleAction =
  | DeployCardAction
  | AttackCardAction
  | AttackCastleAction
  | MoveCardAction
  | UseAbilityAction
  | EndTurnAction;

export interface DeployCardAction {
  type: 'DEPLOY_CARD';
  cardId: string;
  position: Position;
  generatedCard?: GameCard;
}

// Cards
export interface GameCard {
  id: string;
  name: string;
  description: string;
  image: string;
  manaCost: number;
  attack: number;
  hp: number;
  speed: number;
  defense: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  abilities: CardAbility[];
  dddBurned: number;
  impactMultiplier: number;
  nftData?: NFTData;
}
```

### Type Safety Rules

1. **No 'any' types** - Use proper unions/generics
2. **Discriminated unions** - For action types
3. **Readonly where appropriate** - Prevent mutations
4. **Runtime validation** - Use Zod for external data

```typescript
// ✅ CORRECT - Discriminated union
type BattleAction = DeployAction | AttackAction | EndTurnAction;

function executeAction(state: BattleState, action: BattleAction) {
  switch (action.type) {
    case 'DEPLOY_CARD':
      // TypeScript knows this is DeployAction
      return handleDeploy(state, action);
    case 'ATTACK_CARD':
      // TypeScript knows this is AttackAction
      return handleAttack(state, action);
  }
}

// ❌ WRONG - Any type
function executeAction(state: any, action: any): any {
  // No type safety!
}
```

---

## Extension Points

### Adding New Card Abilities

```typescript
// 1. Define ability in types
export interface CardAbility {
  name: string;
  description: string;
  trigger: 'on_deploy' | 'on_attack' | 'on_damage' | 'passive';
  effect: AbilityEffect;
}

// 2. Register in AbilitySystem
abilitySystem.register({
  name: 'Firestorm',
  trigger: 'on_deploy',
  effect: (state, card) => {
    // Deal 2 damage to all enemy cards
    return produceState(state, draft => {
      getAllEnemyCards(draft).forEach(enemy => {
        enemy.hp -= 2;
      });
    });
  }
});

// 3. Battle engine auto-triggers registered abilities
```

### Adding New AI Personalities

```typescript
// Add to personalities/TasernPersonalities.ts
export const TASERN_PERSONALITIES = {
  'New Opponent': {
    name: 'New Opponent',
    description: 'Description',
    aggression: 0.6,      // 0-1: Attack vs HP distribution
    creativity: 0.7,      // 0-1: Unusual plays
    riskTolerance: 0.5,   // 0-1: High-risk plays
    patience: 0.4,        // 0-1: Early vs late game
    adaptability: 0.8     // 0-1: Response to board state
  }
};
```

### Adding New Weather Effects

```typescript
// Register in WeatherSystem
weatherSystem.register({
  name: 'Blizzard',
  description: 'All cards lose 1 speed',
  duration: 3,
  effect: (card: BattleCard) => ({
    speedModifier: -1,
    attackModifier: 0,
    defenseModifier: 0
  })
});
```

---

## Performance Considerations

### Memoization

```typescript
// Memoize expensive selectors
const selectBattlefield = (state: BattleStore) => state.battleState?.battlefield;
const selectPlayerHand = (playerId: string) =>
  (state: BattleStore) => state.battleState?.players[playerId]?.hand;

// Use in components
const battlefield = useBattleStore(selectBattlefield);
```

### Lazy Loading

```typescript
// Code split large components
const NFTGallery = lazy(() => import('./components/nft/NFTGallery'));
const VictoryScreen = lazy(() => import('./components/game/VictoryScreen'));
```

### Avoid Unnecessary Rerenders

```typescript
// ✅ CORRECT - Specific selector
const playerMana = useBattleStore(state =>
  state.battleState?.players[playerId]?.mana
);

// ❌ WRONG - Entire state causes rerender on any change
const battleState = useBattleStore(state => state.battleState);
const playerMana = battleState?.players[playerId]?.mana;
```

---

## Testing Strategy

### Unit Tests
- All pure functions (damage calculation, validation)
- AI decision scoring
- Card generation

### Integration Tests
- Full battle flows
- AI vs AI battles
- Victory condition detection

### E2E Tests
- User interactions
- Full game completion
- NFT integration

---

**Next**: See [GAME_RULES.md](./GAME_RULES.md) for battle mechanics
**Next**: See [AI_SYSTEM.md](./AI_SYSTEM.md) for AI deep dive
