/**
 * Formation Calculator
 *
 * Analyzes battlefield positioning to determine formation bonuses.
 * Tactical depth through positioning - formations matter!
 *
 * Grid-aware as of May 2026 — works on any GridConfig, not just 3x3.
 * Single source of truth for formation logic; BattleEngine delegates here.
 */

import type {
  BattleCard,
  Battlefield,
  FormationType,
  FormationBonus,
  Position,
  GridConfig,
} from '../types/core';

export class FormationCalculator {
  /**
   * Calculate formation bonus for a specific card.
   * Checks formations in priority order — most specific first.
   */
  static calculateFormationBonus(
    card: BattleCard,
    battlefield: Battlefield,
    gridConfig: GridConfig
  ): FormationBonus {
    const allies = this.getAllyCards(card.ownerId, battlefield);

    const formation =
      this.checkSiegeFormation(allies, card) ||
      this.checkPhalanxFormation(allies, gridConfig) ||
      this.checkVanguardFormation(allies) ||
      this.checkArcherLineFormation(allies, gridConfig) ||
      this.checkFlankingFormation(allies, gridConfig) ||
      this.getDefaultFormation();

    return formation;
  }

  private static getAllyCards(ownerId: string, battlefield: Battlefield): BattleCard[] {
    return battlefield.flat().filter((c) => c !== null && c.ownerId === ownerId) as BattleCard[];
  }

  /**
   * VANGUARD — 2+ allies in the front row (row 0).
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
   * PHALANX — 3+ allies in any single horizontal row.
   * Bonus: +30% defense, -10% speed
   */
  private static checkPhalanxFormation(
    allies: BattleCard[],
    gridConfig: GridConfig
  ): FormationBonus | null {
    for (let row = 0; row < gridConfig.rows; row++) {
      const rowCards = allies.filter((c) => c.position.row === row);
      if (rowCards.length >= 3) {
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
   * ARCHER_LINE — 2+ allies in the back row (last row, grid-aware).
   * Bonus: +15% attack, -10% defense
   */
  private static checkArcherLineFormation(
    allies: BattleCard[],
    gridConfig: GridConfig
  ): FormationBonus | null {
    const backRow = gridConfig.rows - 1;
    const backCards = allies.filter((c) => c.position.row === backRow);

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
   * FLANKING — allies on both edge columns (col 0 and last col, grid-aware).
   * Bonus: +10% attack, +15% speed
   */
  private static checkFlankingFormation(
    allies: BattleCard[],
    gridConfig: GridConfig
  ): FormationBonus | null {
    const rightCol = gridConfig.cols - 1;
    const leftCards = allies.filter((c) => c.position.col === 0);
    const rightCards = allies.filter((c) => c.position.col === rightCol);

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
   * SIEGE — 2+ allies pressed up against the front row, with the attacker among them.
   * Heuristic since "enemy territory" depends on player perspective; treats row 0 as
   * the aggressive line for both players. Bonus: +25% attack, -15% defense
   */
  private static checkSiegeFormation(allies: BattleCard[], card: BattleCard): FormationBonus | null {
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
   * SKIRMISH — default formation when nothing else fires.
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
   * Suggest example positioning for a formation type, scaled to the current grid.
   */
  static suggestPositioning(
    desiredFormation: FormationType,
    gridConfig: GridConfig
  ): Position[] {
    const lastCol = gridConfig.cols - 1;
    const lastRow = gridConfig.rows - 1;
    const midCol = Math.floor(gridConfig.cols / 2);
    const midRow = Math.floor(gridConfig.rows / 2);

    switch (desiredFormation) {
      case 'VANGUARD':
      case 'SIEGE':
        return [
          { row: 0, col: 0 },
          { row: 0, col: midCol },
          { row: 0, col: lastCol },
        ];

      case 'PHALANX':
        return [
          { row: midRow, col: 0 },
          { row: midRow, col: midCol },
          { row: midRow, col: lastCol },
        ];

      case 'ARCHER_LINE':
        return [
          { row: lastRow, col: 0 },
          { row: lastRow, col: midCol },
          { row: lastRow, col: lastCol },
        ];

      case 'FLANKING':
        return [
          { row: 0, col: 0 },
          { row: midRow, col: 0 },
          { row: 0, col: lastCol },
          { row: midRow, col: lastCol },
        ];

      default:
        return [
          { row: midRow, col: midCol },
          { row: 0, col: 0 },
          { row: lastRow, col: lastCol },
        ];
    }
  }

  /**
   * Analyze the battlefield and surface which formations are within reach.
   */
  static analyzeFormationOpportunities(
    ownerId: string,
    battlefield: Battlefield,
    gridConfig: GridConfig
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

    const currentCard = allies[0];
    const current = this.calculateFormationBonus(currentCard, battlefield, gridConfig).type;

    const suggestions: { formation: FormationType; cardsNeeded: number }[] = [];

    const lastRow = gridConfig.rows - 1;
    const rightCol = gridConfig.cols - 1;

    const frontCards = allies.filter((c) => c.position.row === 0).length;
    const backCards = allies.filter((c) => c.position.row === lastRow).length;
    const leftCards = allies.filter((c) => c.position.col === 0).length;
    const rightCards = allies.filter((c) => c.position.col === rightCol).length;

    if (frontCards < 2) {
      suggestions.push({ formation: 'VANGUARD', cardsNeeded: 2 - frontCards });
    }

    if (backCards < 2) {
      suggestions.push({ formation: 'ARCHER_LINE', cardsNeeded: 2 - backCards });
    }

    if (leftCards === 0 || rightCards === 0) {
      suggestions.push({
        formation: 'FLANKING',
        cardsNeeded: leftCards === 0 ? 1 : rightCards === 0 ? 1 : 2,
      });
    }

    return { current, suggestions };
  }
}
