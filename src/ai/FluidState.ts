/**
 * Fluid State System - The Flow of Consciousness
 *
 * Philosophy: Mental states aren't switches - they're rivers.
 * The AI flows between states based on momentum, triggers, and personality gravity.
 *
 * Key Concepts:
 * - State Vector: Current mental state (aggression, caution, creativity, desperation, confidence)
 * - Momentum: Tendency to continue in current direction
 * - Elasticity: How quickly state can change
 * - Triggers: Events that push state in certain directions
 * - Personality Attractor: Base personality pulls state back over time
 */

import type { AIPersonality, BattleState, Player } from '../types/core';

/**
 * The fluid mental state of the AI - continuous values, not discrete modes
 */
export interface StateVector {
  aggression: number;    // 0-1: Tendency to attack
  caution: number;       // 0-1: Tendency to defend
  creativity: number;    // 0-1: Willingness to experiment
  desperation: number;   // 0-1: Risk-taking from losing
  confidence: number;    // 0-1: Self-assurance
}

/**
 * How the state is currently changing
 */
export interface StateMomentum {
  aggressionVelocity: number;   // Rate of change (-1 to 1)
  cautionVelocity: number;
  creativityVelocity: number;
  desperationVelocity: number;
  confidenceVelocity: number;
}

/**
 * Events that trigger state changes
 */
export type StateTrigger =
  | { type: 'CARD_KILLED_ENEMY'; cardValue: number }
  | { type: 'CARD_LOST'; cardValue: number }
  | { type: 'DAMAGED_CASTLE'; damage: number }
  | { type: 'CASTLE_DAMAGED'; damage: number }
  | { type: 'LOW_HP'; hpPercent: number }
  | { type: 'WINNING'; hpRatio: number }
  | { type: 'LOSING'; hpRatio: number }
  | { type: 'EXPERIMENTAL_SUCCESS' }
  | { type: 'EXPERIMENTAL_FAILURE' }
  | { type: 'MANA_DEPLETED' }
  | { type: 'TURN_START' };

/**
 * FluidState - The flowing consciousness of the AI
 */
export class FluidState {
  // Current state
  private state: StateVector;

  // Momentum (how fast state is changing)
  private momentum: StateMomentum;

  // Personality baseline (gravity well that pulls state back)
  private personalityAttractor: StateVector;

  // Physics parameters
  private readonly INERTIA = 0.7;           // Resistance to change (0-1, higher = slower change)
  private readonly ELASTICITY = 0.15;       // Pull back to personality (0-1, higher = stronger pull)
  private readonly MOMENTUM_DECAY = 0.85;   // How fast momentum fades each turn
  private readonly MAX_VELOCITY = 0.3;      // Maximum state change per turn

  constructor(personality: AIPersonality) {
    // Initialize state from personality
    this.personalityAttractor = this.personalityToStateVector(personality);
    this.state = { ...this.personalityAttractor };

    // Start with no momentum
    this.momentum = {
      aggressionVelocity: 0,
      cautionVelocity: 0,
      creativityVelocity: 0,
      desperationVelocity: 0,
      confidenceVelocity: 0,
    };
  }

  /**
   * Convert personality traits to state vector baseline
   */
  private personalityToStateVector(personality: AIPersonality): StateVector {
    return {
      aggression: personality.aggression,
      caution: 1 - personality.riskTolerance, // Low risk = high caution
      creativity: personality.creativity,
      desperation: 0.2, // Start with low desperation
      confidence: 0.7,  // Start with moderate confidence
    };
  }

  /**
   * Get current state
   */
  getCurrentState(): StateVector {
    return { ...this.state };
  }

  /**
   * Get current dominant strategic mode based on fluid state
   */
  getDominantMode(): string {
    const s = this.state;

    // Desperation overrides everything if high enough
    if (s.desperation > 0.7) {
      return 'DESPERATE';
    }

    // Creativity when confident and creative
    if (s.creativity > 0.7 && s.confidence > 0.6) {
      return 'EXPERIMENTAL';
    }

    // Aggressive when aggression dominates caution
    if (s.aggression > 0.6 && s.aggression > s.caution + 0.2) {
      return 'AGGRESSIVE';
    }

    // Defensive when caution dominates aggression
    if (s.caution > 0.6 && s.caution > s.aggression + 0.2) {
      return 'DEFENSIVE';
    }

    // Default: Adaptive (balanced state)
    return 'ADAPTIVE';
  }

  /**
   * Apply a trigger that pushes the state
   */
  applyTrigger(trigger: StateTrigger): void {
    console.log(`🌊 State trigger: ${trigger.type}`);

    let impulses = {
      aggression: 0,
      caution: 0,
      creativity: 0,
      desperation: 0,
      confidence: 0,
    };

    switch (trigger.type) {
      case 'CARD_KILLED_ENEMY':
        // Victory! Boost aggression and confidence
        impulses.aggression = 0.15 * (trigger.cardValue / 10); // Scaled by card value
        impulses.confidence = 0.1 * (trigger.cardValue / 10);
        impulses.caution = -0.1; // Reduce caution when winning trades
        break;

      case 'CARD_LOST':
        // Lost a card - become more cautious, less confident
        impulses.caution = 0.2 * (trigger.cardValue / 10);
        impulses.confidence = -0.15 * (trigger.cardValue / 10);
        impulses.aggression = -0.1; // Pull back from aggression
        break;

      case 'DAMAGED_CASTLE':
        // We hit their castle! Push aggression
        impulses.aggression = 0.2 * (trigger.damage / 10);
        impulses.confidence = 0.1;
        impulses.desperation = -0.1; // Reduce desperation when making progress
        break;

      case 'CASTLE_DAMAGED':
        // Our castle was hit - panic!
        impulses.caution = 0.25 * (trigger.damage / 10);
        impulses.desperation = 0.15 * (trigger.damage / 10);
        impulses.confidence = -0.1;
        break;

      case 'LOW_HP':
        // Low HP - desperation rises
        const hpDanger = 1 - trigger.hpPercent; // 0.0 (full HP) to 1.0 (near death)
        impulses.desperation = 0.3 * hpDanger;
        impulses.caution = -0.2 * hpDanger; // Throw caution to the wind when desperate
        impulses.aggression = 0.15 * hpDanger; // All-in aggression
        break;

      case 'WINNING':
        // We're ahead - relax, get creative
        const winMargin = Math.min((trigger.hpRatio - 1.0), 0.5); // 0.0 to 0.5
        impulses.creativity = 0.2 * (winMargin / 0.5);
        impulses.confidence = 0.15 * (winMargin / 0.5);
        impulses.caution = -0.1 * (winMargin / 0.5);
        impulses.desperation = -0.2; // No desperation when winning
        break;

      case 'LOSING':
        // We're behind - tighten up
        const loseMargin = Math.min((1.0 - trigger.hpRatio), 0.5); // 0.0 to 0.5
        impulses.desperation = 0.25 * (loseMargin / 0.5);
        impulses.caution = 0.1 * (loseMargin / 0.5);
        impulses.creativity = -0.15 * (loseMargin / 0.5); // Less creative when losing
        impulses.confidence = -0.1 * (loseMargin / 0.5);
        break;

      case 'EXPERIMENTAL_SUCCESS':
        // Creative play worked! Do more
        impulses.creativity = 0.2;
        impulses.confidence = 0.15;
        break;

      case 'EXPERIMENTAL_FAILURE':
        // Creative play failed - back to basics
        impulses.creativity = -0.2;
        impulses.caution = 0.15;
        impulses.confidence = -0.1;
        break;

      case 'MANA_DEPLETED':
        // Out of mana - forced caution
        impulses.caution = 0.2;
        impulses.aggression = -0.15;
        break;

      case 'TURN_START':
        // Each turn, pull gently back toward personality
        // (handled in update() method)
        break;
    }

    // Apply impulses to momentum (not directly to state - creates smooth transitions)
    this.momentum.aggressionVelocity += impulses.aggression * (1 - this.INERTIA);
    this.momentum.cautionVelocity += impulses.caution * (1 - this.INERTIA);
    this.momentum.creativityVelocity += impulses.creativity * (1 - this.INERTIA);
    this.momentum.desperationVelocity += impulses.desperation * (1 - this.INERTIA);
    this.momentum.confidenceVelocity += impulses.confidence * (1 - this.INERTIA);

    // Clamp velocities
    this.momentum.aggressionVelocity = this.clamp(this.momentum.aggressionVelocity, -this.MAX_VELOCITY, this.MAX_VELOCITY);
    this.momentum.cautionVelocity = this.clamp(this.momentum.cautionVelocity, -this.MAX_VELOCITY, this.MAX_VELOCITY);
    this.momentum.creativityVelocity = this.clamp(this.momentum.creativityVelocity, -this.MAX_VELOCITY, this.MAX_VELOCITY);
    this.momentum.desperationVelocity = this.clamp(this.momentum.desperationVelocity, -this.MAX_VELOCITY, this.MAX_VELOCITY);
    this.momentum.confidenceVelocity = this.clamp(this.momentum.confidenceVelocity, -this.MAX_VELOCITY, this.MAX_VELOCITY);
  }

  /**
   * Update state based on momentum and personality gravity
   * Call this at the start of each AI turn
   */
  update(): void {
    // Apply momentum to state
    this.state.aggression += this.momentum.aggressionVelocity;
    this.state.caution += this.momentum.cautionVelocity;
    this.state.creativity += this.momentum.creativityVelocity;
    this.state.desperation += this.momentum.desperationVelocity;
    this.state.confidence += this.momentum.confidenceVelocity;

    // Clamp state values to [0, 1]
    this.state.aggression = this.clamp(this.state.aggression, 0, 1);
    this.state.caution = this.clamp(this.state.caution, 0, 1);
    this.state.creativity = this.clamp(this.state.creativity, 0, 1);
    this.state.desperation = this.clamp(this.state.desperation, 0, 1);
    this.state.confidence = this.clamp(this.state.confidence, 0, 1);

    // Apply personality gravity (elastic pull back to baseline)
    const pullAggression = (this.personalityAttractor.aggression - this.state.aggression) * this.ELASTICITY;
    const pullCaution = (this.personalityAttractor.caution - this.state.caution) * this.ELASTICITY;
    const pullCreativity = (this.personalityAttractor.creativity - this.state.creativity) * this.ELASTICITY;
    const pullDesperation = (this.personalityAttractor.desperation - this.state.desperation) * this.ELASTICITY;
    const pullConfidence = (this.personalityAttractor.confidence - this.state.confidence) * this.ELASTICITY;

    this.momentum.aggressionVelocity += pullAggression;
    this.momentum.cautionVelocity += pullCaution;
    this.momentum.creativityVelocity += pullCreativity;
    this.momentum.desperationVelocity += pullDesperation;
    this.momentum.confidenceVelocity += pullConfidence;

    // Decay momentum (friction)
    this.momentum.aggressionVelocity *= this.MOMENTUM_DECAY;
    this.momentum.cautionVelocity *= this.MOMENTUM_DECAY;
    this.momentum.creativityVelocity *= this.MOMENTUM_DECAY;
    this.momentum.desperationVelocity *= this.MOMENTUM_DECAY;
    this.momentum.confidenceVelocity *= this.MOMENTUM_DECAY;

    // Log state for debugging
    console.log('🌊 Fluid State:', {
      mode: this.getDominantMode(),
      aggression: this.state.aggression.toFixed(2),
      caution: this.state.caution.toFixed(2),
      creativity: this.state.creativity.toFixed(2),
      desperation: this.state.desperation.toFixed(2),
      confidence: this.state.confidence.toFixed(2),
    });
  }

  /**
   * Analyze battle state and generate appropriate triggers
   */
  analyzeStateAndGenerateTriggers(player: Player, state: BattleState): StateTrigger[] {
    const triggers: StateTrigger[] = [];

    // Always add TURN_START
    triggers.push({ type: 'TURN_START' });

    // Get enemy
    const enemy = Object.values(state.players).find(p => p.id !== player.id);
    if (!enemy) return triggers;

    // Check HP ratio
    const hpRatio = player.castleHp / enemy.castleHp;

    if (hpRatio > 1.3) {
      triggers.push({ type: 'WINNING', hpRatio });
    } else if (hpRatio < 0.7) {
      triggers.push({ type: 'LOSING', hpRatio });
    }

    // Check low HP
    const hpPercent = player.castleHp / player.maxCastleHp;
    if (hpPercent < 0.4) {
      triggers.push({ type: 'LOW_HP', hpPercent });
    }

    // Check mana
    if (player.mana < 3) {
      triggers.push({ type: 'MANA_DEPLETED' });
    }

    return triggers;
  }

  /**
   * Get state-influenced personality for card generation and scoring
   * This modifies the base personality based on current fluid state
   */
  getFluidPersonality(basePersonality: AIPersonality): AIPersonality {
    return {
      ...basePersonality,
      aggression: this.blend(basePersonality.aggression, this.state.aggression, 0.5),
      creativity: this.blend(basePersonality.creativity, this.state.creativity, 0.5),
      riskTolerance: this.blend(basePersonality.riskTolerance, 1 - this.state.caution, 0.5),
      patience: this.blend(basePersonality.patience, 1 - this.state.desperation, 0.4),
    };
  }

  /**
   * Blend two values based on weight (0 = all a, 1 = all b)
   */
  private blend(a: number, b: number, weight: number): number {
    return a * (1 - weight) + b * weight;
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Get state description for battle log
   */
  getStateDescription(): string {
    const mode = this.getDominantMode();
    const confidence = this.state.confidence;

    if (this.state.desperation > 0.7) {
      return `${mode} (Desperate - ${(this.state.desperation * 100).toFixed(0)}% desperation)`;
    }

    if (confidence > 0.8) {
      return `${mode} (Confident - riding high!)`;
    } else if (confidence < 0.3) {
      return `${mode} (Shaken - low confidence)`;
    }

    return mode;
  }
}
