/**
 * Battle Engine - The Immutable Heart of Tasern
 *
 * Pure functions only. No side effects. No mutations.
 * Every action returns a new state via Immer.
 *
 * Philosophy: The engine doesn't know about React, doesn't know about
 * the store, doesn't know about the UI. It just transforms state.
 */

import { produce } from 'immer';
import type {
  BattleState,
  BattleAction,
  Player,
  BattleCard,
  Position,
  FormationType,
  FormationBonus,
  WeatherEffect,
  VictoryResult,
  DeployCardAction,
  AttackCardAction,
  AttackCastleAction,
  MoveCardAction,
  UseAbilityAction,
  AIMemory,
} from '../types/core';
import { AbilityEngine } from './AbilityEngine';

export class BattleEngine {
  /**
   * Initialize a new battle between two players
   */
  static initializeBattle(player1: Player, player2: Player): BattleState {
    console.log('🏰 Initializing battle:', player1.name, 'vs', player2.name);

    // Initialize AI memories for both players
    const aiMemories: Record<string, AIMemory> = {};

    // Create memory for AI players
    if (player1.type === 'ai') {
      aiMemories[player1.id] = {
        previousActions: [],
        stuckCounter: 0,
        lastBoardHash: '',
        confidenceLevel: 1.0,
        currentMode: 'ADAPTIVE',
      };
    }
    if (player2.type === 'ai') {
      aiMemories[player2.id] = {
        previousActions: [],
        stuckCounter: 0,
        lastBoardHash: '',
        confidenceLevel: 1.0,
        currentMode: 'ADAPTIVE',
      };
    }

    return {
      id: `battle-${Date.now()}`,
      currentTurn: 1,
      phase: 'deployment',
      activePlayerId: player1.id,
      players: {
        [player1.id]: { ...player1, mana: player1.maxMana },
        [player2.id]: { ...player2, mana: player2.maxMana },
      },
      battlefield: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      weather: null,
      terrainEffects: [],
      controlledZones: {},
      winner: null,
      battleLog: [
        {
          turn: 1,
          playerId: 'system',
          action: 'Battle initialized',
          result: `${player1.name} vs ${player2.name}`,
          timestamp: Date.now(),
        },
      ],
      aiMemories,
    };
  }

  /**
   * Execute any battle action and return new immutable state
   */
  static executeAction(state: BattleState, action: BattleAction): BattleState {
    console.log('⚔️ Executing action:', action.type, 'by', action.playerId);
    console.log('   Current activePlayerId:', state.activePlayerId);

    // Validate action is from active player
    // NOTE: In multiplayer, we trust received actions from the opponent
    // The battleStore ensures only the active player can send actions
    if (action.type !== 'END_TURN' && action.playerId !== state.activePlayerId) {
      console.warn('⚠️ Action playerId mismatch - allowing for multiplayer sync');
      console.warn('   Expected:', state.activePlayerId, 'Got:', action.playerId);
      // Don't return early - allow the action to proceed for multiplayer
    }

    switch (action.type) {
      case 'DEPLOY_CARD':
        return this.handleDeployCard(state, action);
      case 'ATTACK_CARD':
        return this.handleAttackCard(state, action);
      case 'ATTACK_CASTLE':
        return this.handleAttackCastle(state, action);
      case 'MOVE_CARD':
        return this.handleMoveCard(state, action);
      case 'USE_ABILITY':
        return this.handleUseAbility(state, action);
      case 'END_TURN':
        return this.endTurn(state);
      default:
        console.warn('❌ Unknown action type');
        return state;
    }
  }

  /**
   * Deploy a card to the battlefield
   * Handles both regular cards (from hand) and AI-generated cards
   */
  private static handleDeployCard(
    state: BattleState,
    action: DeployCardAction
  ): BattleState {
    return produce(state, (draft) => {
      const player = draft.players[action.playerId];
      const { position } = action;

      // Check if position is valid and empty
      if (!this.isValidPosition(position) || draft.battlefield[position.row][position.col]) {
        console.warn('❌ Invalid or occupied position');
        return;
      }

      // Check deployment zone restrictions
      if (!this.canDeployToPosition(position, player.id, draft)) {
        console.warn('❌ Cannot deploy to this zone');
        return;
      }

      // Get card - either generated (AI) or from hand (human)
      let card = action.generatedCard || player.hand.find((c) => c.id === action.cardId);

      if (!card) {
        console.warn('❌ Card not found');
        return;
      }

      // Check mana cost
      if (player.mana < card.manaCost) {
        console.warn('❌ Insufficient mana');
        return;
      }

      // Apply LP bonus to card stats
      const lpMultiplier = 1 + player.lpBonus;
      card = {
        ...card,
        attack: Math.floor(card.attack * lpMultiplier),
        defense: Math.floor(card.defense * lpMultiplier),
        hp: Math.floor(card.hp * lpMultiplier),
        maxHp: Math.floor(card.maxHp * lpMultiplier),
        speed: Math.floor(card.speed * lpMultiplier),
      };

      // Create battle card
      const battleCard: BattleCard = {
        ...card,
        position,
        ownerId: player.id,
        hasMoved: false,
        hasAttacked: false,
        statusEffects: [],
      };

      // Deploy card
      draft.battlefield[position.row][position.col] = battleCard;

      // Deduct mana
      player.mana -= card.manaCost;

      // Only remove from hand if not generated (AI cards don't come from hand)
      if (!action.generatedCard) {
        player.hand = player.hand.filter((c) => c.id !== card.id);
      }

      // Update controlled zones
      const posKey = `${position.row}-${position.col}`;
      draft.controlledZones[posKey] = player.id;

      // Battle log
      draft.battleLog.push({
        turn: draft.currentTurn,
        playerId: player.id,
        action: 'DEPLOY_CARD',
        result: `${card.name} deployed to (${position.row},${position.col})`,
        timestamp: Date.now(),
      });

      console.log(`✅ ${card.name} deployed by ${player.name}`);
    });
  }

  /**
   * Card attacks another card
   */
  private static handleAttackCard(
    state: BattleState,
    action: AttackCardAction
  ): BattleState {
    return produce(state, (draft) => {
      const attacker = this.findCardById(draft.battlefield, action.attackerCardId);
      const target = this.findCardById(draft.battlefield, action.targetCardId);

      if (!attacker || !target) {
        console.warn('❌ Attacker or target not found');
        return;
      }

      if (attacker.hasAttacked) {
        console.warn('❌ Card has already attacked');
        return;
      }

      if (attacker.ownerId === target.ownerId) {
        console.warn('❌ Cannot attack own cards');
        return;
      }

      // Check attack range
      if (!this.canAttackTarget(attacker, target)) {
        console.warn('❌ Target out of attack range');
        return;
      }

      // Calculate damage with modifiers
      const damage = this.calculateDamage(attacker, target, draft);

      // Apply damage
      target.hp -= damage;

      // Check for thorns damage reflection
      const thornsDamage = AbilityEngine.calculateThornsDamage(target, damage);
      if (thornsDamage > 0) {
        attacker.hp -= thornsDamage;
        draft.battleLog.push({
          turn: draft.currentTurn,
          playerId: target.ownerId,
          action: 'THORNS_DAMAGE',
          result: `${target.name}'s thorns dealt ${thornsDamage} damage to ${attacker.name}`,
          timestamp: Date.now(),
        });
      }

      // Mark attacker as having attacked
      attacker.hasAttacked = true;

      // Battle log
      draft.battleLog.push({
        turn: draft.currentTurn,
        playerId: attacker.ownerId,
        action: 'ATTACK_CARD',
        result: `${attacker.name} dealt ${damage} damage to ${target.name}`,
        timestamp: Date.now(),
      });

      // Check if target died
      if (target.hp <= 0) {
        draft.battlefield[target.position.row][target.position.col] = null;
        draft.battleLog.push({
          turn: draft.currentTurn,
          playerId: target.ownerId,
          action: 'CARD_DESTROYED',
          result: `${target.name} was destroyed`,
          timestamp: Date.now(),
        });
        console.log(`💀 ${target.name} destroyed`);
      }

      // Check if attacker died from thorns
      if (attacker.hp <= 0) {
        draft.battlefield[attacker.position.row][attacker.position.col] = null;
        draft.battleLog.push({
          turn: draft.currentTurn,
          playerId: attacker.ownerId,
          action: 'CARD_DESTROYED',
          result: `${attacker.name} was destroyed by thorns`,
          timestamp: Date.now(),
        });
        console.log(`💀 ${attacker.name} destroyed by thorns`);
      }

      console.log(`⚔️ ${attacker.name} attacks ${target.name} for ${damage} damage`);
    });
  }

  /**
   * Card attacks enemy castle
   */
  private static handleAttackCastle(
    state: BattleState,
    action: AttackCastleAction
  ): BattleState {
    return produce(state, (draft) => {
      const attacker = this.findCardById(draft.battlefield, action.attackerCardId);
      const targetPlayer = draft.players[action.targetPlayerId];

      if (!attacker || !targetPlayer) {
        console.warn('❌ Attacker or target player not found');
        return;
      }

      if (attacker.hasAttacked) {
        console.warn('❌ Card has already attacked');
        return;
      }

      if (attacker.ownerId === targetPlayer.id) {
        console.warn('❌ Cannot attack own castle');
        return;
      }

      // Check range for castle attacks (melee only)
      if (!this.canAttackCastle(attacker, targetPlayer.id, draft)) {
        console.warn('❌ Card is out of range to attack castle');
        return;
      }

      // Calculate damage (no defender, so simpler)
      let damage = attacker.attack;
      damage = Math.floor(
        damage *
          this.getFormationBonus(attacker, draft.battlefield).attackMod *
          (draft.weather?.attackMod || 1)
      );

      // 10% crit chance
      if (Math.random() < 0.1) {
        damage = Math.floor(damage * 1.5);
        draft.battleLog.push({
          turn: draft.currentTurn,
          playerId: attacker.ownerId,
          action: 'CRITICAL_HIT',
          result: '💥 Critical hit!',
          timestamp: Date.now(),
        });
      }

      damage = Math.max(1, damage);

      // Apply damage to castle
      targetPlayer.castleHp -= damage;
      attacker.hasAttacked = true;

      // Battle log
      draft.battleLog.push({
        turn: draft.currentTurn,
        playerId: attacker.ownerId,
        action: 'ATTACK_CASTLE',
        result: `${attacker.name} dealt ${damage} damage to ${targetPlayer.name}'s castle`,
        timestamp: Date.now(),
      });

      console.log(`🏰 ${attacker.name} attacks ${targetPlayer.name}'s castle for ${damage} damage`);
    });
  }

  /**
   * Move a card on the battlefield
   */
  private static handleMoveCard(state: BattleState, action: MoveCardAction): BattleState {
    return produce(state, (draft) => {
      const card = this.findCardById(draft.battlefield, action.cardId);

      if (!card) {
        console.warn('❌ Card not found');
        return;
      }

      if (card.hasMoved) {
        console.warn('❌ Card has already moved');
        return;
      }

      const { toPosition } = action;

      if (!this.isValidPosition(toPosition) || draft.battlefield[toPosition.row][toPosition.col]) {
        console.warn('❌ Invalid or occupied position');
        return;
      }

      // Check movement range restrictions
      if (!this.canMoveToPosition(card, toPosition)) {
        console.warn('❌ Target position out of movement range');
        return;
      }

      // Move card
      draft.battlefield[card.position.row][card.position.col] = null;
      card.position = toPosition;
      card.hasMoved = true;
      draft.battlefield[toPosition.row][toPosition.col] = card;

      // Update controlled zones
      const posKey = `${toPosition.row}-${toPosition.col}`;
      draft.controlledZones[posKey] = card.ownerId;

      draft.battleLog.push({
        turn: draft.currentTurn,
        playerId: card.ownerId,
        action: 'MOVE_CARD',
        result: `${card.name} moved to (${toPosition.row},${toPosition.col})`,
        timestamp: Date.now(),
      });

      console.log(`🚶 ${card.name} moved to (${toPosition.row},${toPosition.col})`);
    });
  }

  /**
   * Use a card ability
   */
  private static handleUseAbility(
    state: BattleState,
    action: UseAbilityAction
  ): BattleState {
    return produce(state, (draft) => {
      const card = this.findCardById(draft.battlefield, action.cardId);

      if (!card) {
        console.warn('❌ Card not found');
        return;
      }

      const ability = card.abilities.find((a) => a.id === action.abilityId);

      if (!ability) {
        console.warn('❌ Ability not found');
        return;
      }

      if (ability.currentCooldown > 0) {
        console.warn('❌ Ability on cooldown');
        return;
      }

      const player = draft.players[action.playerId];

      if (player.mana < ability.manaCost) {
        console.warn('❌ Insufficient mana');
        return;
      }

      // Deduct mana and set cooldown
      player.mana -= ability.manaCost;
      ability.currentCooldown = ability.cooldown;

      // Apply ability effect (simplified for now)
      draft.battleLog.push({
        turn: draft.currentTurn,
        playerId: player.id,
        action: 'USE_ABILITY',
        result: `${card.name} used ${ability.name}`,
        timestamp: Date.now(),
      });

      console.log(`✨ ${card.name} used ${ability.name}`);
    });
  }

  /**
   * End the current player's turn
   */
  static endTurn(state: BattleState): BattleState {
    return produce(state, (draft) => {
      const currentPlayer = draft.players[draft.activePlayerId];
      console.log(`⏭️ ${currentPlayer.name} ends turn`);

      // Reset card action flags and process regeneration
      draft.battlefield.forEach((row) => {
        row.forEach((card) => {
          if (card && card.ownerId === draft.activePlayerId) {
            card.hasMoved = false;
            card.hasAttacked = false;

            // Process regeneration
            const { healing, log } = AbilityEngine.processRegeneration(card, draft);
            if (healing > 0) {
              card.hp = Math.min(card.hp + healing, card.maxHp);
              draft.battleLog.push(...log);
            }

            // Reduce ability cooldowns
            card.abilities.forEach((ability) => {
              if (ability.currentCooldown > 0) {
                ability.currentCooldown--;
              }
            });

            // Reduce status effect durations
            card.statusEffects = card.statusEffects.filter((effect) => {
              effect.duration--;
              return effect.duration > 0;
            });
          }
        });
      });

      // Switch to next player
      const playerIds = Object.keys(draft.players);
      const currentIndex = playerIds.indexOf(draft.activePlayerId);
      const nextIndex = (currentIndex + 1) % playerIds.length;
      draft.activePlayerId = playerIds[nextIndex];

      // If we've cycled back to first player, increment turn
      if (nextIndex === 0) {
        draft.currentTurn++;

        // Weather duration
        if (draft.weather) {
          draft.weather.turnsRemaining--;
          if (draft.weather.turnsRemaining <= 0) {
            draft.battleLog.push({
              turn: draft.currentTurn,
              playerId: 'system',
              action: 'WEATHER_CHANGE',
              result: 'Weather cleared',
              timestamp: Date.now(),
            });
            draft.weather = null;
          }
        }
      }

      const nextPlayer = draft.players[draft.activePlayerId];

      // Restore mana for new turn
      nextPlayer.mana = Math.min(nextPlayer.mana + 3, nextPlayer.maxMana);

      // Draw cards for human players (if deck has cards)
      if (nextPlayer.type === 'human' && nextPlayer.deck.length > 0) {
        const cardsToDraw = Math.min(1, nextPlayer.deck.length); // Draw 1 card per turn
        const drawnCards = nextPlayer.deck.splice(0, cardsToDraw);
        nextPlayer.hand.push(...drawnCards);

        draft.battleLog.push({
          turn: draft.currentTurn,
          playerId: nextPlayer.id,
          action: 'DRAW_CARD',
          result: `Drew ${cardsToDraw} card(s)`,
          timestamp: Date.now(),
        });

        console.log(`📇 ${nextPlayer.name} drew ${cardsToDraw} card(s) - Hand: ${nextPlayer.hand.length}, Deck: ${nextPlayer.deck.length}`);
      }

      // Call strategy onTurnStart
      nextPlayer.strategy.onTurnStart(nextPlayer, draft);

      draft.battleLog.push({
        turn: draft.currentTurn,
        playerId: nextPlayer.id,
        action: 'TURN_START',
        result: `${nextPlayer.name}'s turn begins`,
        timestamp: Date.now(),
      });

      console.log(`▶️ ${nextPlayer.name}'s turn begins (Turn ${draft.currentTurn})`);
    });
  }

  /**
   * Check if battle has a winner
   */
  static checkVictoryConditions(state: BattleState): VictoryResult | null {
    const playerIds = Object.keys(state.players);

    // Castle destruction
    for (const playerId of playerIds) {
      const player = state.players[playerId];
      if (player.castleHp <= 0) {
        const winnerId = playerIds.find((id) => id !== playerId)!;
        console.log(`🏆 ${state.players[winnerId].name} wins by castle destruction!`);
        return {
          winnerId,
          condition: 'CASTLE_DESTROYED',
          turn: state.currentTurn,
        };
      }
    }

    // Turn limit (50 turns default)
    if (state.currentTurn >= 50) {
      // Player with highest castle HP wins
      const sorted = playerIds.sort(
        (a, b) => state.players[b].castleHp - state.players[a].castleHp
      );
      console.log(`🏆 ${state.players[sorted[0]].name} wins by turn limit!`);
      return {
        winnerId: sorted[0],
        condition: 'TURN_LIMIT',
        turn: state.currentTurn,
      };
    }

    // Resource exhaustion (human players only)
    for (const playerId of playerIds) {
      const player = state.players[playerId];
      if (player.type === 'human' && player.hand.length === 0 && player.deck.length === 0) {
        const cardsOnBoard = state.battlefield.flat().filter((c) => c?.ownerId === playerId);
        if (cardsOnBoard.length === 0) {
          const winnerId = playerIds.find((id) => id !== playerId)!;
          console.log(`🏆 ${state.players[winnerId].name} wins by resource exhaustion!`);
          return {
            winnerId,
            condition: 'RESOURCE_EXHAUSTION',
            turn: state.currentTurn,
          };
        }
      }
    }

    return null;
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private static findCardById(battlefield: BattleCard[][], cardId: string): BattleCard | null {
    for (const row of battlefield) {
      for (const card of row) {
        if (card && card.id === cardId) {
          return card;
        }
      }
    }
    return null;
  }

  private static isValidPosition(pos: Position): boolean {
    return pos.row >= 0 && pos.row < 3 && pos.col >= 0 && pos.col < 3;
  }

  /**
   * Calculate damage with all modifiers
   */
  private static calculateDamage(
    attacker: BattleCard,
    defender: BattleCard,
    state: BattleState
  ): number {
    let damage = attacker.attack;

    // Aura bonuses from adjacent allies
    const attackerAura = AbilityEngine.getAuraBonus(attacker, state.battlefield);
    damage += attackerAura.attack;

    // Zone effects
    const attackerZone = this.getZoneModifiers(attacker);
    damage *= attackerZone.attackMod;

    // Formation bonus
    const formationBonus = this.getFormationBonus(attacker, state.battlefield);
    damage *= formationBonus.attackMod;

    // Weather modifier
    if (state.weather) {
      damage *= state.weather.attackMod;
    }

    // Terrain modifier
    const terrain = state.terrainEffects.find(
      (t) => t.position.row === attacker.position.row && t.position.col === attacker.position.col
    );
    if (terrain) {
      damage *= terrain.attackMod;
    }

    // Critical hit (10% chance)
    if (Math.random() < 0.1) {
      damage *= 1.5;
    }

    // Apply defender's zone defense modifier and aura
    const defenderZone = this.getZoneModifiers(defender);
    const defenderAura = AbilityEngine.getAuraBonus(defender, state.battlefield);
    let effectiveDefense = (defender.defense + defenderAura.defense) * defenderZone.defenseMod;

    // Subtract defense
    damage -= effectiveDefense;

    // Minimum 1 damage
    return Math.max(1, Math.floor(damage));
  }

  /**
   * Get zone modifiers based on card position
   * Left Flank (col 0): +20% attack, -10% defense for melee; -20% attack for ranged
   * Center (col 1): No modifiers
   * Right Flank (col 2): +15% attack for ranged, +10% defense; -20% attack for melee
   */
  private static getZoneModifiers(card: BattleCard): { attackMod: number; defenseMod: number } {
    const col = card.position.col;

    // Left Flank (col 0)
    if (col === 0) {
      if (card.combatType === 'melee') {
        return { attackMod: 1.2, defenseMod: 0.9 };
      } else if (card.combatType === 'ranged') {
        return { attackMod: 0.8, defenseMod: 0.9 };
      } else { // hybrid
        return { attackMod: 1.0, defenseMod: 0.9 };
      }
    }

    // Right Flank (col 2)
    if (col === 2) {
      if (card.combatType === 'melee') {
        return { attackMod: 0.8, defenseMod: 1.1 };
      } else if (card.combatType === 'ranged') {
        return { attackMod: 1.15, defenseMod: 1.1 };
      } else { // hybrid
        return { attackMod: 1.0, defenseMod: 1.1 };
      }
    }

    // Center (col 1) - neutral
    return { attackMod: 1.0, defenseMod: 1.0 };
  }

  /**
   * Get formation bonus for a card
   */
  private static getFormationBonus(card: BattleCard, battlefield: BattleCard[][]): FormationBonus {
    const allies = battlefield.flat().filter((c) => c && c.ownerId === card.ownerId);

    // Check each formation type
    const frontCards = allies.filter((c) => c.position.row === 0);
    if (frontCards.length >= 2) {
      return { type: 'VANGUARD', attackMod: 1.2, defenseMod: 1.0, speedMod: 1.0 };
    }

    const backCards = allies.filter((c) => c.position.row === 2);
    if (backCards.length >= 2) {
      return { type: 'ARCHER_LINE', attackMod: 1.15, defenseMod: 0.9, speedMod: 1.0 };
    }

    // Check horizontal line
    for (let row = 0; row < 3; row++) {
      const rowCards = allies.filter((c) => c.position.row === row);
      if (rowCards.length === 3) {
        return { type: 'PHALANX', attackMod: 1.0, defenseMod: 1.3, speedMod: 0.9 };
      }
    }

    // Default: Skirmish
    return { type: 'SKIRMISH', attackMod: 1.0, defenseMod: 1.0, speedMod: 1.05 };
  }

  /**
   * Check if attacker can attack target based on combat type and range
   * Melee: Can only attack adjacent columns (col ±1)
   * Ranged: Can attack any column
   * Hybrid: Can attack any column
   */
  private static canAttackTarget(attacker: BattleCard, target: BattleCard): boolean {
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
   * Melee: Must be in middle column (col 1) - contested center zone
   * Ranged/Hybrid: Can attack from any column
   */
  private static canAttackCastle(
    attacker: BattleCard,
    targetPlayerId: string,
    state: BattleState
  ): boolean {
    // Ranged and hybrid can attack castle from anywhere
    if (attacker.combatType === 'ranged' || attacker.combatType === 'hybrid') {
      return true;
    }

    // Melee cards must be in the middle column (col 1)
    // This is the contested center where melee units can reach both castles
    return attacker.position.col === 1;
  }

  /**
   * Check if a player can deploy to a specific position
   * Deployment zones based on player order (column-based)
   * Players face each other left-to-right across the battlefield
   */
  private static canDeployToPosition(
    position: Position,
    playerId: string,
    state: BattleState
  ): boolean {
    const playerIds = Object.keys(state.players);
    const playerIndex = playerIds.indexOf(playerId);

    // Player 1 (left side) can deploy to columns 0-1 (left and center)
    // Player 2 (right side) can deploy to columns 1-2 (center and right)
    if (playerIndex === 0) {
      return position.col <= 1; // Columns 0-1
    } else {
      return position.col >= 1; // Columns 1-2
    }
  }

  /**
   * Check if a card can move to a target position based on movement range
   * Movement range determined by combat type:
   * - Melee: Can move to adjacent cells (1 cell in any direction)
   * - Ranged: Can move 1-2 cells
   * - Hybrid: Can move up to 2 cells
   */
  private static canMoveToPosition(card: BattleCard, toPosition: Position): boolean {
    const fromPos = card.position;
    const rowDiff = Math.abs(toPosition.row - fromPos.row);
    const colDiff = Math.abs(toPosition.col - fromPos.col);
    const totalDistance = rowDiff + colDiff; // Manhattan distance

    // Melee cards can only move to adjacent cells (distance of 1)
    if (card.combatType === 'melee') {
      return totalDistance === 1;
    }

    // Ranged cards can move up to 2 cells
    if (card.combatType === 'ranged') {
      return totalDistance <= 2;
    }

    // Hybrid cards can move up to 2 cells
    if (card.combatType === 'hybrid') {
      return totalDistance <= 2;
    }

    return false;
  }

  /**
   * Get valid deployment positions for a player
   */
  static getValidDeploymentPositions(playerId: string, state: BattleState): Position[] {
    const positions: Position[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const pos: Position = { row, col };

        // Check if position is empty and within deployment zone
        if (!state.battlefield[row][col] && this.canDeployToPosition(pos, playerId, state)) {
          positions.push(pos);
        }
      }
    }

    return positions;
  }

  /**
   * Get valid movement positions for a card
   */
  static getValidMovementPositions(card: BattleCard, state: BattleState): Position[] {
    const positions: Position[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const pos: Position = { row, col };

        // Check if position is empty and within movement range
        if (!state.battlefield[row][col] && this.canMoveToPosition(card, pos)) {
          positions.push(pos);
        }
      }
    }

    return positions;
  }
}
