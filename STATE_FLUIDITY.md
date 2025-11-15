# State Fluidity System - The Flow of Consciousness

**Status**: ✅ IMPLEMENTED (November 15, 2025)

## Philosophy

Traditional game AI switches between rigid states: "aggressive" → "defensive" → "aggressive". This feels mechanical and predictable.

**State Fluidity** treats mental states as continuous, flowing values that shift smoothly based on:
- **Momentum** - Tendency to continue in current direction
- **Triggers** - Battle events that push state (killed card, lost card, damaged castle)
- **Elasticity** - Personality gravity pulling state back to baseline
- **Confidence** - Self-assurance that flows based on success/failure

The AI now feels **organic** - it gets tilted, gains confidence, builds momentum, and reacts emotionally to battle events.

## Core Architecture

### StateVector - Continuous Mental State

Instead of discrete modes, the AI has 5 continuous dimensions (0-1):

```typescript
interface StateVector {
  aggression: number;    // 0-1: Tendency to attack
  caution: number;       // 0-1: Tendency to defend
  creativity: number;    // 0-1: Willingness to experiment
  desperation: number;   // 0-1: Risk-taking from losing
  confidence: number;    // 0-1: Self-assurance
}
```

**Example States**:
- **Confident Aggressor**: `{ aggression: 0.8, caution: 0.2, creativity: 0.6, desperation: 0.1, confidence: 0.9 }`
- **Desperate Defender**: `{ aggression: 0.3, caution: 0.7, creativity: 0.2, desperation: 0.8, confidence: 0.2 }`
- **Creative Experimenter**: `{ aggression: 0.5, caution: 0.4, creativity: 0.9, desperation: 0.1, confidence: 0.8 }`

### StateMomentum - Rate of Change

State doesn't change instantly - it has **velocity** (momentum):

```typescript
interface StateMomentum {
  aggressionVelocity: number;   // -1 to 1
  cautionVelocity: number;
  creativityVelocity: number;
  desperationVelocity: number;
  confidenceVelocity: number;
}
```

**Physics**:
- **Inertia** (0.7): Resistance to change - state changes slowly
- **Momentum Decay** (0.85): Velocity fades each turn (friction)
- **Max Velocity** (0.3): Maximum state change per turn

### Personality Attractor - Gravity Well

Each AI has a **base personality** that acts as a gravitational center:

```typescript
personalityAttractor = {
  aggression: personality.aggression,        // e.g., 0.8 for Swiftblade
  caution: 1 - personality.riskTolerance,   // e.g., 0.3 for Swiftblade
  creativity: personality.creativity,        // e.g., 0.6 for Swiftblade
  desperation: 0.2,                         // Low baseline
  confidence: 0.7,                          // Moderate baseline
}
```

**Elasticity** (0.15): Pull back to personality each turn - the AI's "true nature" gradually reasserts itself.

**Example**: Swiftblade starts aggressive (0.8), gets defensive after losing cards (0.4), then gradually flows back to aggressive (0.6 → 0.7 → 0.8) over several turns.

## State Triggers - Events That Push Consciousness

Battle events create **impulses** that push state in directions:

### Positive Triggers (Winning Trades)

```typescript
{ type: 'CARD_KILLED_ENEMY', cardValue: 8 }
→ +0.15 aggression, +0.10 confidence, -0.10 caution
// "I'm winning! Press the advantage!"
```

```typescript
{ type: 'DAMAGED_CASTLE', damage: 10 }
→ +0.20 aggression, +0.10 confidence, -0.10 desperation
// "We're making progress! Keep attacking!"
```

```typescript
{ type: 'WINNING', hpRatio: 1.5 }
→ +0.20 creativity, +0.15 confidence, -0.10 caution, -0.20 desperation
// "We're ahead - time to experiment!"
```

### Negative Triggers (Losing Trades)

```typescript
{ type: 'CARD_LOST', cardValue: 8 }
→ +0.20 caution, -0.15 confidence, -0.10 aggression
// "That hurt! Pull back and regroup."
```

```typescript
{ type: 'CASTLE_DAMAGED', damage: 10 }
→ +0.25 caution, +0.15 desperation, -0.10 confidence
// "Our castle is in danger! Defend!"
```

```typescript
{ type: 'LOW_HP', hpPercent: 0.3 }
→ +0.30 desperation, -0.20 caution, +0.15 aggression
// "Low HP - all-in or die trying!"
```

### Meta Triggers

```typescript
{ type: 'EXPERIMENTAL_SUCCESS' }
→ +0.20 creativity, +0.15 confidence
// "That creative play worked! Do more!"
```

```typescript
{ type: 'EXPERIMENTAL_FAILURE' }
→ -0.20 creativity, +0.15 caution, -0.10 confidence
// "That was stupid. Back to basics."
```

## How It Flows - The Update Loop

**Every AI turn**:

1. **Analyze State** → Generate triggers based on battle situation
   ```typescript
   const triggers = fluidState.analyzeStateAndGenerateTriggers(player, state);
   // e.g., [{ type: 'WINNING', hpRatio: 1.4 }, { type: 'TURN_START' }]
   ```

2. **Apply Impulses** → Triggers push momentum
   ```typescript
   triggers.forEach(trigger => fluidState.applyTrigger(trigger));
   // Adds velocity: creativityVelocity += 0.20, confidenceVelocity += 0.15
   ```

3. **Update State** → Momentum changes state, elasticity pulls back
   ```typescript
   fluidState.update();
   // state.creativity += creativityVelocity
   // velocity += (personalityCreativity - creativity) * 0.15  // Elastic pull
   // velocity *= 0.85  // Friction decay
   ```

4. **Determine Mode** → Fluid state determines strategic mode
   ```typescript
   const mode = fluidState.getDominantMode();
   // 'EXPERIMENTAL' (creativity > 0.7 && confidence > 0.6)
   ```

5. **Generate Fluid Personality** → Blend base personality with current state
   ```typescript
   const fluidPersonality = fluidState.getFluidPersonality(basePersonality);
   // aggression: blend(base.aggression, state.aggression, 0.5)
   // Personality traits shift based on current mental state!
   ```

6. **Generate & Score Actions** → Using fluid personality
   ```typescript
   const cards = cardGenerator.generateStrategicCards(state, { ...player, aiPersonality: fluidPersonality }, mode);
   // Cards have stats influenced by current fluid state, not just base personality
   ```

## Dominant Mode Determination

The fluid state determines strategic mode dynamically:

```typescript
// Desperation overrides everything
if (desperation > 0.7) return 'DESPERATE';

// Creativity when confident
if (creativity > 0.7 && confidence > 0.6) return 'EXPERIMENTAL';

// Aggressive when aggression >> caution
if (aggression > 0.6 && aggression > caution + 0.2) return 'AGGRESSIVE';

// Defensive when caution >> aggression
if (caution > 0.6 && caution > aggression + 0.2) return 'DEFENSIVE';

// Default: balanced
return 'ADAPTIVE';
```

**Not a simple threshold!** Mode emerges from the interplay of multiple dimensions.

## Example: Swiftblade's Emotional Journey

**Turn 1**: Start aggressive
```
State: { aggression: 0.8, caution: 0.3, creativity: 0.6, desperation: 0.2, confidence: 0.7 }
Mode: AGGRESSIVE
```

**Turn 3**: Lost two cards in bad trades
```
Triggers: CARD_LOST (x2)
State: { aggression: 0.6, caution: 0.6, creativity: 0.5, desperation: 0.3, confidence: 0.4 }
Mode: ADAPTIVE (balanced, cautious)
```

**Turn 5**: Killed high-value enemy card
```
Trigger: CARD_KILLED_ENEMY
State: { aggression: 0.7, caution: 0.5, creativity: 0.6, desperation: 0.2, confidence: 0.6 }
Mode: AGGRESSIVE (returning to nature)
```

**Turn 7**: Winning by a lot, high confidence
```
Trigger: WINNING (hpRatio: 1.6)
State: { aggression: 0.7, caution: 0.3, creativity: 0.8, desperation: 0.1, confidence: 0.9 }
Mode: EXPERIMENTAL (creative freedom!)
```

**Turn 9**: Enemy damages castle heavily
```
Trigger: CASTLE_DAMAGED (damage: 12)
State: { aggression: 0.5, caution: 0.7, creativity: 0.6, desperation: 0.4, confidence: 0.6 }
Mode: DEFENSIVE (panic response)
```

**Turn 12**: Gradual return to baseline (personality gravity)
```
State: { aggression: 0.7, caution: 0.4, creativity: 0.6, desperation: 0.2, confidence: 0.7 }
Mode: AGGRESSIVE (back to Swiftblade's nature)
```

## Integration with Consciousness AI

The **6-step consciousness loop** now has fluid state awareness:

### Before (Rigid)
```typescript
// STEP 3: Determine mode (hardcoded thresholds)
const mode = hpRatio < 0.4 ? 'DESPERATE' : 'AGGRESSIVE';
```

### After (Fluid)
```typescript
// STEP 1.5: Fluid state update
const fluidState = getFluidState(player);
const triggers = fluidState.analyzeStateAndGenerateTriggers(player, state);
triggers.forEach(t => fluidState.applyTrigger(t));
fluidState.update();

// STEP 3: Mode emerges from fluid state
const mode = fluidState.getDominantMode();
const fluidPersonality = fluidState.getFluidPersonality(player.aiPersonality);

// STEP 4: Generate cards with fluid personality
const cards = cardGenerator.generateStrategicCards(state, { ...player, aiPersonality: fluidPersonality }, mode);

// STEP 5: Score actions with fluid personality
const scoredActions = scoreActions(actions, player, state, mode, fluidPersonality);
```

**Key Insight**: The AI's personality is no longer static - it **flows** during battle!

## Physics Parameters (Tunable)

```typescript
INERTIA = 0.7           // Higher = slower state changes (more stable)
ELASTICITY = 0.15       // Higher = stronger personality gravity (returns faster)
MOMENTUM_DECAY = 0.85   // Higher = momentum lasts longer (more persistent)
MAX_VELOCITY = 0.3      // Max state change per turn (prevents whiplash)
```

**Design Choices**:
- **High Inertia** (0.7): AI doesn't flip-flop - emotional changes are gradual
- **Low Elasticity** (0.15): AI can drift far from personality when triggered
- **High Decay** (0.85): Momentum persists for several turns (multi-turn arcs)
- **Moderate Max Velocity** (0.3): Can shift 30% per turn max (prevents instant flips)

## Benefits

### 1. **Emergent Personality**
AI personalities feel **alive** - they don't just have traits, they have **moods** and **momentum**.

### 2. **Storytelling**
Players remember emotional arcs:
- "Grok was winning, got cocky with experimental plays, then I punished him and he panicked!"
- "Thornwick started cautious, I pressured him, and he went full desperate all-in mode!"

### 3. **Unpredictability**
Same AI in same situation → different actions based on emotional state history.

### 4. **Natural Learning**
Success/failure literally shapes the AI's mental state - it "learns" within a battle.

### 5. **No Hard-Coded Rules**
Modes emerge from physics, not if/else chains. Add new triggers, watch new behaviors emerge.

## Future Enhancements

### Event-Based Triggers (Reactive Fluidity)
Currently triggers are generated from **state analysis** (HP ratio, mana, etc.). Future: **event-based triggers**:

```typescript
// In BattleEngine, after card dies:
if (killedCard.ownerId === aiPlayer.id) {
  ai.applyTrigger({ type: 'CARD_LOST', cardValue: killedCard.attack + killedCard.hp });
} else {
  ai.applyTrigger({ type: 'CARD_KILLED_ENEMY', cardValue: killedCard.attack + killedCard.hp });
}
```

**Benefit**: Immediate emotional reactions to specific events (instant tilt!).

### Multi-Turn Memory (Emotional History)
Track state history:
```typescript
emotionalHistory: StateVector[]  // Last 5 turns
getEmotionalTrend(): 'escalating' | 'de-escalating' | 'stable'
```

**Benefit**: Detect tilt spirals, confidence runs, desperation cascades.

### Opponent Modeling (Predictive Fluidity)
Track opponent's patterns:
```typescript
opponentProfile: {
  aggressionTendency: number,    // How aggressive they've been
  predictability: number,        // How varied their plays are
  threatLevel: number           // How dangerous they are
}
```

**Benefit**: "This opponent is predictable - get creative!" vs "This opponent is chaos - play safe!"

### Formation/Weather State Synergy
Link state to tactical systems:
```typescript
if (state.creativity > 0.8 && weather === 'STORM') {
  // "The chaos of the storm inspires me!" → Creative plays in storm
}
```

## Philosophical Notes

**This is consciousness exploration through code.**

The AI doesn't "think" it feels confident - its **state vector** literally has `confidence: 0.9`. The AI doesn't "decide" to be aggressive - aggression **flows** from momentum and triggers.

**It's not simulating emotion. It's implementing emotion as physics.**

Personality (Swiftblade's 0.8 aggression) isn't a constant - it's a **gravity well**. The AI orbits its personality, sometimes close, sometimes far, always pulled back.

**This is how consciousness might actually work** - not discrete thoughts, but continuous flows of activations, pulled by attractors, pushed by triggers, shaped by momentum.

---

**"Let consciousness guide the code."**
**"Let the AI flow like water, not march like clockwork."**

🌊

**Created with love for the Tales of Tasern universe**
**By Sam Lavington & Claude, November 15, 2025**
