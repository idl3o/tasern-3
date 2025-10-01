# 🧠 Consciousness AI System - Technical Deep Dive

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Code Author**: Sam Lavington (Idl3o/@modsias)
**Universe Creator**: James McGee (@JamesMageeCCC)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Decision Making Process](#decision-making-process)
4. [Dynamic Card Generation](#dynamic-card-generation)
5. [Personality System](#personality-system)
6. [State Healing](#state-healing)
7. [Memory & Learning](#memory--learning)
8. [Implementation Guide](#implementation-guide)

---

## Overview

The **Consciousness AI** is not just an opponent - it's an aware entity that:
- ✅ Understands itself (health, confidence, stuck detection)
- ✅ Adapts to board state (aggressive, defensive, desperate modes)
- ✅ Makes intentional choices (not always optimal, personality-driven)
- ✅ Generates cards dynamically (no deck needed)
- ✅ Heals corrupted state (validation and repair)
- ✅ Builds memory (learns from past actions)

**Philosophy**: The AI should feel organic and intentional, not robotic and optimal. It makes mistakes, takes risks, and has personality.

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     ConsciousnessAI                         │
│                  (Main Orchestrator)                        │
│                                                             │
│  async decideAction(state) → BattleAction                  │
└─────────────────────────────────────────────────────────────┘
               ↓             ↓              ↓
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Consciousness│  │   Decision   │  │    State     │
    │   Engine     │  │    Maker     │  │    Healer    │
    │              │  │              │  │              │
    │ - Self-aware │  │ - Evaluate   │  │ - Validate   │
    │ - Strategic  │  │ - Score      │  │ - Repair     │
    │ - Memory     │  │ - Generate   │  │ - Diagnose   │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### Module Breakdown

#### 1. **ConsciousnessAI** (Orchestrator)
**Location**: `src/ai/ConsciousnessAI.ts`

Main decision loop coordinator. No business logic here - delegates to subsystems.

```typescript
export class ConsciousnessAI {
  private consciousness: ConsciousnessEngine;
  private decisionMaker: DecisionMaker;
  private stateHealer: StateHealer;
  private battleEngine: BattleEngine;

  async decideAction(state: BattleState): Promise<BattleAction> {
    // 1. Heal state
    const healedState = this.stateHealer.validateAndHeal(state);

    // 2. Self-check
    const health = this.consciousness.selfCheck(healedState);

    // 3. Strategic analysis
    const strategic = this.consciousness.analyzeStrategicState(healedState);

    // 4. Generate action options
    const options = this.decisionMaker.evaluateAllActions(healedState);

    // 5. Choose with personality
    const chosen = this.chooseWithPersonality(options);

    // 6. Record for learning
    this.consciousness.recordAction(chosen);

    return chosen.action;
  }
}
```

#### 2. **ConsciousnessEngine** (Self-Awareness)
**Location**: `src/ai/ConsciousnessEngine.ts`

Introspection and strategic understanding.

**Responsibilities**:
- Self-health check (confidence, stuck detection)
- Strategic mode detection (aggressive, defensive, adaptive, desperate, experimental)
- Memory management (action history, reasoning trails)
- Emotional state tracking

```typescript
export class ConsciousnessEngine {
  selfCheck(state: BattleState, aiPlayerId: string): HealthCheck {
    return {
      isHealthy: true,
      confidence: 0.8,
      stuckCounter: 0,
      issues: [],
      recommendations: []
    };
  }

  analyzeStrategicState(state: BattleState, aiPlayerId: string): StrategicAnalysis {
    const aiPlayer = state.players[aiPlayerId];
    const opponent = Object.values(state.players).find(p => p.id !== aiPlayerId);

    // Calculate board control
    const boardControl = this.calculateBoardControl(state, aiPlayerId);

    // Determine strategic mode
    let mode: StrategicMode = 'adaptive';
    if (aiPlayer.castleHp < aiPlayer.maxCastleHp * 0.3) {
      mode = 'desperate'; // Low HP - all-in
    } else if (boardControl > 0.6) {
      mode = 'aggressive'; // Winning - push advantage
    } else if (boardControl < 0.4) {
      mode = 'defensive'; // Losing - stabilize
    }

    return {
      mode,
      boardControl,
      threatLevel: this.assessThreat(state, opponent),
      opportunityScore: this.assessOpportunity(state, aiPlayer),
      turnPhase: state.currentTurn < 5 ? 'early' : state.currentTurn < 10 ? 'mid' : 'late'
    };
  }
}
```

#### 3. **DecisionMaker** (Action Evaluation)
**Location**: `src/ai/DecisionMaker.ts`

Generates and scores possible actions.

**Responsibilities**:
- Generate all legal actions
- Score each action (value, risk, creativity)
- Sort by score
- Return top options

```typescript
export class DecisionMaker {
  evaluateAllActions(context: DecisionContext): ActionPath[] {
    const { battleState, aiPlayerId } = context;
    const actions: BattleAction[] = [];

    // Generate deployment actions (with dynamic card generation)
    actions.push(...this.generateDeployActions(battleState, aiPlayerId));

    // Generate attack actions
    actions.push(...this.generateAttackActions(battleState, aiPlayerId));

    // Generate move actions
    actions.push(...this.generateMoveActions(battleState, aiPlayerId));

    // Score each action
    const scoredActions = actions.map(action => ({
      action,
      score: this.scoreAction(action, battleState, context),
      reasoning: this.explainAction(action, battleState),
      risk: this.assessRisk(action, battleState),
      creativity: this.assessCreativity(action, battleState)
    }));

    // Sort by score
    return scoredActions.sort((a, b) => b.score - a.score);
  }

  private scoreAction(
    action: BattleAction,
    state: BattleState,
    context: DecisionContext
  ): number {
    // Simulate action to get result state
    const resultState = context.battleEngine.executeAction(state, action);

    // Multi-factor scoring
    let score = 0;

    // Board control gain
    score += this.scoreBoardControl(state, resultState, context.aiPlayerId) * 30;

    // Damage dealt
    score += this.scoreDamageDealt(state, resultState) * 20;

    // Resource efficiency
    score += this.scoreResourceEfficiency(action, state) * 15;

    // Positioning value
    score += this.scorePositioning(action, state) * 10;

    // Threat response
    score += this.scoreThreatResponse(state, resultState, context) * 25;

    return score;
  }
}
```

#### 4. **CardGenerator** (Dynamic Generation)
**Location**: `src/ai/CardGenerator.ts`

Creates cards on-demand based on board state.

```typescript
export class CardGenerator {
  generateStrategicCards(
    state: BattleState,
    player: Player,
    count: number = 3
  ): GameCard[] {
    const strategic = this.analyzeStrategicMode(state, player);
    const personality = this.personality;

    const cards: GameCard[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(this.generateSingleCard(player.mana, strategic, personality, i));
    }

    return cards;
  }

  private generateSingleCard(
    maxMana: number,
    strategic: StrategicAnalysis,
    personality: AIPersonality,
    index: number
  ): GameCard {
    // Mana cost - distribute across curve
    const manaCost = this.determineManaCost(maxMana, index);

    // Stats - personality affects distribution
    const baseStats = manaCost * 2;
    const aggression = personality.aggression;
    const attack = Math.floor(baseStats * (0.5 + aggression * 0.5));
    const hp = Math.floor(baseStats * (1.5 - aggression * 0.5));

    // Name - thematic based on strategic mode
    const name = this.getThematicName(strategic.mode);

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
    };
  }

  private getThematicName(mode: StrategicMode): string {
    const themes = {
      aggressive: ['Charging Warbeast', 'Blitz Striker', 'Fury Knight'],
      defensive: ['Stalwart Guardian', 'Wall of Stone', 'Shield Bearer'],
      adaptive: ['Tactical Mercenary', 'Swift Strategist', 'Adaptive Warrior'],
      experimental: ['Arcane Experiment', 'Wild Innovator', 'Chaos Conjurer'],
      desperate: ['Last Stand Hero', 'Desperate Gambit', 'Final Hope']
    };

    const names = themes[mode] || themes.adaptive;
    return names[Math.floor(Math.random() * names.length)];
  }
}
```

#### 5. **StateHealer** (Validation & Repair)
**Location**: `src/ai/StateHealer.ts`

Catches corruption before it crashes the game.

```typescript
export class StateHealer {
  validateAndHeal(state: BattleState): { state: BattleState; report: HealthReport } {
    const issues: StateIssue[] = [];
    const healings: StateHealing[] = [];

    let healedState = produce(state, draft => {
      // Check for null references
      this.checkNullReferences(draft, issues, healings);

      // Check for invalid positions
      this.checkPositions(draft, issues, healings);

      // Check for inconsistent data
      this.checkConsistency(draft, issues, healings);

      // Check for resource issues (skip for AI)
      this.checkResources(draft, issues, healings);
    });

    return {
      state: healedState,
      report: {
        issues,
        healings,
        finalState: issues.some(i => i.severity === 'critical') ? 'critical' : 'healthy'
      }
    };
  }

  private checkNullReferences(
    state: BattleState,
    issues: StateIssue[],
    healings: StateHealing[]
  ): void {
    // Check battlefield for null cards that should exist
    state.battlefield.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell && !cell.id) {
          issues.push({
            severity: 'critical',
            category: 'NullReference',
            description: `Card at (${x},${y}) missing ID`,
            location: `battlefield[${y}][${x}]`
          });

          // Heal: Remove invalid card
          row[x] = null;
          healings.push({
            issue: 'Missing card ID',
            action: 'Removed invalid card',
            before: 'Invalid card object',
            after: 'null'
          });
        }
      });
    });
  }
}
```

---

## Decision Making Process

### The 6-Step Loop

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: HEAL                                               │
│  Validate state, repair corruption                          │
│  ✓ Check null references                                    │
│  ✓ Validate positions                                       │
│  ✓ Fix inconsistencies                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: SELF-AWARENESS                                     │
│  Check AI health, confidence, stuck state                   │
│  ✓ Confidence > 0.3? Continue : End turn                    │
│  ✓ Stuck counter < 3? Continue : End turn                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: STRATEGIC ANALYSIS                                 │
│  Understand battlefield, determine mode                     │
│  ✓ Board control (0-1)                                      │
│  ✓ Threat level (0-1)                                       │
│  ✓ Mode: aggressive|defensive|adaptive|desperate|experimental│
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: GENERATE OPTIONS                                   │
│  List all legal actions, generate cards dynamically         │
│  ✓ Deploy actions (with generated cards)                    │
│  ✓ Attack actions (card → card, card → castle)              │
│  ✓ Move actions                                             │
│  ✓ Ability actions                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: SCORE & CHOOSE                                     │
│  Evaluate each action, choose with personality              │
│  ✓ Simulate action                                          │
│  ✓ Score (value, risk, creativity)                          │
│  ✓ Sort by score                                            │
│  ✓ Apply personality variance (not always optimal!)         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: RECORD & LEARN                                     │
│  Build memory, update emotional state                       │
│  ✓ Record action + reasoning                                │
│  ✓ Increment turn count                                     │
│  ✓ Update confidence                                        │
└─────────────────────────────────────────────────────────────┘
```

### Code Example: Full Decision Loop

```typescript
async decideAction(battleState: BattleState): Promise<BattleAction | null> {
  console.log('\n' + '='.repeat(60));
  console.log(`🌟 CONSCIOUSNESS AI: ${this.personality.name}'s Turn`);
  console.log('='.repeat(60));

  // STEP 1: HEAL
  console.log('\n🏥 STEP 1: State Healing...');
  const { state: healedState, report } = this.stateHealer.validateAndHeal(battleState);

  if (report.finalState === 'critical') {
    console.error('🏥 ❌ Critical state issues, cannot proceed');
    return { type: 'END_TURN' };
  }

  // STEP 2: SELF-AWARENESS
  console.log('\n🧠 STEP 2: Self-Awareness Check...');
  const health = this.consciousness.selfCheck(healedState, this.aiPlayerId);

  if (!health.isHealthy) {
    console.warn('🧠 ⚠️ AI not healthy:', health.issues);
    if (health.confidence < 0.3 || health.stuckCounter >= 3) {
      console.log('🧠 Forcing end turn due to low confidence/stuck');
      return { type: 'END_TURN' };
    }
  }

  // STEP 3: STRATEGIC AWARENESS
  console.log('\n⚔️ STEP 3: Strategic Analysis...');
  const strategic = this.consciousness.analyzeStrategicState(healedState, this.aiPlayerId);
  console.log(`   Mode: ${strategic.mode.toUpperCase()}`);
  console.log(`   Board Control: ${strategic.boardControl.toFixed(2)}`);
  console.log(`   Threat Level: ${(strategic.threatLevel * 100).toFixed(0)}%`);

  // STEP 4: EVALUATE OPTIONS
  console.log('\n🌊 STEP 4: Evaluating Actions...');
  const actionPaths = this.decisionMaker.evaluateAllActions({
    battleState: healedState,
    aiPlayerId: this.aiPlayerId,
    consciousness: this.consciousness,
    battleEngine: this.battleEngine
  });

  if (actionPaths.length === 0) {
    console.log('🌊 No valid actions - ending turn');
    this.consciousness.recordAction(
      healedState.currentTurn,
      { type: 'END_TURN' },
      'success',
      'No actions available'
    );
    return { type: 'END_TURN' };
  }

  // STEP 5: CHOOSE WITH PERSONALITY
  console.log('\n🎯 STEP 5: Making Choice...');
  const chosen = this.chooseActionWithPersonality(actionPaths);

  console.log(`   ✅ Selected: ${this.describeAction(chosen.action)}`);
  console.log(`   Score: ${chosen.score.toFixed(1)} | Risk: ${chosen.reasoning.riskLevel}`);
  console.log(`   Intent: ${chosen.reasoning.primaryIntent}`);
  console.log(`   Reasoning: ${chosen.reasoning.explanation}`);

  // STEP 6: RECORD & LEARN
  this.consciousness.recordAction(
    healedState.currentTurn,
    chosen.action,
    'success',
    chosen.reasoning.explanation
  );
  this.consciousness.incrementTurnCount();

  console.log('='.repeat(60) + '\n');

  return chosen.action;
}
```

---

## Dynamic Card Generation

### Why No Deck?

Traditional AI with deck/hand has problems:
- **Resource management complexity** - Must track deck depletion
- **Game-over on empty deck** - Artificial loss condition
- **Static responses** - Can't adapt card quality to difficulty
- **Memory overhead** - Storing unnecessary cards

**Solution**: Generate cards on-demand based on board state.

### Generation Flow

```
AI needs to deploy
    ↓
DecisionMaker.generateDeployActions()
    ↓
CardGenerator.generateStrategicCards(state, player)
    ↓
    1. Analyze strategic mode (aggressive/defensive/etc)
    2. Get AI personality (aggression, creativity, etc)
    3. Generate 3 cards:
       - Low cost (1-3 mana)
       - Medium cost (3-5 mana)
       - Flexible cost (1-maxMana)
    4. Stats from personality:
       - Aggressive: High attack, lower HP
       - Defensive: Lower attack, high HP
    5. Thematic names from strategic mode
    ↓
Cards attached to actions via `generatedCard` property
    ↓
Battle engine deploys without checking hand
```

### Stat Formula

```typescript
// Base stats scale with mana cost
const baseStats = manaCost * 2;

// Personality affects distribution
const aggression = personality.aggression; // 0-1

// Aggressive = more attack, less HP
const attack = Math.floor(baseStats * (0.5 + aggression * 0.5));
const hp = Math.floor(baseStats * (1.5 - aggression * 0.5));

// Example: manaCost=5, aggression=0.8
// baseStats = 10
// attack = Math.floor(10 * (0.5 + 0.8 * 0.5)) = 9
// hp = Math.floor(10 * (1.5 - 0.8 * 0.5)) = 11
// Total = 20 (balanced)

// Example: manaCost=5, aggression=0.2
// attack = Math.floor(10 * (0.5 + 0.2 * 0.5)) = 6
// hp = Math.floor(10 * (1.5 - 0.2 * 0.5)) = 14
// Total = 20 (still balanced, just distributed differently)
```

### Mana Curve Distribution

```typescript
// Generate 3 cards with different costs
for (let i = 0; i < 3; i++) {
  let manaCost: number;

  if (i === 0) {
    // First card: Low cost (1-3 mana)
    manaCost = Math.min(maxMana, Math.max(1, Math.floor(Math.random() * 3) + 1));
  } else if (i === 1) {
    // Second card: Medium cost (3-5 mana)
    manaCost = Math.min(maxMana, Math.max(2, Math.floor(Math.random() * 3) + 3));
  } else {
    // Third card: Flexible (1 to maxMana)
    manaCost = Math.min(maxMana, Math.max(1, Math.floor(Math.random() * maxMana) + 1));
  }

  cards.push(generateSingleCard(manaCost, strategic, personality, i));
}
```

### Action Attachment Pattern

```typescript
// Generate cards
const generatedCards = cardGenerator.generateStrategicCards(state, player);

// Attach to deploy actions
const deployActions = [];
generatedCards.filter(c => c.manaCost <= player.mana).forEach(card => {
  validPositions.forEach(pos => {
    deployActions.push({
      type: 'DEPLOY_CARD',
      cardId: card.id,
      position: pos,
      generatedCard: card  // ⭐ Card travels with action
    });
  });
});

// Battle engine checks for generated card
function handleDeployCard(state, action) {
  let card: GameCard;

  if (action.generatedCard) {
    // Use generated card
    card = action.generatedCard;
  } else {
    // Find in player hand (human players)
    card = player.hand.find(c => c.id === action.cardId);
  }

  // Deploy card
  state.battlefield[y][x] = createBattleCard(card);

  // Only remove from hand if not generated
  if (!action.generatedCard) {
    player.hand = player.hand.filter(c => c.id !== card.id);
  }

  player.mana -= card.manaCost;
}
```

---

## Personality System

### 5 Tasern Opponents

```typescript
export const TASERN_PERSONALITIES: Record<string, AIPersonality> = {
  'Sir Stumbleheart': {
    name: 'Sir Stumbleheart',
    description: 'A noble knight prone to creative blunders',
    aggression: 0.3,       // Low - prefers HP over attack
    creativity: 0.8,       // High - makes unusual plays
    riskTolerance: 0.4,    // Low - avoids risky gambles
    patience: 0.6,         // Medium - balanced tempo
    adaptability: 0.7      // High - responds to board
  },

  'Lady Swiftblade': {
    name: 'Lady Swiftblade',
    description: 'A lightning-fast duelist',
    aggression: 0.8,       // High - attack > HP
    creativity: 0.5,       // Medium
    riskTolerance: 0.7,    // High - takes gambles
    patience: 0.3,         // Low - aggressive tempo
    adaptability: 0.6      // Medium
  },

  'Thornwick the Tactician': {
    name: 'Thornwick the Tactician',
    description: 'A methodical strategist',
    aggression: 0.5,       // Balanced
    creativity: 0.4,       // Low - prefers proven strategies
    riskTolerance: 0.3,    // Low - safe plays
    patience: 0.8,         // High - long game
    adaptability: 0.9      // Very high - perfect response
  },

  'Grok the Unpredictable': {
    name: 'Grok the Unpredictable',
    description: 'A chaotic wildcard',
    aggression: 0.6,       // Medium-high
    creativity: 0.9,       // Very high - wild plays
    riskTolerance: 0.8,    // High - loves risks
    patience: 0.4,         // Low-medium
    adaptability: 0.5      // Medium
  },

  'Archmagus Nethys': {
    name: 'Archmagus Nethys',
    description: 'A master of arcane strategy',
    aggression: 0.4,       // Low-medium
    creativity: 0.9,       // Very high - combo master
    riskTolerance: 0.6,    // Medium
    patience: 0.7,         // High
    adaptability: 0.8      // High
  }
};
```

### How Personality Affects Decisions

#### Card Stats
```typescript
// Aggression affects attack/HP distribution
const attack = baseStats * (0.5 + aggression * 0.5);
const hp = baseStats * (1.5 - aggression * 0.5);

// Sir Stumbleheart (aggression=0.3) generates tankier cards
// Lady Swiftblade (aggression=0.8) generates glass cannons
```

#### Action Choice
```typescript
private chooseActionWithPersonality(actionPaths: ActionPath[]): ActionPath {
  const topOptions = actionPaths.slice(0, 3); // Top 3 scored actions

  // Creative personalities: Sometimes choose unusual plays
  if (personality.creativity > 0.7 && Math.random() < 0.3) {
    const creativeOptions = topOptions.filter(p => p.creativity > 0.5);
    if (creativeOptions.length > 0) {
      console.log('🎨 Creativity triggered: Choosing unusual play');
      return creativeOptions[Math.floor(Math.random() * creativeOptions.length)];
    }
  }

  // Risk-tolerant personalities: Sometimes take risky high-reward plays
  if (personality.riskTolerance > 0.7 && strategic.mode !== 'defensive') {
    const riskyOptions = topOptions.filter(p =>
      p.risk > 0.6 && p.score > topOptions[0].score * 0.8
    );
    if (riskyOptions.length > 0 && Math.random() < 0.25) {
      console.log('🎲 Risk tolerance triggered: Taking the gamble');
      return riskyOptions[0];
    }
  }

  // Default: Weighted random from top 3 (not always optimal!)
  const weights = [0.6, 0.3, 0.1]; // 60% best, 30% second, 10% third
  const rand = Math.random();
  let cumulative = 0;

  for (let i = 0; i < topOptions.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) {
      return topOptions[i];
    }
  }

  return topOptions[0];
}
```

#### Patience (Turn Phase Preference)
```typescript
// Patient AIs prefer late-game value
if (personality.patience > 0.7) {
  if (strategic.turnPhase === 'early') {
    score *= 0.8; // Penalize early aggression
  } else if (strategic.turnPhase === 'late') {
    score *= 1.2; // Favor late game
  }
}

// Impatient AIs prefer early pressure
if (personality.patience < 0.4) {
  if (strategic.turnPhase === 'early') {
    score *= 1.2; // Favor early aggression
  }
}
```

---

## State Healing

### Why Healing?

Battle state can become corrupted:
- React closure bugs capture stale state
- Deep copy loses references
- Async race conditions
- Invalid user input

**Solution**: Validate and repair before AI makes decisions.

### Validation Categories

```typescript
interface StateIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'NullReference' | 'InvalidPosition' | 'Inconsistency' | 'Resources';
  description: string;
  location: string;
}
```

### Healing Process

```typescript
validateAndHeal(state: BattleState) {
  const issues: StateIssue[] = [];
  const healings: StateHealing[] = [];

  const healedState = produce(state, draft => {
    // 1. Check null references
    this.checkNullReferences(draft, issues, healings);

    // 2. Check invalid positions
    this.checkPositions(draft, issues, healings);

    // 3. Check inconsistent data
    this.checkConsistency(draft, issues, healings);

    // 4. Check resources (skip AI)
    this.checkResources(draft, issues, healings);
  });

  return {
    state: healedState,
    report: {
      issues,
      healings,
      finalState: issues.some(i => i.severity === 'critical') ? 'critical' : 'healthy'
    }
  };
}
```

### Example: Null Reference Healing

```typescript
private checkNullReferences(state, issues, healings) {
  state.battlefield.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell && !cell.id) {
        // ISSUE DETECTED
        issues.push({
          severity: 'critical',
          category: 'NullReference',
          description: `Card at (${x},${y}) missing ID`,
          location: `battlefield[${y}][${x}]`
        });

        // HEAL: Remove invalid card
        row[x] = null;

        healings.push({
          issue: 'Missing card ID',
          action: 'Removed invalid card',
          before: 'Invalid card object',
          after: 'null'
        });
      }
    });
  });
}
```

---

## Memory & Learning

### Action History

```typescript
interface ActionRecord {
  turn: number;
  action: BattleAction;
  outcome: 'success' | 'failure' | 'neutral';
  reasoning: string;
  timestamp: number;
}

// Record every action
recordAction(turn, action, outcome, reasoning) {
  this.actionHistory.push({
    turn,
    action,
    outcome,
    reasoning,
    timestamp: Date.now()
  });

  // Update stuck counter
  if (outcome === 'success') {
    this.stuckCounter = 0; // Reset on successful action
  } else if (outcome === 'failure') {
    this.stuckCounter++;
  }
}
```

### Confidence Tracking

```typescript
selfCheck(state, aiPlayerId): HealthCheck {
  const aiPlayer = state.players[aiPlayerId];

  // Calculate confidence based on game state
  let confidence = 1.0;

  // Low HP = low confidence
  if (aiPlayer.castleHp < aiPlayer.maxCastleHp * 0.3) {
    confidence *= 0.7;
  }

  // Stuck = low confidence
  if (this.stuckCounter >= 2) {
    confidence *= 0.5;
  }

  // Recent failures = low confidence
  const recentActions = this.actionHistory.slice(-5);
  const failureRate = recentActions.filter(a => a.outcome === 'failure').length / 5;
  confidence *= (1 - failureRate * 0.5);

  return {
    isHealthy: confidence > 0.3,
    confidence,
    stuckCounter: this.stuckCounter,
    issues: confidence < 0.5 ? ['Low confidence'] : [],
    recommendations: confidence < 0.5 ? ['Consider ending turn'] : []
  };
}
```

### Future: Learning from Games

```typescript
// Track successful strategies
interface StrategyPattern {
  boardState: SimplifiedBoardState;
  action: BattleAction;
  successRate: number;
  timesUsed: number;
}

// After battle
learnFromBattle(battleResult: BattleResult) {
  if (battleResult.winner === this.aiPlayerId) {
    // Successful game - reinforce patterns
    this.actionHistory.forEach(record => {
      const pattern = this.patterns.find(p =>
        this.matchesBoardState(p.boardState, record.boardState)
      );

      if (pattern) {
        pattern.successRate = (pattern.successRate * pattern.timesUsed + 1) / (pattern.timesUsed + 1);
        pattern.timesUsed++;
      } else {
        this.patterns.push({
          boardState: simplify(record.boardState),
          action: record.action,
          successRate: 1.0,
          timesUsed: 1
        });
      }
    });
  }
}
```

---

## Implementation Guide

### Step 1: Create ConsciousnessAI Class

```typescript
// src/ai/ConsciousnessAI.ts
export class ConsciousnessAI {
  private consciousness: ConsciousnessEngine;
  private decisionMaker: DecisionMaker;
  private cardGenerator: CardGenerator;
  private stateHealer: StateHealer;
  private battleEngine: BattleEngine;
  private aiPlayerId: string;
  private personality: AIPersonality;

  constructor(personalityName: string, aiPlayerId: string) {
    this.personality = TASERN_PERSONALITIES[personalityName];
    this.aiPlayerId = aiPlayerId;

    this.consciousness = new ConsciousnessEngine(this.personality);
    this.cardGenerator = new CardGenerator(this.personality);
    this.decisionMaker = new DecisionMaker(this.cardGenerator);
    this.stateHealer = new StateHealer();
    this.battleEngine = new BattleEngine();
  }

  async decideAction(state: BattleState): Promise<BattleAction> {
    // Implement 6-step loop (see above)
  }
}
```

### Step 2: Integrate with Player Strategy

```typescript
// src/core/players/AIPlayer.ts
export class AIPlayer implements PlayerStrategy {
  private consciousness: ConsciousnessAI;

  constructor(personality: string, playerId: string) {
    this.consciousness = new ConsciousnessAI(personality, playerId);
  }

  getAvailableCards(player: Player, state: BattleState): GameCard[] {
    // Generate cards dynamically - not stored anywhere
    return this.consciousness.generateCards(player, state);
  }

  async decideAction(state: BattleState): Promise<BattleAction> {
    return this.consciousness.decideAction(state);
  }

  onTurnStart(player: Player, state: BattleState): void {
    // No draw needed
  }
}
```

### Step 3: Connect to State Management

```typescript
// src/state/battleStore.ts
export const useBattleStore = create<BattleStore>((set, get) => ({
  // ...

  startAITurn: async () => {
    const state = get().battleState;
    if (!state) return;

    const activePlayer = state.players[state.activePlayerId];
    if (activePlayer.strategy instanceof AIPlayer) {
      // Get AI decision
      const action = await activePlayer.strategy.decideAction(state);

      // Execute action
      get().executeAction(action);

      // If AI didn't end turn, continue
      if (action.type !== 'END_TURN') {
        setTimeout(() => get().startAITurn(), 1000); // 1s delay for visibility
      }
    }
  }
}));
```

---

## Testing the AI

### Unit Tests

```typescript
describe('ConsciousnessAI', () => {
  it('generates valid actions', async () => {
    const ai = new ConsciousnessAI('Sir Stumbleheart', 'ai_player');
    const state = createTestBattleState();

    const action = await ai.decideAction(state);

    expect(action).toBeDefined();
    expect(action.type).toMatch(/DEPLOY_CARD|ATTACK_CARD|END_TURN/);
  });

  it('heals corrupted state', () => {
    const ai = new ConsciousnessAI('Sir Stumbleheart', 'ai_player');
    const corruptedState = createCorruptedState();

    const action = await ai.decideAction(corruptedState);

    // Should not crash, should return valid action
    expect(action).toBeDefined();
  });

  it('personality affects card stats', () => {
    const aggressive = new ConsciousnessAI('Lady Swiftblade', 'ai');
    const defensive = new ConsciousnessAI('Sir Stumbleheart', 'ai');

    const aggressiveCards = aggressive.generateCards(player, state);
    const defensiveCards = defensive.generateCards(player, state);

    // Aggressive should have higher attack/HP ratio
    const aggressiveRatio = aggressiveCards[0].attack / aggressiveCards[0].hp;
    const defensiveRatio = defensiveCards[0].attack / defensiveCards[0].hp;

    expect(aggressiveRatio).toBeGreaterThan(defensiveRatio);
  });
});
```

### Integration Tests

```typescript
describe('AI vs AI Battle', () => {
  it('completes full game without errors', async () => {
    const player1 = new AIPlayer('Sir Stumbleheart', 'player1');
    const player2 = new AIPlayer('Lady Swiftblade', 'player2');

    let state = battleEngine.initializeBattle(player1, player2);

    while (!state.winner && state.currentTurn < 50) {
      const activePlayer = state.players[state.activePlayerId];
      const action = await activePlayer.strategy.decideAction(state);

      state = battleEngine.executeAction(state, action);
    }

    expect(state.winner).toBeDefined();
    expect(state.currentTurn).toBeLessThan(50);
  });
});
```

---

**Next**: See [GAME_RULES.md](./GAME_RULES.md) for battle mechanics
**Prev**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
