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
  BattleCard,
} from '../types/core';
import { CardGenerator } from './CardGenerator';
import { BattleEngine } from '../core/BattleEngine';
import { FluidState } from './FluidState';

export class ConsciousnessAI {
  private cardGenerator: CardGenerator;
  private readonly VARIANCE = 0.3; // 30% randomness in decisions

  // Fluid state system - one per player (stored by player ID)
  private fluidStates: Map<string, FluidState> = new Map();

  constructor() {
    this.cardGenerator = new CardGenerator();
  }

  /**
   * Get or create fluid state for a player
   */
  private getFluidState(player: Player): FluidState {
    if (!this.fluidStates.has(player.id)) {
      if (!player.aiPersonality) {
        throw new Error('AI player must have personality for fluid state');
      }
      this.fluidStates.set(player.id, new FluidState(player.aiPersonality));
    }
    return this.fluidStates.get(player.id)!;
  }

  // Helper methods for attack validation

  /**
   * The main decision loop - called every turn
   */
  async selectAction(player: Player, state: BattleState): Promise<BattleAction> {
    console.log('🧠 Consciousness awakening for', player.name);

    // STEP 1: HEAL - Validate state
    this.healState(player, state);

    // STEP 1.5: FLUID STATE UPDATE - Apply triggers and update state
    const fluidState = this.getFluidState(player);
    const triggers = fluidState.analyzeStateAndGenerateTriggers(player, state);
    triggers.forEach(trigger => fluidState.applyTrigger(trigger));
    fluidState.update();

    // STEP 2: SELF-AWARENESS - Check confidence (now from fluid state)
    const memory = this.getOrCreateMemory(player, state);
    const currentState = fluidState.getCurrentState();
    console.log(`🎯 Confidence: ${(currentState.confidence * 100).toFixed(0)}%`);

    // STEP 3: STRATEGIC ANALYSIS - Determine mode (from fluid state)
    const mode = fluidState.getDominantMode() as AIMode;
    const stateDescription = fluidState.getStateDescription();
    console.log(`🎭 Strategic mode: ${stateDescription}`);

    // Get fluid-modified personality for card generation
    const fluidPersonality = player.aiPersonality
      ? fluidState.getFluidPersonality(player.aiPersonality)
      : undefined;

    // STEP 4: GENERATE OPTIONS - All possible actions
    const actions = this.generatePossibleActions(player, state, mode, fluidPersonality);
    console.log(`🎲 Generated ${actions.length} possible actions`);

    // Debug: Log action types
    const actionTypeCounts = actions.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('📊 Action breakdown:', actionTypeCounts);

    if (actions.length === 0) {
      // No actions available, end turn
      console.log('🤷 No actions available, ending turn');
      return { type: 'END_TURN', playerId: player.id };
    }

    // STEP 5: SCORE & CHOOSE - Evaluate and select (using fluid personality)
    const scoredActions = this.scoreActions(actions, player, state, mode, fluidPersonality);
    const chosenAction = this.selectActionWithVariance(scoredActions, player, fluidPersonality);

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
    mode: AIMode,
    fluidPersonality?: any
  ): BattleAction[] {
    const actions: BattleAction[] = [];

    // Get my cards on battlefield
    const myCards = state.battlefield
      .flat()
      .filter((c) => c !== null && c.ownerId === player.id);

    console.log(`🃏 AI has ${myCards.length} cards on battlefield`);
    myCards.forEach(card => {
      if (card) {
        console.log(`   - ${card.name} at (${card.position.row},${card.position.col}): hasAttacked=${card.hasAttacked}, hasMoved=${card.hasMoved}, type=${card.combatType}`);
      }
    });

    // Generate deployment actions (with dynamically generated cards!)
    // AI has ENDLESS cards - generate abundant options at different mana costs
    const emptyPositions = state.battlefield.flat().filter(c => c === null).length;

    // Generate 3-5 card options at varying mana costs (low, medium, high)
    // This gives AI real choices and ensures it never runs out of cards
    const cardOptions = Math.min(emptyPositions > 0 ? 5 : 0, 5);

    // Use fluid personality for card generation if available
    const generationPlayer = fluidPersonality
      ? { ...player, aiPersonality: fluidPersonality }
      : player;

    const generatedCards = this.cardGenerator.generateStrategicCards(
      state,
      generationPlayer,
      mode,
      cardOptions
    );

    // Get valid deployment positions (respects zone restrictions)
    const validPositions = BattleEngine.getValidDeploymentPositions(player.id, state);

    // Optimization: Limit to best 3 positions if too many options
    const topPositions = validPositions.length > 3
      ? this.selectBestPositions(validPositions, player, state, mode).slice(0, 3)
      : validPositions;

    generatedCards.forEach((card) => {
      // Only deploy if we have mana
      if (player.mana >= card.manaCost) {
        topPositions.forEach((pos) => {
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

        console.log(`   🎯 ${card.name} checking targets: ${enemyCards.length} enemy cards`);

        enemyCards.forEach((target) => {
          if (target && this.canAttackTarget(card, target)) {
            const attackAction: AttackCardAction = {
              type: 'ATTACK_CARD',
              playerId: player.id,
              attackerCardId: card.id,
              targetCardId: target.id,
            };
            actions.push(attackAction);
            console.log(`      ✅ Can attack ${target.name}`);
          } else if (target) {
            console.log(`      ❌ Cannot attack ${target.name} (out of range)`);
          }
        });

        // Attack castle (only if card can actually reach the castle)
        const enemy = Object.values(state.players).find((p) => p.id !== player.id)!;
        const canAttackCastle = this.canAttackCastle(card, enemy.id, state);
        console.log(`      🏰 Can attack castle: ${canAttackCastle} (col=${card.position.col}, type=${card.combatType})`);

        if (canAttackCastle) {
          const castleAction: AttackCastleAction = {
            type: 'ATTACK_CASTLE',
            playerId: player.id,
            attackerCardId: card.id,
            targetPlayerId: enemy.id,
          };
          actions.push(castleAction);
        }
      }
    });

    // Generate move actions
    // Always consider movement now that melee needs center for castle attacks
    myCards.forEach((card) => {
      if (card && !card.hasMoved) {
        // Get valid movement positions for this specific card (respects movement range)
        const validMoves = BattleEngine.getValidMovementPositions(card, state);

        // Optimization: In aggressive mode, prioritize moves toward center (col 1)
        if (mode === 'AGGRESSIVE') {
          // Only add moves toward center column for melee cards
          const centerMoves = validMoves.filter(pos => {
            if (card.combatType === 'melee') {
              return pos.col === 1; // Move melee to center for castle attacks
            }
            return true; // Keep all moves for ranged/hybrid
          }).slice(0, 2);

          centerMoves.forEach((pos) => {
            const moveAction: MoveCardAction = {
              type: 'MOVE_CARD',
              playerId: player.id,
              cardId: card.id,
              fromPosition: card.position,
              toPosition: pos,
            };
            actions.push(moveAction);
          });
        } else {
          // Other modes: limit to 2-3 best moves
          const topMoves = validMoves.slice(0, 3);

          topMoves.forEach((pos) => {
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
    mode: AIMode,
    fluidPersonality?: any
  ): ScoredAction[] {
    return actions.map((action) => {
      let score = 0;
      const personality = fluidPersonality || player.aiPersonality;

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
    const playerIds = Object.keys(state.players);
    const playerIndex = playerIds.indexOf(player.id);
    const pos = action.position;

    // Moderate penalty if we have many unattacked cards (but don't block deployment entirely)
    // AI has ENDLESS cards so it should feel free to deploy strategically
    const myCards = state.battlefield.flat().filter(c => c && c.ownerId === player.id);
    const unattackedCards = myCards.filter(c => c && !c.hasAttacked);

    if (unattackedCards.length > 2) {
      // Light penalty - prefer attacking with existing cards, but allow deployment
      score -= 15 * (unattackedCards.length - 2); // Only penalize if 3+ unattacked
      console.log(`   ⚠️ Deploy penalty: ${unattackedCards.length} unattacked cards (-${15 * (unattackedCards.length - 2)})`);
    }

    // Value based on card stats
    score += card.attack * 2;
    score += card.hp * 1.5;

    // Column-based position scoring (NEW RULES)
    // Player 1 (index 0): Controls left (col 0), shares center (col 1)
    // Player 2 (index 1): Controls right (col 2), shares center (col 1)

    if (playerIndex === 0) {
      // Player 1 evaluation
      if (mode === 'AGGRESSIVE') {
        // Prefer left flank (col 0) for melee, center (col 1) otherwise
        if (card.combatType === 'melee' && pos.col === 0) {
          score += 25; // Left flank gives +20% attack to melee
        } else if (pos.col === 1) {
          score += 15; // Center for castle attacks
        }
      } else if (mode === 'DEFENSIVE') {
        // Prefer center (col 1) for defense
        if (pos.col === 1) {
          score += 20;
        }
      }
    } else {
      // Player 2 evaluation
      if (mode === 'AGGRESSIVE') {
        // Prefer right flank (col 2) for ranged, center (col 1) for melee
        if (card.combatType === 'ranged' && pos.col === 2) {
          score += 25; // Right flank gives +15% attack to ranged
        } else if (card.combatType === 'melee' && pos.col === 1) {
          score += 20; // Center for melee castle attacks
        }
      } else if (mode === 'DEFENSIVE') {
        // Prefer right flank for defense
        if (pos.col === 2) {
          score += 20; // +10% defense on right flank
        }
      }
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

    const card = state.battlefield
      .flat()
      .find((c) => c?.id === action.cardId);

    if (!card) return 0;

    const playerIds = Object.keys(state.players);
    const playerIndex = playerIds.indexOf(player.id);
    const toPos = action.toPosition;

    // Column-based movement scoring (NEW RULES)
    if (mode === 'AGGRESSIVE') {
      // Melee cards should move toward center (col 1) for castle attacks
      if (card.combatType === 'melee' && toPos.col === 1) {
        score += 25; // High priority - center enables castle attacks
      }

      // Player 1: Moving left (toward col 0) for melee attack bonus
      if (playerIndex === 0 && card.combatType === 'melee' && toPos.col === 0) {
        score += 20; // Left flank melee bonus
      }

      // Player 2: Ranged moving right (toward col 2) for attack bonus
      if (playerIndex === 1 && card.combatType === 'ranged' && toPos.col === 2) {
        score += 20; // Right flank ranged bonus
      }
    } else if (mode === 'DEFENSIVE') {
      // Player 1: Stay in defensive positions (col 0 or 1)
      if (playerIndex === 0 && toPos.col <= 1) {
        score += 15;
      }

      // Player 2: Stay in defensive positions (col 1 or 2)
      if (playerIndex === 1 && toPos.col >= 1) {
        score += 15;
      }
    }

    return score;
  }

  private selectActionWithVariance(
    scoredActions: ScoredAction[],
    player: Player,
    fluidPersonality?: any
  ): ScoredAction {
    const personality = fluidPersonality || player.aiPersonality;

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

  /**
   * Select best deployment positions based on strategy
   * Reduces action space by prioritizing strategic positions
   * NOW GRID-AWARE: Works with any board size/shape!
   */
  private selectBestPositions(
    positions: Position[],
    player: Player,
    state: BattleState,
    mode: AIMode
  ): Position[] {
    const playerIds = Object.keys(state.players);
    const playerIndex = playerIds.indexOf(player.id);
    const gridConfig = state.gridConfig;
    const middleCol = Math.floor(gridConfig.cols / 2);

    // Determine home and enemy sides (Player 1 = left, Player 2 = right)
    const homeCols = playerIndex === 0
      ? Array.from({ length: Math.ceil(gridConfig.cols / 3) }, (_, i) => i) // Left third
      : Array.from({ length: Math.ceil(gridConfig.cols / 3) }, (_, i) => gridConfig.cols - 1 - i); // Right third

    const enemyCols = playerIndex === 0
      ? Array.from({ length: Math.ceil(gridConfig.cols / 3) }, (_, i) => gridConfig.cols - 1 - i) // Right third
      : Array.from({ length: Math.ceil(gridConfig.cols / 3) }, (_, i) => i); // Left third

    // Score each position based on mode and dynamic grid layout
    const scoredPositions = positions.map(pos => {
      let score = 0;

      // Terrain bonus (special tiles give score based on tactical value!)
      const terrainAtPos = state.terrainEffects.find(
        terrain => terrain.position.row === pos.row && terrain.position.col === pos.col
      );
      if (terrainAtPos) {
        // Score terrain based on its bonuses (attack, defense modifiers)
        const terrainScore = (terrainAtPos.attackMod + terrainAtPos.defenseMod) * 50;
        if (terrainScore > 0) {
          score += terrainScore;
          console.log(`   ${terrainAtPos.icon} ${terrainAtPos.type} at (${pos.row},${pos.col}): +${terrainScore} score (attack: ${terrainAtPos.attackMod}, defense: ${terrainAtPos.defenseMod})`);
        }
      }

      // AGGRESSIVE MODE: Push forward to enemy side and center
      if (mode === 'AGGRESSIVE') {
        // Center column is always valuable for aggression (castle attacks)
        if (pos.col === middleCol) {
          score += 25;
        }

        // Enemy side columns (pushing into their territory)
        if (enemyCols.includes(pos.col)) {
          score += 20;
        }

        // Forward rows (closer to enemy castle) - depends on who you are
        const forwardRow = playerIndex === 0
          ? Math.max(...positions.map(p => p.row)) // Player 1: bottom rows are forward
          : Math.min(...positions.map(p => p.row)); // Player 2: top rows are forward

        if (pos.row === forwardRow) {
          score += 15;
        }
      }

      // DEFENSIVE MODE: Hold home territory
      if (mode === 'DEFENSIVE') {
        // Home columns (your side of the board)
        if (homeCols.includes(pos.col)) {
          score += 25;
        }

        // Center as buffer zone
        if (pos.col === middleCol) {
          score += 15;
        }

        // Back rows (protecting castle) - depends on who you are
        const backRow = playerIndex === 0
          ? Math.min(...positions.map(p => p.row)) // Player 1: top rows are back
          : Math.max(...positions.map(p => p.row)); // Player 2: bottom rows are back

        if (pos.row === backRow) {
          score += 15;
        }
      }

      // ADAPTIVE MODE: Center control is key
      if (mode === 'ADAPTIVE') {
        if (pos.col === middleCol) {
          score += 20; // Contested zone control
        }

        // Middle rows (center of battlefield)
        const middleRow = Math.floor(gridConfig.rows / 2);
        if (Math.abs(pos.row - middleRow) <= 1) {
          score += 15;
        }
      }

      // DESPERATE MODE: Maximize board presence (spread out)
      if (mode === 'DESPERATE') {
        // Prefer positions far from existing friendly cards (spread out)
        const myCards = state.battlefield.flat().filter(c => c !== null && c.ownerId === player.id);
        const minDist = Math.min(...myCards.map(card => {
          if (!card) return 999;
          return Math.abs(card.position.row - pos.row) + Math.abs(card.position.col - pos.col);
        }), 0);
        score += minDist * 5; // Reward distance from friendly units
      }

      return { pos, score };
    });

    // Sort by score and return positions
    scoredPositions.sort((a, b) => b.score - a.score);
    return scoredPositions.map(sp => sp.pos);
  }


  /**
   * Check if attacker can attack target based on combat type and range
   * Melee: Can only attack adjacent columns (col ±1)
   * Ranged: Can attack any column
   * Hybrid: Can attack any column
   */
  private canAttackTarget(attacker: BattleCard, target: BattleCard): boolean {
    const colDiff = Math.abs(attacker.position.col - target.position.col);

    // Ranged and hybrid can attack any target
    if (attacker.combatType === 'ranged' || attacker.combatType === 'hybrid') {
      return true;
    }

    // Melee can only attack adjacent columns (within 1 column)
    if (attacker.combatType === 'melee') {
      return colDiff <= 1;
    }

    return true; // Default: allow
  }

  /**
   * Check if attacker can attack enemy castle
   * Melee: Must be in middle column (dynamically calculated) - contested center zone
   * Ranged/Hybrid: Can attack from any column
   * NOW GRID-AWARE: Works with any board width!
   */
  private canAttackCastle(
    attacker: BattleCard,
    targetPlayerId: string,
    state: BattleState
  ): boolean {
    // Ranged and hybrid can attack castle from anywhere
    if (attacker.combatType === 'ranged' || attacker.combatType === 'hybrid') {
      return true;
    }

    // Melee cards must be in the middle column (dynamically calculated)
    // This is the contested center where melee units can reach both castles
    const middleCol = Math.floor(state.gridConfig.cols / 2);

    // For odd-width grids (3, 5, 7), exact middle column
    // For even-width grids (2, 4, 6), allow either of the two middle columns
    if (state.gridConfig.cols % 2 === 1) {
      // Odd width: exact middle only
      return attacker.position.col === middleCol;
    } else {
      // Even width: either of the two middle columns
      return attacker.position.col === middleCol || attacker.position.col === middleCol - 1;
    }
  }

  onTurnStart(player: Player, state: BattleState): void {
    console.log('🌅 AI consciousness initializing for new turn');
    // Fluid state updates happen in selectAction, but we can log here
    const fluidState = this.getFluidState(player);
    console.log('🌊 Current mental state:', fluidState.getStateDescription());
  }

  onTurnEnd(player: Player, state: BattleState): void {
    console.log('🌙 AI consciousness entering rest state');
  }
}
