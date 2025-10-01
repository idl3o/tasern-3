# 🚀 Tasern Siegefront - Quickstart Guide

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Code Author**: Sam Lavington (Idl3o/@modsias)
**Universe Creator**: James McGee (@JamesMageeCCC)

---

## Day 1: Project Setup

### Initialize Project

```bash
# Create new React + TypeScript project
npx create-react-app siegefront-v2 --template typescript
cd siegefront-v2

# Install core dependencies
npm install immer zustand zod

# Install dev dependencies
npm install --save-dev @types/node

# Optional: Install testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

### Project Structure

```bash
mkdir -p src/{core,ai,nft,state,components,hooks,utils}
mkdir -p src/core/{engine,mechanics,players,types}
mkdir -p src/ai/personalities
mkdir -p src/components/{battle,game,nft}
mkdir -p docs tests
```

### TypeScript Config

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": "src",
    "paths": {
      "@/core/*": ["core/*"],
      "@/ai/*": ["ai/*"],
      "@/state/*": ["state/*"],
      "@/components/*": ["components/*"],
      "@/hooks/*": ["hooks/*"],
      "@/utils/*": ["utils/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "build"]
}
```

---

## Day 1-2: Core Types

### Battle Types

Create `src/core/types/Battle.ts`:

```typescript
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

export interface Player {
  id: string;
  name: string;
  type: 'human' | 'ai';
  strategy: PlayerStrategy;
  mana: number;
  maxMana: number;
  castleHp: number;
  maxCastleHp: number;
  deck: GameCard[];
  hand: GameCard[];
  cardsOnField: BattleCard[];
}

export interface Position {
  x: number; // 0-2
  y: number; // 0-2
}

export interface BattleCard extends GameCard {
  position: Position;
  currentHp: number;
  ownerId: string;
  canAttack: boolean;
  canMove: boolean;
  hasAttackedThisTurn: boolean;
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  type: 'frozen' | 'stunned' | 'poisoned' | 'shielded';
  duration: number;
  value?: number;
}

export interface WeatherEffect {
  type: 'CLEAR' | 'RAIN' | 'STORM' | 'FOG' | 'SNOW';
  duration: number;
}

export interface TerrainEffect {
  position: Position;
  type: 'HIGH_GROUND' | 'FOREST' | 'WATER' | 'RUINS';
  attackBonus: number;
  defenseBonus: number;
}

export interface BattleLogEntry {
  turn: number;
  playerId: string;
  action: string;
  message: string;
  timestamp?: number;
}
```

### Card Types

Create `src/core/types/Card.ts`:

```typescript
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

export interface CardAbility {
  name: string;
  description: string;
  trigger: 'on_deploy' | 'on_attack' | 'on_damage' | 'on_death' | 'on_turn_start' | 'on_turn_end' | 'passive';
  effect: (state: BattleState, card: BattleCard) => BattleState;
}

export interface NFTData {
  contract: string;
  tokenId: string;
  collection: string;
  imageUrl?: string;
  metadata?: any;
}
```

### Action Types

Create `src/core/types/Actions.ts`:

```typescript
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

export interface AttackCardAction {
  type: 'ATTACK_CARD';
  attackerId: string;
  targetId: string;
}

export interface AttackCastleAction {
  type: 'ATTACK_CASTLE';
  attackerId: string;
}

export interface MoveCardAction {
  type: 'MOVE_CARD';
  cardId: string;
  newPosition: Position;
}

export interface UseAbilityAction {
  type: 'USE_ABILITY';
  cardId: string;
  abilityName: string;
  targetId?: string;
}

export interface EndTurnAction {
  type: 'END_TURN';
}
```

### Player Strategy Interface

Create `src/core/players/PlayerStrategy.ts`:

```typescript
export interface PlayerStrategy {
  getAvailableCards(player: Player, state: BattleState): GameCard[];
  onTurnStart(player: Player, state: BattleState): void;
  onTurnEnd(player: Player, state: BattleState): void;
  canPlayCard(card: GameCard, player: Player): boolean;
}
```

---

## Day 2-3: Battle Engine

### Battle Engine Class

Create `src/core/engine/BattleEngine.ts`:

```typescript
import { produce } from 'immer';
import { BattleState, Player, BattleAction } from '../types/Battle';
import { GameCard } from '../types/Card';

export class BattleEngine {
  initializeBattle(
    player1: Player,
    player2: Player
  ): BattleState {
    // Shuffle decks
    player1.deck = this.shuffleDeck([...player1.deck]);
    player2.deck = this.shuffleDeck([...player2.deck]);

    // Draw starting hands
    player1.hand = player1.deck.splice(0, 5);
    player2.hand = player2.deck.splice(0, 5);

    // Create initial state
    return {
      currentTurn: 1,
      phase: 'deployment',
      activePlayerId: player1.id,
      players: {
        [player1.id]: player1,
        [player2.id]: player2
      },
      battlefield: [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ],
      weather: this.generateWeather(),
      terrainEffects: [],
      controlledZones: {},
      winner: null,
      battleLog: [{
        turn: 0,
        playerId: 'system',
        action: 'start',
        message: 'Battle begins!'
      }]
    };
  }

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
        case 'ATTACK_CASTLE':
          this.handleAttackCastle(draft, action);
          break;
        case 'MOVE_CARD':
          this.handleMoveCard(draft, action);
          break;
        case 'USE_ABILITY':
          this.handleUseAbility(draft, action);
          break;
        case 'END_TURN':
          this.handleEndTurn(draft);
          break;
      }

      // Check victory conditions
      this.checkVictoryConditions(draft);
    });
  }

  private handleDeployCard(state: BattleState, action: DeployCardAction) {
    // See GAME_RULES.md for complete implementation
    const player = state.players[state.activePlayerId];

    // Get card (from hand or generated)
    let card: GameCard;
    if (action.generatedCard) {
      card = action.generatedCard;
    } else {
      const cardIndex = player.hand.findIndex(c => c.id === action.cardId);
      card = player.hand[cardIndex];
      player.hand.splice(cardIndex, 1);
    }

    // Validate and deploy...
  }

  private handleAttackCard(state: BattleState, action: AttackCardAction) {
    // See GAME_RULES.md for complete implementation
  }

  private handleEndTurn(state: BattleState) {
    // Switch active player
    const playerIds = Object.keys(state.players);
    const currentIndex = playerIds.indexOf(state.activePlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    state.activePlayerId = playerIds[nextIndex];

    // Increment turn
    state.currentTurn++;

    // Refill mana
    const activePlayer = state.players[state.activePlayerId];
    const newMaxMana = Math.min(state.currentTurn, 10);
    activePlayer.maxMana = newMaxMana;
    activePlayer.mana = newMaxMana;

    // Draw card (human only)
    if (activePlayer.type !== 'ai' && activePlayer.deck.length > 0) {
      const drawnCard = activePlayer.deck.shift()!;
      activePlayer.hand.push(drawnCard);
    }

    // Reset card states
    activePlayer.cardsOnField.forEach(card => {
      card.canAttack = true;
      card.canMove = true;
      card.hasAttackedThisTurn = false;
    });
  }

  private checkVictoryConditions(state: BattleState) {
    // Castle destroyed
    Object.values(state.players).forEach(player => {
      if (player.castleHp <= 0) {
        const opponentIds = Object.keys(state.players).filter(id => id !== player.id);
        state.winner = opponentIds[0];
        state.phase = 'victory';
      }
    });

    // Resources exhausted (human only)
    Object.values(state.players).forEach(player => {
      if (player.type !== 'ai') {
        if (player.hand.length === 0 &&
            player.deck.length === 0 &&
            player.cardsOnField.length === 0) {
          const opponentIds = Object.keys(state.players).filter(id => id !== player.id);
          state.winner = opponentIds[0];
          state.phase = 'victory';
        }
      }
    });
  }

  private shuffleDeck(deck: GameCard[]): GameCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateWeather(): WeatherEffect {
    const types: WeatherEffect['type'][] = ['CLEAR', 'RAIN', 'STORM', 'FOG', 'SNOW'];
    const type = types[Math.floor(Math.random() * types.length)];
    return { type, duration: 3 + Math.floor(Math.random() * 3) };
  }
}
```

---

## Day 3-5: Port AI System

### Copy from Current Build

```bash
# Copy consciousness system files (update imports as you go)
cp ../siegefront/src/utils/consciousnessAI.ts src/ai/ConsciousnessAI.ts
cp ../siegefront/src/utils/consciousnessEngine.ts src/ai/ConsciousnessEngine.ts
cp ../siegefront/src/utils/organicDecisionMaker.ts src/ai/DecisionMaker.ts
cp ../siegefront/src/utils/battleStateHealer.ts src/ai/StateHealer.ts

# Copy card generator (extract from DecisionMaker if needed)
# Create src/ai/CardGenerator.ts
```

### Update Imports

```typescript
// Old imports (remove)
import { BattleState } from '../types/battle';

// New imports (add)
import { BattleState } from '@/core/types/Battle';
import { BattleEngine } from '@/core/engine/BattleEngine';
```

### Create Personality Definitions

Create `src/ai/personalities/TasernPersonalities.ts`:

```typescript
export interface AIPersonality {
  name: string;
  description: string;
  aggression: number;      // 0-1
  creativity: number;      // 0-1
  riskTolerance: number;   // 0-1
  patience: number;        // 0-1
  adaptability: number;    // 0-1
}

export const TASERN_PERSONALITIES: Record<string, AIPersonality> = {
  'Sir Stumbleheart': {
    name: 'Sir Stumbleheart',
    description: 'A noble knight prone to creative blunders',
    aggression: 0.3,
    creativity: 0.8,
    riskTolerance: 0.4,
    patience: 0.6,
    adaptability: 0.7
  },
  // ... add other 4 personalities
};
```

---

## Week 2: State Management

### Create Zustand Store

Create `src/state/battleStore.ts`:

```typescript
import create from 'zustand';
import { BattleState, BattleAction, Player } from '@/core/types/Battle';
import { BattleEngine } from '@/core/engine/BattleEngine';
import { AIPlayer } from '@/core/players/AIPlayer';

const battleEngine = new BattleEngine();

interface BattleStore {
  // State
  battleState: BattleState | null;
  isProcessingAction: boolean;
  selectedCard: string | null;

  // Actions
  initializeBattle: (player1: Player, player2: Player) => void;
  executeAction: (action: BattleAction) => void;
  startAITurn: () => Promise<void>;
  selectCard: (cardId: string | null) => void;
}

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

    try {
      const newState = battleEngine.executeAction(state, action);
      set({ battleState: newState });
    } catch (error) {
      console.error('Action execution failed:', error);
    } finally {
      set({ isProcessingAction: false });
    }
  },

  startAITurn: async () => {
    const state = get().battleState;
    if (!state) return;

    const activePlayer = state.players[state.activePlayerId];
    if (activePlayer.strategy instanceof AIPlayer) {
      const action = await activePlayer.strategy.decideAction(state);
      get().executeAction(action);

      // Continue AI turn if didn't end
      if (action.type !== 'END_TURN') {
        setTimeout(() => get().startAITurn(), 1000);
      }
    }
  },

  selectCard: (cardId) => {
    set({ selectedCard: cardId });
  }
}));
```

---

## Week 3: React UI

### Battle Board Component

Create `src/components/battle/BattleBoard.tsx`:

```typescript
import React from 'react';
import { useBattleStore } from '@/state/battleStore';
import { CardComponent } from './CardComponent';
import { Position } from '@/core/types/Battle';

export function BattleBoard() {
  const battleState = useBattleStore(state => state.battleState);
  const executeAction = useBattleStore(state => state.executeAction);
  const selectedCard = useBattleStore(state => state.selectedCard);

  if (!battleState) {
    return <div>Loading...</div>;
  }

  const handleCellClick = (position: Position) => {
    if (!selectedCard) return;

    // Deploy selected card
    executeAction({
      type: 'DEPLOY_CARD',
      cardId: selectedCard,
      position
    });
  };

  return (
    <div className="battle-board">
      {battleState.battlefield.map((row, y) => (
        <div key={y} className="battle-row">
          {row.map((card, x) => (
            <div
              key={`${x}-${y}`}
              className="battle-cell"
              onClick={() => handleCellClick({ x, y })}
            >
              {card && (
                <CardComponent
                  card={card}
                  onAttack={(targetId) => executeAction({
                    type: 'ATTACK_CARD',
                    attackerId: card.id,
                    targetId
                  })}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Card Component

Create `src/components/battle/CardComponent.tsx`:

```typescript
import React from 'react';
import { BattleCard } from '@/core/types/Battle';

interface CardComponentProps {
  card: BattleCard;
  onAttack?: (targetId: string) => void;
}

export function CardComponent({ card, onAttack }: CardComponentProps) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-name">{card.name}</span>
        <span className="card-mana">{card.manaCost}</span>
      </div>

      <div className="card-image">
        {card.image ? (
          <img src={card.image} alt={card.name} />
        ) : (
          <div className="card-placeholder" />
        )}
      </div>

      <div className="card-stats">
        <span className="card-attack">{card.attack}</span>
        <span className="card-hp">{card.currentHp}/{card.hp}</span>
        <span className="card-speed">{card.speed}</span>
      </div>

      {card.abilities.length > 0 && (
        <div className="card-abilities">
          {card.abilities.map(ability => (
            <div key={ability.name} className="ability">
              {ability.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Main Game Container

Create `src/components/game/GameContainer.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useBattleStore } from '@/state/battleStore';
import { BattleBoard } from '../battle/BattleBoard';
import { PlayerHand } from '../battle/PlayerHand';
import { BattleLog } from '../battle/BattleLog';
import { WeatherDisplay } from '../battle/WeatherDisplay';
import { AIPlayer } from '@/core/players/AIPlayer';
import { HumanPlayer } from '@/core/players/HumanPlayer';

export function GameContainer() {
  const initializeBattle = useBattleStore(state => state.initializeBattle);
  const battleState = useBattleStore(state => state.battleState);
  const startAITurn = useBattleStore(state => state.startAITurn);

  useEffect(() => {
    // Initialize battle on mount
    const humanPlayer = new HumanPlayer('player1', 'You', humanDeck);
    const aiPlayer = new AIPlayer('player2', 'Sir Stumbleheart');

    initializeBattle(humanPlayer, aiPlayer);
  }, []);

  useEffect(() => {
    // Auto-start AI turn
    if (!battleState) return;

    const activePlayer = battleState.players[battleState.activePlayerId];
    if (activePlayer.strategy instanceof AIPlayer) {
      startAITurn();
    }
  }, [battleState?.activePlayerId]);

  if (!battleState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="game-container">
      <WeatherDisplay weather={battleState.weather} />

      <div className="game-main">
        <PlayerHand playerId="player1" />
        <BattleBoard />
        <BattleLog log={battleState.battleLog} />
      </div>
    </div>
  );
}
```

---

## Testing

### Unit Test Example

Create `tests/BattleEngine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { BattleEngine } from '@/core/engine/BattleEngine';
import { HumanPlayer } from '@/core/players/HumanPlayer';

describe('BattleEngine', () => {
  it('initializes battle correctly', () => {
    const engine = new BattleEngine();
    const player1 = new HumanPlayer('p1', 'Player 1', testDeck);
    const player2 = new HumanPlayer('p2', 'Player 2', testDeck);

    const state = engine.initializeBattle(player1, player2);

    expect(state.currentTurn).toBe(1);
    expect(state.players.p1.hand.length).toBe(5);
    expect(state.players.p2.hand.length).toBe(5);
    expect(state.winner).toBeNull();
  });

  it('executes deploy action', () => {
    const engine = new BattleEngine();
    const state = createTestBattleState();

    const newState = engine.executeAction(state, {
      type: 'DEPLOY_CARD',
      cardId: 'card1',
      position: { x: 1, y: 2 }
    });

    expect(newState.battlefield[2][1]).not.toBeNull();
    expect(newState.players.p1.mana).toBeLessThan(state.players.p1.mana);
  });
});
```

---

## Launch Checklist

- [ ] All TypeScript errors resolved
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing (full battles)
- [ ] UI responsive on desktop and mobile
- [ ] NFT integration working (Moralis/Alchemy)
- [ ] LP enhancement calculating correctly
- [ ] AI opponents distinct and playable
- [ ] No state mutation bugs
- [ ] Performance <2s initial load, <100ms actions
- [ ] Build succeeds (`npm run build`)
- [ ] Deploy to Vercel configured
- [ ] Custom domain configured (optional)

---

## Quick Commands

```bash
# Development
npm start              # Start dev server

# Testing
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Building
npm run build         # Production build
npm run preview       # Preview build locally

# Deployment
vercel                # Deploy to Vercel
vercel --prod         # Deploy to production
```

---

## Getting Help

- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **AI System**: See [AI_SYSTEM.md](./AI_SYSTEM.md)
- **Game Rules**: See [GAME_RULES.md](./GAME_RULES.md)
- **Full Blueprint**: See [CHRYSALIS.md](../CHRYSALIS.md)

---

**You've got this, Sam! The hard problems are already solved. Now it's just clean architecture. 🦋**
