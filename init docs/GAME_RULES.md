# ⚔️ Tasern Siegefront - Game Rules & Mechanics

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Code Author**: Sam Lavington (Idl3o/@modsias)
**Universe Creator**: James McGee (@JamesMageeCCC)

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Victory Conditions](#victory-conditions)
3. [Turn Structure](#turn-structure)
4. [Card Deployment](#card-deployment)
5. [Combat System](#combat-system)
6. [Formations](#formations)
7. [Weather & Terrain](#weather--terrain)
8. [Abilities](#abilities)
9. [LP Enhancement](#lp-enhancement)
10. [Implementation Guide](#implementation-guide)

---

## Core Concepts

### The Battlefield

```
         FRONT ZONE       MID ZONE        BACK ZONE
      ┌──────────────┬──────────────┬──────────────┐
Row 0 │   ENEMY      │   ENEMY      │   ENEMY      │  ← Enemy Castle
      │   BACK       │   MID        │   FRONT      │
      ├──────────────┼──────────────┼──────────────┤
Row 1 │   NEUTRAL    │   NEUTRAL    │   NEUTRAL    │  ← Neutral Zone
      │              │              │              │
      ├──────────────┼──────────────┼──────────────┤
Row 2 │   YOUR       │   YOUR       │   YOUR       │  ← Your Castle
      │   FRONT      │   MID        │   BACK       │
      └──────────────┴──────────────┴──────────────┘
       Column 0       Column 1       Column 2
```

**Key Points**:
- **3x3 Grid** - 9 total positions
- **Row Ownership** - Row 0 (enemy), Row 1 (neutral), Row 2 (yours)
- **Zone Types** - Front (attackers), Mid (support), Back (defenders)
- **Castles** - Behind row 0 and row 2, can be attacked

### Resources

#### Mana
- **Starts at 1**, grows each turn
- **Max 10 mana** at turn 10+
- **Spent to deploy cards**
- **Refills at start of turn**

```typescript
// Mana growth
const newMaxMana = Math.min(currentTurn, 10);
player.maxMana = newMaxMana;
player.mana = newMaxMana; // Full refill
```

#### Cards

**Human Players**:
- Start with 30-card deck
- Draw 5 cards at game start
- Draw 1 card per turn
- Hand has no size limit

**AI Players**:
- No deck or hand
- Generate cards dynamically based on:
  - Current mana available
  - Board state (aggressive/defensive mode)
  - Personality (stat distribution)
  - Strategic analysis

### Card Stats

```typescript
interface GameCard {
  id: string;
  name: string;
  manaCost: number;     // Mana to deploy
  attack: number;       // Damage dealt
  hp: number;           // Health points
  speed: number;        // Turn order (1-3)
  defense: number;      // Damage reduction
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  abilities: CardAbility[];
}
```

**Stats Explained**:
- **Attack**: Base damage dealt to targets
- **HP**: How much damage card can take before destroyed
- **Speed**: Higher = attacks first in combat
- **Defense**: Subtracted from incoming damage
- **Abilities**: Special effects (shields, regeneration, etc.)

---

## Victory Conditions

### Primary: Destroy Enemy Castle

**Goal**: Reduce enemy castle HP to 0

```typescript
if (player.castleHp <= 0) {
  battle.winner = opponentId;
  battle.phase = 'victory';
}
```

**Default Castle HP**: 30

### Alternative: Resource Exhaustion (Human Only)

**Goal**: Opponent runs out of cards

```typescript
// Only for human players (AI generates dynamically)
if (player.type !== 'ai') {
  if (player.hand.length === 0 &&
      player.deck.length === 0 &&
      player.cardsOnField.length === 0) {
    battle.winner = opponentId;
    battle.phase = 'victory';
  }
}
```

### Turn Limit

If game reaches turn limit (default 50), player with highest castle HP wins:

```typescript
if (battle.currentTurn > maxTurns) {
  const winner = Object.values(battle.players).reduce((prev, current) =>
    current.castleHp > prev.castleHp ? current : prev
  );
  battle.winner = winner.id;
}
```

---

## Turn Structure

### Turn Phases

```
┌─────────────────────────────────────────────────────┐
│  1. TURN START                                      │
│     - Switch active player                          │
│     - Refill mana                                   │
│     - Draw card (human only)                        │
│     - Reset card actions (canAttack, canMove)       │
│     - Trigger on_turn_start abilities               │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  2. ACTION PHASE (Repeatable)                       │
│     - Deploy card                                   │
│     - Attack with card                              │
│     - Move card                                     │
│     - Use ability                                   │
│     - End turn                                      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│  3. TURN END                                        │
│     - Trigger on_turn_end abilities                 │
│     - Update weather duration                       │
│     - Check victory conditions                      │
│     - Increment turn counter                        │
└─────────────────────────────────────────────────────┘
```

### Turn Start Implementation

```typescript
function startTurn(battle: BattleState): BattleState {
  return produce(battle, draft => {
    // 1. Switch active player
    const playerIds = Object.keys(draft.players);
    const currentIndex = playerIds.indexOf(draft.activePlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    draft.activePlayerId = playerIds[nextIndex];

    const activePlayer = draft.players[draft.activePlayerId];

    // 2. Refill mana
    draft.currentTurn++;
    const newMaxMana = Math.min(draft.currentTurn, 10);
    activePlayer.maxMana = newMaxMana;
    activePlayer.mana = newMaxMana;

    // 3. Draw card (human only)
    if (activePlayer.type !== 'ai' && activePlayer.deck.length > 0) {
      const drawnCard = activePlayer.deck.shift()!;
      activePlayer.hand.push(drawnCard);
    }

    // 4. Reset card actions
    activePlayer.cardsOnField.forEach(card => {
      const frozen = card.statusEffects.some(e => e.type === 'frozen');
      const stunned = card.statusEffects.some(e => e.type === 'stunned');

      card.canAttack = !frozen && !stunned;
      card.canMove = !frozen;
    });

    // 5. Trigger abilities
    abilitySystem.processTriggers(draft, 'on_turn_start');
  });
}
```

---

## Card Deployment

### Deployment Rules

1. **Mana Cost**: Must have enough mana
2. **Empty Space**: Position must be unoccupied
3. **Valid Zone**: Must deploy in your valid zones

### Valid Deployment Zones

```typescript
function isValidDeploymentZone(
  position: Position,
  playerId: string,
  battle: BattleState
): boolean {
  const { x, y } = position;

  // Check if position is on the battlefield
  if (x < 0 || x >= 3 || y < 0 || y >= 3) return false;

  // Check if position is empty
  if (battle.battlefield[y][x] !== null) return false;

  // Determine which row the player owns
  const playerIndex = Object.keys(battle.players).indexOf(playerId);

  if (playerIndex === 0) {
    // First player: can deploy in row 0 (their back zone)
    // and row 1 (neutral zone) if they control it
    return y === 0 || y === 1;
  } else {
    // Second player: can deploy in row 2 (their back zone)
    // and row 1 (neutral zone) if they control it
    return y === 2 || y === 1;
  }
}
```

### Deployment Action

```typescript
interface DeployCardAction {
  type: 'DEPLOY_CARD';
  cardId: string;
  position: Position;
  generatedCard?: GameCard; // For AI dynamic generation
}

function handleDeployCard(
  battle: BattleState,
  action: DeployCardAction
): BattleState {
  return produce(battle, draft => {
    const player = draft.players[draft.activePlayerId];

    // Get card (from hand or generated)
    let card: GameCard;
    if (action.generatedCard) {
      card = action.generatedCard; // AI generated
    } else {
      const cardIndex = player.hand.findIndex(c => c.id === action.cardId);
      if (cardIndex === -1) throw new Error('Card not found in hand');
      card = player.hand[cardIndex];
      player.hand.splice(cardIndex, 1); // Remove from hand
    }

    // Check mana
    if (player.mana < card.manaCost) {
      throw new Error('Not enough mana');
    }

    // Check valid position
    if (!isValidDeploymentZone(action.position, player.id, draft)) {
      throw new Error('Invalid deployment zone');
    }

    // Create battle card
    const battleCard: BattleCard = {
      ...card,
      position: action.position,
      currentHp: card.hp,
      ownerId: player.id,
      canAttack: false, // Can't attack on deploy turn (summoning sickness)
      canMove: true,
      statusEffects: [],
      hasAttackedThisTurn: false
    };

    // Place on battlefield
    draft.battlefield[action.position.y][action.position.x] = battleCard;
    player.cardsOnField.push(battleCard);

    // Spend mana
    player.mana -= card.manaCost;

    // Trigger on_deploy abilities
    abilitySystem.processTriggers(draft, 'on_deploy', battleCard);

    // Log
    draft.battleLog.push({
      turn: draft.currentTurn,
      playerId: player.id,
      action: 'deploy',
      message: `${player.name} deployed ${card.name} at (${action.position.x}, ${action.position.y})`
    });
  });
}
```

---

## Combat System

### Attack Types

#### 1. Card → Card Attack

```typescript
interface AttackCardAction {
  type: 'ATTACK_CARD';
  attackerId: string;
  targetId: string;
}
```

**Rules**:
- Attacker must be able to attack (`canAttack === true`)
- Target must be an enemy card
- Target must be reachable (adjacent or ranged)

**Damage Calculation**:
```typescript
// Base damage
let damage = attacker.attack;

// Apply formation bonuses
damage *= getFormationBonus(attacker, battlefield);

// Apply weather effects
damage *= getWeatherModifier(attacker, weather);

// Apply terrain effects
damage *= getTerrainModifier(attacker.position, terrainEffects);

// Critical hit (10% chance, 1.5x damage)
if (Math.random() < 0.1) {
  damage *= 1.5;
  isCritical = true;
}

// Subtract defender's defense
damage -= defender.defense;

// Minimum 1 damage
damage = Math.max(1, Math.floor(damage));

// Apply to defender HP
defender.currentHp -= damage;
```

#### 2. Card → Castle Attack

```typescript
interface AttackCastleAction {
  type: 'ATTACK_CASTLE';
  attackerId: string;
}
```

**Rules**:
- Attacker must be in front zone (row 0 or row 2 depending on owner)
- No enemy cards blocking the path
- Attacker must be able to attack

**Damage Calculation**:
```typescript
// Direct damage to castle
let damage = attacker.attack;

// Apply bonuses (formation, weather, terrain)
damage *= getAllModifiers(attacker, battlefield, weather, terrain);

// Apply to enemy castle
enemyPlayer.castleHp -= Math.floor(damage);

// Check victory
if (enemyPlayer.castleHp <= 0) {
  battle.winner = activePlayer.id;
  battle.phase = 'victory';
}
```

### Combat Flow

```
Attacker attacks Target
    ↓
Calculate base damage (attacker.attack)
    ↓
Apply formation bonus (Vanguard: +20% attack)
    ↓
Apply weather modifier (Storm: -10% attack)
    ↓
Apply terrain bonus (High Ground: +15% attack)
    ↓
Check for critical hit (10% chance, 1.5x)
    ↓
Subtract target defense
    ↓
Ensure minimum 1 damage
    ↓
Apply damage to target HP
    ↓
If target HP <= 0:
  - Remove from battlefield
  - Trigger on_death abilities
  - Add to graveyard
```

### Speed & Turn Order

When multiple cards can act, **speed determines order**:

```typescript
// Sort cards by speed (highest first)
const actingCards = player.cardsOnField
  .filter(c => c.canAttack)
  .sort((a, b) => b.speed - a.speed);

// Higher speed attacks first
// Speed 3 → Speed 2 → Speed 1
```

**Simultaneous Combat**:
If attacker and defender both have speed 2, they deal damage simultaneously:

```typescript
if (attacker.speed === defender.speed) {
  // Both take damage
  attacker.currentHp -= calculateDamage(defender, attacker);
  defender.currentHp -= calculateDamage(attacker, defender);

  // Check if both died
  if (attacker.currentHp <= 0) removeCard(attacker);
  if (defender.currentHp <= 0) removeCard(defender);
}
```

---

## Formations

**Formations**: Positional bonuses based on card arrangement

### 6 Formation Types

```typescript
type Formation =
  | 'VANGUARD'        // Front-line attackers
  | 'PHALANX'         // Defensive wall
  | 'SKIRMISH'        // Scattered units
  | 'ARCHER_LINE'     // Back-row attackers
  | 'FLANKING'        // Side positioning
  | 'SIEGE';          // Castle focus
```

### Formation Detection

```typescript
function detectFormation(
  playerId: string,
  battlefield: (BattleCard | null)[][]
): Formation | null {
  const playerCards = battlefield.flat()
    .filter(c => c && c.ownerId === playerId);

  if (playerCards.length < 2) return null;

  // VANGUARD: 2+ cards in front zone
  const frontCards = playerCards.filter(c =>
    isInFrontZone(c.position, playerId, battlefield)
  );
  if (frontCards.length >= 2) return 'VANGUARD';

  // PHALANX: 3+ cards in horizontal line
  const rows = [0, 1, 2];
  for (const y of rows) {
    const rowCards = playerCards.filter(c => c.position.y === y);
    if (rowCards.length === 3) return 'PHALANX';
  }

  // ARCHER_LINE: 2+ cards in back zone
  const backCards = playerCards.filter(c =>
    isInBackZone(c.position, playerId, battlefield)
  );
  if (backCards.length >= 2) return 'ARCHER_LINE';

  // FLANKING: Cards on both sides (column 0 and 2)
  const leftCards = playerCards.filter(c => c.position.x === 0);
  const rightCards = playerCards.filter(c => c.position.x === 2);
  if (leftCards.length > 0 && rightCards.length > 0) return 'FLANKING';

  // SIEGE: 2+ cards in enemy zones
  const enemyZoneCards = playerCards.filter(c =>
    isInEnemyZone(c.position, playerId, battlefield)
  );
  if (enemyZoneCards.length >= 2) return 'SIEGE';

  // SKIRMISH: Default (no formation)
  return 'SKIRMISH';
}
```

### Formation Bonuses

```typescript
const FORMATION_BONUSES = {
  VANGUARD: {
    attackBonus: 1.2,      // +20% attack
    defenseBonus: 1.0,
    speedBonus: 1.0,
    description: 'Front-line assault: +20% attack'
  },
  PHALANX: {
    attackBonus: 1.0,
    defenseBonus: 1.3,     // +30% defense
    speedBonus: 0.9,       // -10% speed
    description: 'Defensive wall: +30% defense, -10% speed'
  },
  ARCHER_LINE: {
    attackBonus: 1.15,     // +15% attack
    defenseBonus: 0.9,     // -10% defense
    speedBonus: 1.0,
    description: 'Ranged support: +15% attack, -10% defense'
  },
  FLANKING: {
    attackBonus: 1.1,      // +10% attack
    defenseBonus: 1.0,
    speedBonus: 1.15,      // +15% speed
    description: 'Outmaneuver: +10% attack, +15% speed'
  },
  SIEGE: {
    attackBonus: 1.25,     // +25% attack on castles
    defenseBonus: 0.85,    // -15% defense
    speedBonus: 1.0,
    description: 'Castle assault: +25% attack, -15% defense'
  },
  SKIRMISH: {
    attackBonus: 1.0,
    defenseBonus: 1.0,
    speedBonus: 1.05,      // +5% speed
    description: 'Flexibility: +5% speed'
  }
};

function getFormationBonus(
  card: BattleCard,
  battlefield: (BattleCard | null)[][]
): number {
  const formation = detectFormation(card.ownerId, battlefield);
  if (!formation) return 1.0;

  const bonus = FORMATION_BONUSES[formation];
  return bonus.attackBonus;
}
```

---

## Weather & Terrain

### Weather System

**Weather**: Global effects that affect all cards

```typescript
interface WeatherEffect {
  type: 'CLEAR' | 'RAIN' | 'STORM' | 'FOG' | 'SNOW';
  duration: number; // Turns remaining
}
```

### Weather Effects

```typescript
const WEATHER_EFFECTS = {
  CLEAR: {
    attackModifier: 1.0,
    defenseModifier: 1.0,
    speedModifier: 1.0,
    description: 'Normal conditions'
  },
  RAIN: {
    attackModifier: 0.9,    // -10% attack
    defenseModifier: 1.0,
    speedModifier: 0.95,    // -5% speed
    description: 'Rain: -10% attack, -5% speed'
  },
  STORM: {
    attackModifier: 0.8,    // -20% attack
    defenseModifier: 1.0,
    speedModifier: 0.9,     // -10% speed
    description: 'Storm: -20% attack, -10% speed'
  },
  FOG: {
    attackModifier: 0.85,   // -15% attack
    defenseModifier: 1.1,   // +10% defense
    speedModifier: 1.0,
    description: 'Fog: -15% attack, +10% defense'
  },
  SNOW: {
    attackModifier: 1.0,
    defenseModifier: 0.9,   // -10% defense
    speedModifier: 0.85,    // -15% speed
    description: 'Snow: -10% defense, -15% speed'
  }
};
```

### Weather Duration

```typescript
// Weather lasts 3-5 turns
function generateWeather(): WeatherEffect {
  const types: WeatherEffect['type'][] = ['CLEAR', 'RAIN', 'STORM', 'FOG', 'SNOW'];
  const type = types[Math.floor(Math.random() * types.length)];
  const duration = 3 + Math.floor(Math.random() * 3); // 3-5 turns

  return { type, duration };
}

// Update weather each turn
function updateWeather(battle: BattleState): void {
  if (battle.weather) {
    battle.weather.duration--;

    if (battle.weather.duration <= 0) {
      // Generate new weather
      battle.weather = generateWeather();
    }
  }
}
```

### Terrain Effects

**Terrain**: Position-specific bonuses

```typescript
interface TerrainEffect {
  position: Position;
  type: 'HIGH_GROUND' | 'FOREST' | 'WATER' | 'RUINS';
  attackBonus: number;
  defenseBonus: number;
}
```

### Terrain Bonuses

```typescript
const TERRAIN_BONUSES = {
  HIGH_GROUND: {
    attackBonus: 1.15,      // +15% attack
    defenseBonus: 1.1,      // +10% defense
    description: 'High ground advantage'
  },
  FOREST: {
    attackBonus: 1.0,
    defenseBonus: 1.2,      // +20% defense
    description: 'Forest cover'
  },
  WATER: {
    attackBonus: 0.9,       // -10% attack
    defenseBonus: 0.9,      // -10% defense
    description: 'Difficult terrain'
  },
  RUINS: {
    attackBonus: 1.05,      // +5% attack
    defenseBonus: 1.15,     // +15% defense
    description: 'Ancient fortifications'
  }
};

function getTerrainBonus(
  position: Position,
  terrainEffects: TerrainEffect[]
): number {
  const terrain = terrainEffects.find(t =>
    t.position.x === position.x && t.position.y === position.y
  );

  if (!terrain) return 1.0;

  return TERRAIN_BONUSES[terrain.type].attackBonus;
}
```

---

## Abilities

### Ability System

**Abilities**: Special card effects

```typescript
interface CardAbility {
  name: string;
  description: string;
  trigger: 'on_deploy' | 'on_attack' | 'on_damage' | 'on_death' | 'passive';
  effect: (state: BattleState, card: BattleCard) => BattleState;
}
```

### Example Abilities

#### Shield (Passive)
```typescript
{
  name: 'Shield',
  description: '+50% defense',
  trigger: 'passive',
  effect: (state, card) => {
    card.defense *= 1.5;
    return state;
  }
}
```

#### Regeneration (On Turn Start)
```typescript
{
  name: 'Regeneration',
  description: 'Heal 2 HP at start of turn',
  trigger: 'on_turn_start',
  effect: (state, card) => {
    card.currentHp = Math.min(card.currentHp + 2, card.hp);
    return state;
  }
}
```

#### Fireball (On Deploy)
```typescript
{
  name: 'Fireball',
  description: 'Deal 3 damage to random enemy',
  trigger: 'on_deploy',
  effect: (state, card) => {
    const enemies = state.battlefield.flat()
      .filter(c => c && c.ownerId !== card.ownerId);

    if (enemies.length > 0) {
      const target = enemies[Math.floor(Math.random() * enemies.length)];
      target.currentHp -= 3;

      if (target.currentHp <= 0) {
        removeCard(state, target);
      }
    }

    return state;
  }
}
```

### Ability Processing

```typescript
class AbilitySystem {
  processTriggers(
    state: BattleState,
    trigger: AbilityTrigger,
    sourceCard?: BattleCard
  ): void {
    const cards = sourceCard
      ? [sourceCard]
      : state.battlefield.flat().filter(c => c !== null);

    cards.forEach(card => {
      card.abilities
        .filter(ability => ability.trigger === trigger)
        .forEach(ability => {
          state = ability.effect(state, card);
        });
    });
  }
}
```

---

## LP Enhancement

### LP → Stats Formula

**LP Holdings** directly boost card power:

```
Each 0.01 LP token = +5% to all stats
```

**Example**:
- Card: 5 attack, 10 HP
- Player has 0.1 LP tokens
- Enhancement: 0.1 / 0.01 = 10 × 5% = 50% boost
- Result: 7.5 attack (rounds to 8), 15 HP

### Implementation

```typescript
interface LPHolding {
  tokenAddress: string;
  amount: number; // In tokens (e.g. 0.05)
  nftId: string;  // Associated NFT
}

function calculateLPBonus(lpHoldings: LPHolding[]): number {
  const totalLP = lpHoldings.reduce((sum, holding) => sum + holding.amount, 0);
  const multiplier = Math.floor(totalLP / 0.01) * 0.05;
  return 1 + multiplier; // 1.0 = 0%, 1.5 = 50% boost
}

function enhanceCard(card: GameCard, lpBonus: number): GameCard {
  return {
    ...card,
    attack: Math.floor(card.attack * lpBonus),
    hp: Math.floor(card.hp * lpBonus),
    defense: Math.floor(card.defense * lpBonus),
    impactMultiplier: lpBonus
  };
}
```

### LP Discovery Flow

```
User connects wallet
    ↓
Fetch user's NFTs (Moralis/Alchemy)
    ↓
For each NFT:
  1. Get NFT contract address
  2. Check transaction history
  3. Look for LP token interactions
  4. Detect EIP-1167 proxies
  5. Calculate LP holdings
    ↓
Sum total LP across all NFTs
    ↓
Calculate enhancement multiplier
    ↓
Apply to all cards in deck
```

---

## Implementation Guide

### Damage Calculation (Complete)

```typescript
function calculateDamage(
  attacker: BattleCard,
  defender: BattleCard,
  battle: BattleState
): { damage: number; isCritical: boolean } {
  // 1. Base damage
  let damage = attacker.attack;

  // 2. Formation bonus
  const formation = detectFormation(attacker.ownerId, battle.battlefield);
  if (formation) {
    const formationBonus = FORMATION_BONUSES[formation];
    damage *= formationBonus.attackBonus;
  }

  // 3. Weather modifier
  if (battle.weather) {
    const weatherEffect = WEATHER_EFFECTS[battle.weather.type];
    damage *= weatherEffect.attackModifier;
  }

  // 4. Terrain bonus
  const terrain = battle.terrainEffects.find(t =>
    t.position.x === attacker.position.x &&
    t.position.y === attacker.position.y
  );
  if (terrain) {
    damage *= TERRAIN_BONUSES[terrain.type].attackBonus;
  }

  // 5. Critical hit (10% chance)
  let isCritical = false;
  if (Math.random() < 0.1) {
    damage *= 1.5;
    isCritical = true;
  }

  // 6. Subtract defender's defense
  damage -= defender.defense;

  // 7. Minimum 1 damage
  damage = Math.max(1, Math.floor(damage));

  return { damage, isCritical };
}
```

### Complete Combat Function

```typescript
function handleAttackCard(
  battle: BattleState,
  action: AttackCardAction
): BattleState {
  return produce(battle, draft => {
    // Find attacker and defender
    const attacker = findCard(draft.battlefield, action.attackerId);
    const defender = findCard(draft.battlefield, action.targetId);

    if (!attacker || !defender) {
      throw new Error('Card not found');
    }

    // Validate attack
    if (!attacker.canAttack) {
      throw new Error('Card cannot attack');
    }

    if (attacker.hasAttackedThisTurn) {
      throw new Error('Card already attacked this turn');
    }

    if (attacker.ownerId === defender.ownerId) {
      throw new Error('Cannot attack own card');
    }

    // Calculate damage
    const { damage, isCritical } = calculateDamage(attacker, defender, draft);

    // Apply damage
    defender.currentHp -= damage;

    // Mark attacker as having attacked
    attacker.hasAttackedThisTurn = true;
    attacker.canAttack = false;

    // Log combat
    draft.battleLog.push({
      turn: draft.currentTurn,
      playerId: attacker.ownerId,
      action: 'attack',
      message: `${attacker.name} attacks ${defender.name} for ${damage} damage${isCritical ? ' (CRITICAL!)' : ''}`
    });

    // Check if defender died
    if (defender.currentHp <= 0) {
      // Trigger on_death abilities
      abilitySystem.processTriggers(draft, 'on_death', defender);

      // Remove from battlefield
      const pos = defender.position;
      draft.battlefield[pos.y][pos.x] = null;

      // Remove from player's cardsOnField
      const owner = draft.players[defender.ownerId];
      owner.cardsOnField = owner.cardsOnField.filter(c => c.id !== defender.id);

      // Log death
      draft.battleLog.push({
        turn: draft.currentTurn,
        playerId: defender.ownerId,
        action: 'death',
        message: `${defender.name} was destroyed!`
      });
    }
  });
}
```

---

**Prev**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
**Prev**: See [AI_SYSTEM.md](./AI_SYSTEM.md) for AI deep dive
