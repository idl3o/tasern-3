/**
 * Ability Engine
 *
 * Processes passive and triggered abilities
 * Pure functions - no state mutation
 */

import type { BattleState, BattleCard, Position, BattleLogEntry } from '../types/core';
import type { PassiveAbility, TriggeredAbility, TriggeredAbilityType } from '../types/abilities';

export class AbilityEngine {
  /**
   * Apply all passive ability effects to a card's stats
   */
  static applyPassiveAbilities(
    card: BattleCard,
    battlefield: BattleCard[][],
    battleLog: BattleLogEntry[]
  ): { modifiedCard: BattleCard; log: BattleLogEntry[] } {
    let modifiedCard = { ...card };
    const log = [...battleLog];

    // For now, we'll use the simple string abilities from CardAbility
    // Later we can convert these to full ability objects

    return { modifiedCard, log };
  }

  /**
   * Get adjacent positions (horizontal, vertical, not diagonal)
   */
  static getAdjacentPositions(position: Position): Position[] {
    const adjacent: Position[] = [];
    const { row, col } = position;

    // Up
    if (row > 0) adjacent.push({ row: row - 1, col });
    // Down
    if (row < 2) adjacent.push({ row: row + 1, col });
    // Left
    if (col > 0) adjacent.push({ row, col: col - 1 });
    // Right
    if (col < 2) adjacent.push({ row, col: col + 1 });

    return adjacent;
  }

  /**
   * Get cards at specific positions
   */
  static getCardsAtPositions(
    battlefield: BattleCard[][],
    positions: Position[]
  ): BattleCard[] {
    return positions
      .map((pos) => battlefield[pos.row][pos.col])
      .filter((card): card is BattleCard => card !== null);
  }

  /**
   * Trigger abilities on specific event
   */
  static triggerAbilities(
    triggerType: TriggeredAbilityType,
    sourceCard: BattleCard,
    state: BattleState,
    targetCard?: BattleCard
  ): BattleLogEntry[] {
    const log: BattleLogEntry[] = [];

    // For now, we'll use simple ability triggers
    // Later we can expand this with the full triggered ability system

    return log;
  }

  /**
   * Process regeneration abilities (called at turn start)
   */
  static processRegeneration(
    card: BattleCard,
    state: BattleState
  ): { healing: number; log: BattleLogEntry[] } {
    const log: BattleLogEntry[] = [];
    let healing = 0;

    // Check for regeneration in abilities
    const hasRegen = card.abilities.some((ability) =>
      ability.name.toLowerCase().includes('regen')
    );

    if (hasRegen && card.hp < card.maxHp) {
      healing = Math.min(2, card.maxHp - card.hp); // Heal 2 HP
      log.push({
        turn: state.currentTurn,
        playerId: card.ownerId,
        action: 'REGENERATION',
        result: `${card.name} regenerated ${healing} HP`,
        timestamp: Date.now(),
      });
    }

    return { healing, log };
  }

  /**
   * Calculate thorns damage (reflect damage)
   */
  static calculateThornsDamage(card: BattleCard, damageReceived: number): number {
    const hasThorns = card.abilities.some((ability) =>
      ability.name.toLowerCase().includes('thorns')
    );

    if (hasThorns) {
      return Math.floor(damageReceived * 0.3); // Reflect 30% of damage
    }

    return 0;
  }

  /**
   * Get aura bonus for adjacent allies
   */
  static getAuraBonus(
    card: BattleCard,
    battlefield: BattleCard[][]
  ): { attack: number; defense: number } {
    const adjacentPositions = this.getAdjacentPositions(card.position);
    const adjacentCards = this.getCardsAtPositions(battlefield, adjacentPositions);

    let attackBonus = 0;
    let defenseBonus = 0;

    // Check adjacent allies for aura abilities
    adjacentCards.forEach((adjacent) => {
      if (adjacent.ownerId === card.ownerId) {
        const hasGuardianAura = adjacent.abilities.some((ability) =>
          ability.name.toLowerCase().includes('guardian') ||
          ability.name.toLowerCase().includes('aura')
        );

        if (hasGuardianAura) {
          defenseBonus += 5;
        }

        const hasRally = adjacent.abilities.some((ability) =>
          ability.name.toLowerCase().includes('rally')
        );

        if (hasRally) {
          attackBonus += 5;
        }
      }
    });

    return { attack: attackBonus, defense: defenseBonus };
  }
}
