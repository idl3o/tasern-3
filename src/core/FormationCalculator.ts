/**
 * Formation Calculator
 *
 * Analyzes battlefield positioning to determine formation bonuses.
 * Tactical depth through positioning - formations matter!
 */

import type { BattleCard, Battlefield, FormationType, FormationBonus, Position } from '../types/core';

export class FormationCalculator {
  /**
   * Calculate formation bonus for a specific card
   */
  static calculateFormationBonus(
    card: BattleCard,
    battlefield: Battlefield
  ): FormationBonus {
    const allies = this.getAllyCards(card.ownerId, battlefield);

    // Check formations in order of specificity
    const formation =
      this.checkSiegeFormation(allies, card) ||
      this.checkPhalanxFormation(allies) ||
      this.checkVanguardFormation(allies) ||
      this.checkArcherLineFormation(allies) ||
      this.checkFlankingFormation(allies) ||
      this.getDefaultFormation();

    return formation;
  }

  /**
   * Get all allied cards on battlefield
   */
  private static getAllyCards(ownerId: string, battlefield: Battlefield): BattleCard[] {
    return battlefield.flat().filter((c) => c !== null && c.ownerId === ownerId) as BattleCard[];
  }

  /**
   * VANGUARD - 2+ cards in front row (row 0)
   * Bonus: +20% attack
   */
  private static checkVanguardFormation(allies: BattleCard[]): FormationBonus | null {
    const frontCards = allies.filter((c) => c.position.row === 0);

    if (frontCards.length >= 2) {
      return {
        type: 'VANGUARD',
        attackMod: 1.2,
        defenseMod: 1.0,
        speedMod: 1.0,
      };
    }

    return null;
  }

  /**
   * PHALANX - 3 cards in horizontal line
   * Bonus: +30% defense, -10% speed
   */
  private static checkPhalanxFormation(allies: BattleCard[]): FormationBonus | null {
    for (let row = 0; row < 3; row++) {
      const rowCards = allies.filter((c) => c.position.row === row);
      if (rowCards.length === 3) {
        return {
          type: 'PHALANX',
          attackMod: 1.0,
          defenseMod: 1.3,
          speedMod: 0.9,
        };
      }
    }

    return null;
  }

  /**
   * ARCHER_LINE - 2+ cards in back row (row 2)
   * Bonus: +15% attack, -10% defense
   */
  private static checkArcherLineFormation(allies: BattleCard[]): FormationBonus | null {
    const backCards = allies.filter((c) => c.position.row === 2);

    if (backCards.length >= 2) {
      return {
        type: 'ARCHER_LINE',
        attackMod: 1.15,
        defenseMod: 0.9,
        speedMod: 1.0,
      };
    }

    return null;
  }

  /**
   * FLANKING - Cards on both left (col 0) and right (col 2) sides
   * Bonus: +10% attack, +15% speed
   */
  private static checkFlankingFormation(allies: BattleCard[]): FormationBonus | null {
    const leftCards = allies.filter((c) => c.position.col === 0);
    const rightCards = allies.filter((c) => c.position.col === 2);

    if (leftCards.length > 0 && rightCards.length > 0) {
      return {
        type: 'FLANKING',
        attackMod: 1.1,
        defenseMod: 1.0,
        speedMod: 1.15,
      };
    }

    return null;
  }

  /**
   * SIEGE - 2+ cards in enemy territory (experimental - needs enemy zone definition)
   * Bonus: +25% attack, -15% defense
   */
  private static checkSiegeFormation(allies: BattleCard[], card: BattleCard): FormationBonus | null {
    // For now, consider front row as "aggressive positioning"
    // In full implementation, would check actual enemy territory
    const aggressiveCards = allies.filter((c) => c.position.row === 0);

    if (aggressiveCards.length >= 2 && card.position.row === 0) {
      return {
        type: 'SIEGE',
        attackMod: 1.25,
        defenseMod: 0.85,
        speedMod: 1.0,
      };
    }

    return null;
  }

  /**
   * SKIRMISH - Default formation when no others apply
   * Bonus: +5% speed
   */
  private static getDefaultFormation(): FormationBonus {
    return {
      type: 'SKIRMISH',
      attackMod: 1.0,
      defenseMod: 1.0,
      speedMod: 1.05,
    };
  }

  /**
   * Get formation description for UI
   */
  static getFormationDescription(type: FormationType): string {
    switch (type) {
      case 'VANGUARD':
        return '⚔️ Vanguard: Front-loaded offense (+20% attack)';
      case 'PHALANX':
        return '🛡️ Phalanx: Impenetrable wall (+30% defense, -10% speed)';
      case 'ARCHER_LINE':
        return '🏹 Archer Line: Ranged superiority (+15% attack, -10% defense)';
      case 'FLANKING':
        return '🦅 Flanking: Swift encirclement (+10% attack, +15% speed)';
      case 'SIEGE':
        return '🏰 Siege: All-out assault (+25% attack, -15% defense)';
      case 'SKIRMISH':
        return '⚡ Skirmish: Flexible positioning (+5% speed)';
      default:
        return 'Standard formation';
    }
  }

  /**
   * Get formation tactical advice
   */
  static getFormationTactics(type: FormationType): string {
    switch (type) {
      case 'VANGUARD':
        return 'Strong offense. Keep pressure on enemy front line.';
      case 'PHALANX':
        return 'Defensive wall. Slow but nearly unbreakable.';
      case 'ARCHER_LINE':
        return 'Hit from range. Protect your back line.';
      case 'FLANKING':
        return 'Speed advantage. Strike from multiple angles.';
      case 'SIEGE':
        return 'High-risk offense. All chips on the table.';
      case 'SKIRMISH':
        return 'Flexible positioning. Adapt to enemy strategy.';
      default:
        return 'Position units for formation bonuses.';
    }
  }

  /**
   * Suggest optimal positioning for formation type
   */
  static suggestPositioning(desiredFormation: FormationType): Position[] {
    switch (desiredFormation) {
      case 'VANGUARD':
        return [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
        ];

      case 'PHALANX':
        return [
          { row: 1, col: 0 },
          { row: 1, col: 1 },
          { row: 1, col: 2 },
        ];

      case 'ARCHER_LINE':
        return [
          { row: 2, col: 0 },
          { row: 2, col: 1 },
          { row: 2, col: 2 },
        ];

      case 'FLANKING':
        return [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
          { row: 0, col: 2 },
          { row: 1, col: 2 },
        ];

      case 'SIEGE':
        return [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
        ];

      default:
        return [
          { row: 1, col: 1 },
          { row: 0, col: 0 },
          { row: 2, col: 2 },
        ];
    }
  }

  /**
   * Analyze battlefield and suggest formations
   */
  static analyzeFormationOpportunities(
    ownerId: string,
    battlefield: Battlefield
  ): {
    current: FormationType;
    suggestions: { formation: FormationType; cardsNeeded: number }[];
  } {
    const allies = this.getAllyCards(ownerId, battlefield);

    if (allies.length === 0) {
      return {
        current: 'SKIRMISH',
        suggestions: [
          { formation: 'VANGUARD', cardsNeeded: 2 },
          { formation: 'ARCHER_LINE', cardsNeeded: 2 },
        ],
      };
    }

    // Determine current formation
    const currentCard = allies[0];
    const current = this.calculateFormationBonus(currentCard, battlefield).type;

    // Suggest formations within reach
    const suggestions: { formation: FormationType; cardsNeeded: number }[] = [];

    const frontCards = allies.filter((c) => c.position.row === 0).length;
    const backCards = allies.filter((c) => c.position.row === 2).length;
    const leftCards = allies.filter((c) => c.position.col === 0).length;
    const rightCards = allies.filter((c) => c.position.col === 2).length;

    // Vanguard
    if (frontCards < 2) {
      suggestions.push({ formation: 'VANGUARD', cardsNeeded: 2 - frontCards });
    }

    // Archer Line
    if (backCards < 2) {
      suggestions.push({ formation: 'ARCHER_LINE', cardsNeeded: 2 - backCards });
    }

    // Flanking
    if (leftCards === 0 || rightCards === 0) {
      suggestions.push({ formation: 'FLANKING', cardsNeeded: leftCards === 0 ? 1 : rightCards === 0 ? 1 : 2 });
    }

    return { current, suggestions };
  }
}
