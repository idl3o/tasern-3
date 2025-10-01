/**
 * Consciousness AI - The Thinking Heart
 *
 * A 6-step decision loop that makes AI feel intentional, not optimal.
 * Philosophy: AI should make interesting mistakes, not perfect plays.
 *
 * The Six Steps of Consciousness:
 * 1. HEAL - Validate and repair state corruption
 * 2. SELF-AWARENESS - Check confidence, detect being stuck
 * 3. STRATEGIC ANALYSIS - Determine current mode (aggressive/defensive/etc)
 * 4. GENERATE OPTIONS - List legal actions, generate cards dynamically
 * 5. SCORE & CHOOSE - Evaluate actions, apply personality variance
 * 6. RECORD - Build memory for learning
 */

import type {
  Player,
  BattleState,
  BattleAction,
  AIMode,
  AIMemory,
  ScoredAction,
  DeployCardAction,
  AttackCardAction,
  AttackCastleAction,
  MoveCardAction,
  Position,
} from '../types/core';
import { CardGenerator } from './CardGenerator';

export class ConsciousnessAI {
  private cardGenerator: CardGenerator;
  private readonly VARIANCE = 0.3; // 30% randomness in decisions

  constructor() {
    this.cardGenerator = new CardGenerator();
  }

  /**
   * The main decision loop - called every turn
   */
  async selectAction(player: Player, state: BattleState): Promise<BattleAction> {
    console.log('🧠 Consciousness awakening for', player.name);

    // STEP 1: HEAL - Validate state
    this.healState(player, state);

    // STEP 2: SELF-AWARENESS - Check confidence
    const memory = this.getOrCreateMemory(player, state);
    const confidence = this.assessConfidence(memory, state);
    console.log(`🎯 Confidence: ${(confidence * 100).toFixed(0)}%`);

    // STEP 3: STRATEGIC ANALYSIS - Determine mode
    const mode = this.determineStrategicMode(player, state, memory);
    console.log(`🎭 Strategic mode: ${mode}`);

    // STEP 4: GENERATE OPTIONS - All possible actions
    const actions = this.generatePossibleActions(player, state, mode);
    console.log(`🎲 Generated ${actions.length} possible actions`);

    if (actions.length === 0) {
      // No actions available, end turn
      console.log('🤷 No actions available, ending turn');
      return { type: 'END_TURN', playerId: player.id };
    }

    // STEP 5: SCORE & CHOOSE - Evaluate and select
    const scoredActions = this.scoreActions(actions, player, state, mode);
    const chosenAction = this.selectActionWithVariance(scoredActions, player);

    console.log(
      `✅ Chose: ${chosenAction.action.type} (score: ${chosenAction.score.toFixed(2)})`
    );

    // STEP 6: RECORD - Update memory
    this.recordAction(memory, chosenAction, state);

    return chosenAction.action;
  }

  // ==========================================================================
  // STEP 1: HEAL - State validation and repair
  // ==========================================================================

  private healState(player: Player, state: BattleState): void {
    // Validate player exists in state
    if (!state.players[player.id]) {
      console.warn('⚠️ Player not found in state - corruption detected');
      return;
    }

    // Validate battlefield integrity
    if (!state.battlefield || state.battlefield.length !== 3) {
      console.warn('⚠️ Battlefield corruption detected');
      return;
    }

    // Validate cards on battlefield belong to players
    state.battlefield.flat().forEach((card) => {
      if (card && !state.players[card.ownerId]) {
        console.warn('⚠️ Orphaned card detected:', card.name);
      }
    });

    console.log('💚 State validated');
  }

  // ==========================================================================
  // STEP 2: SELF-AWARENESS - Confidence and stuck detection
  // ==========================================================================

  private getOrCreateMemory(player: Player, state: BattleState): AIMemory {
    if (!state.aiMemories[player.id]) {
      state.aiMemories[player.id] = {
        previousActions: [],
        stuckCounter: 0,
        lastBoardHash: '',
        confidenceLevel: 1.0,
        currentMode: 'ADAPTIVE',
      };
    }
    return state.aiMemories[player.id];
  }

  private assessConfidence(memory: AIMemory, state: BattleState): number {
    let confidence = 1.0;

    // Reduce confidence if stuck
    if (memory.stuckCounter > 0) {
      confidence -= memory.stuckCounter * 0.2;
    }

    // Reduce confidence if losing badly
    const player = Object.values(state.players).find((p) => p.type === 'ai')!;
    const enemy = Object.values(state.players).find((p) => p.type !== 'ai')!;

    if (player && enemy) {
      const hpRatio = player.castleHp / enemy.castleHp;
      if (hpRatio < 0.5) {
        confidence -= 0.3;
      }
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // ==========================================================================
  // STEP 3: STRATEGIC ANALYSIS - Mode determination
  // ==========================================================================

  private determineStrategicMode(
    player: Player,
    state: BattleState,
    memory: AIMemory
  ): AIMode {
    const personality = player.aiPersonality;
    if (!personality) return 'ADAPTIVE';

    const enemy = Object.values(state.players).find((p) => p.id !== player.id)!;

    // Calculate situation
    const hpRatio = player.castleHp / enemy.castleHp;
    const manaRatio = player.mana / player.maxMana;

    const myCards = state.battlefield.flat().filter((c) => c?.ownerId === player.id).length;
    const enemyCards = state.battlefield.flat().filter((c) => c?.ownerId === enemy.id).length;

    // Desperate if losing badly
    if (hpRatio < 0.4) {
      return 'DESPERATE';
    }

    // Experimental if winning and creative
    if (hpRatio > 1.5 && personality.creativity > 0.7) {
      return 'EXPERIMENTAL';
    }

    // Aggressive if personality is aggressive and have resources
    if (personality.aggression > 0.7 && manaRatio > 0.5) {
      return 'AGGRESSIVE';
    }

    // Defensive if outnumbered
    if (enemyCards > myCards + 2) {
      return 'DEFENSIVE';
    }

    // Default: Adaptive
    return 'ADAPTIVE';
  }

  // ==========================================================================
  // STEP 4: GENERATE OPTIONS - All possible actions
  // ==========================================================================

  private generatePossibleActions(
    player: Player,
    state: BattleState,
    mode: AIMode
  ): BattleAction[] {
    const actions: BattleAction[] = [];

    // Get my cards on battlefield
    const myCards = state.battlefield
      .flat()
      .filter((c) => c !== null && c.ownerId === player.id);

    // Generate deployment actions (with dynamically generated cards!)
    const generatedCards = this.cardGenerator.generateStrategicCards(
      state,
      player,
      mode,
      3 // Generate 3 card options
    );

    const emptyPositions = this.getEmptyPositions(state.battlefield);

    generatedCards.forEach((card) => {
      // Only deploy if we have mana
      if (player.mana >= card.manaCost) {
        emptyPositions.forEach((pos) => {
          const deployAction: DeployCardAction = {
            type: 'DEPLOY_CARD',
            playerId: player.id,
            cardId: card.id,
            position: pos,
            generatedCard: card, // ⭐ Card travels with action
          };
          actions.push(deployAction);
        });
      }
    });

    // Generate attack actions
    myCards.forEach((card) => {
      if (card && !card.hasAttacked) {
        // Attack enemy cards
        const enemyCards = state.battlefield
          .flat()
          .filter((c) => c !== null && c.ownerId !== player.id);

        enemyCards.forEach((target) => {
          if (target) {
            const attackAction: AttackCardAction = {
              type: 'ATTACK_CARD',
              playerId: player.id,
              attackerCardId: card.id,
              targetCardId: target.id,
            };
            actions.push(attackAction);
          }
        });

        // Attack castle
        const enemy = Object.values(state.players).find((p) => p.id !== player.id)!;
        const castleAction: AttackCastleAction = {
          type: 'ATTACK_CASTLE',
          playerId: player.id,
          attackerCardId: card.id,
          targetPlayerId: enemy.id,
        };
        actions.push(castleAction);
      }
    });

    // Generate move actions
    myCards.forEach((card) => {
      if (card && !card.hasMoved) {
        emptyPositions.forEach((pos) => {
          const moveAction: MoveCardAction = {
            type: 'MOVE_CARD',
            playerId: player.id,
            cardId: card.id,
            fromPosition: card.position,
            toPosition: pos,
          };
          actions.push(moveAction);
        });
      }
    });

    return actions;
  }

  // ==========================================================================
  // STEP 5: SCORE & CHOOSE - Evaluate and select with variance
  // ==========================================================================

  private scoreActions(
    actions: BattleAction[],
    player: Player,
    state: BattleState,
    mode: AIMode
  ): ScoredAction[] {
    return actions.map((action) => {
      let score = 0;
      const personality = player.aiPersonality;

      switch (action.type) {
        case 'DEPLOY_CARD':
          score = this.scoreDeployAction(action, player, state, mode, personality);
          break;
        case 'ATTACK_CARD':
          score = this.scoreAttackCardAction(action, player, state, mode, personality);
          break;
        case 'ATTACK_CASTLE':
          score = this.scoreAttackCastleAction(action, player, state, mode, personality);
          break;
        case 'MOVE_CARD':
          score = this.scoreMoveAction(action, player, state, mode, personality);
          break;
        default:
          score = 0;
      }

      return {
        action,
        score,
        reasoning: `${action.type} scored ${score.toFixed(2)} in ${mode} mode`,
        strategicMode: mode,
      };
    });
  }

  private scoreDeployAction(
    action: DeployCardAction,
    player: Player,
    state: BattleState,
    mode: AIMode,
    personality: any
  ): number {
    let score = 50; // Base score

    const card = action.generatedCard!;

    // Value based on card stats
    score += card.attack * 2;
    score += card.hp * 1.5;

    // Position scoring
    if (mode === 'AGGRESSIVE' && action.position.row === 0) {
      score += 20; // Front row in aggressive mode
    }
    if (mode === 'DEFENSIVE' && action.position.row === 2) {
      score += 20; // Back row in defensive mode
    }

    // Mana efficiency
    const manaEfficiency = (card.attack + card.hp) / card.manaCost;
    score += manaEfficiency * 5;

    return score;
  }

  private scoreAttackCardAction(
    action: AttackCardAction,
    player: Player,
    state: BattleState,
    mode: AIMode,
    personality: any
  ): number {
    let score = 40;

    const attacker = state.battlefield
      .flat()
      .find((c) => c?.id === action.attackerCardId);
    const target = state.battlefield.flat().find((c) => c?.id === action.targetCardId);

    if (!attacker || !target) return 0;

    // Can we kill the target?
    if (attacker.attack >= target.hp) {
      score += 50; // High value for kills
    }

    // Threat elimination
    score += target.attack * 2; // Remove threats

    // Aggressive mode bonus
    if (mode === 'AGGRESSIVE') {
      score += 20;
    }

    return score;
  }

  private scoreAttackCastleAction(
    action: AttackCastleAction,
    player: Player,
    state: BattleState,
    mode: AIMode,
    personality: any
  ): number {
    let score = 60; // Good base value

    const attacker = state.battlefield
      .flat()
      .find((c) => c?.id === action.attackerCardId);

    if (!attacker) return 0;

    // Direct damage is valuable
    score += attacker.attack * 3;

    // Aggressive mode loves castle attacks
    if (mode === 'AGGRESSIVE') {
      score += 30;
    }

    // Desperate mode goes for the win
    if (mode === 'DESPERATE') {
      score += 40;
    }

    return score;
  }

  private scoreMoveAction(
    action: MoveCardAction,
    player: Player,
    state: BattleState,
    mode: AIMode,
    personality: any
  ): number {
    let score = 20; // Lower base - moves are situational

    // Moving to front in aggressive mode
    if (mode === 'AGGRESSIVE' && action.toPosition.row === 0) {
      score += 15;
    }

    // Moving to back in defensive mode
    if (mode === 'DEFENSIVE' && action.toPosition.row === 2) {
      score += 15;
    }

    return score;
  }

  private selectActionWithVariance(
    scoredActions: ScoredAction[],
    player: Player
  ): ScoredAction {
    const personality = player.aiPersonality;

    // Sort by score
    scoredActions.sort((a, b) => b.score - a.score);

    // Apply personality variance
    const variance = personality ? personality.creativity * this.VARIANCE : this.VARIANCE;

    // Random chance to not pick the best option
    if (Math.random() < variance) {
      // Pick from top 3
      const topActions = scoredActions.slice(0, Math.min(3, scoredActions.length));
      const randomIndex = Math.floor(Math.random() * topActions.length);
      console.log(`🎲 Variance applied: picking option #${randomIndex + 1}`);
      return topActions[randomIndex];
    }

    // Pick best action
    return scoredActions[0];
  }

  // ==========================================================================
  // STEP 6: RECORD - Memory building
  // ==========================================================================

  private recordAction(memory: AIMemory, scoredAction: ScoredAction, state: BattleState): void {
    // Note: We can't mutate memory directly due to Immer
    // Memory updates should happen through state management
    // For now, just log the decision
    console.log('📝 Decision recorded:', scoredAction.strategicMode);
  }

  private getBoardHash(state: BattleState): string {
    return state.battlefield
      .flat()
      .map((c) => (c ? `${c.id}-${c.position.row}-${c.position.col}` : 'empty'))
      .join('|');
  }

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  private getEmptyPositions(battlefield: any[][]): Position[] {
    const positions: Position[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (battlefield[row][col] === null) {
          positions.push({ row, col });
        }
      }
    }
    return positions;
  }

  onTurnStart(player: Player, state: BattleState): void {
    console.log('🌅 AI consciousness initializing for new turn');
  }

  onTurnEnd(player: Player, state: BattleState): void {
    console.log('🌙 AI consciousness entering rest state');
  }
}
