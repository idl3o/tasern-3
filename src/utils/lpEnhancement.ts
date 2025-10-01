/**
 * LP Enhancement System - Regenerative Finance Integration
 *
 * Formula discovered through transaction analysis and EIP-1167 proxy detection.
 * LP holdings enhance card stats based on proven multipliers from tasern 2.
 *
 * Philosophy: NFT LP holdings boost card power. The more you commit to the
 * ecosystem, the stronger your cards become.
 */

import type { Card } from '../types/core';

/**
 * Impact asset holdings for a player
 */
export interface ImpactAssets {
  lpBalance: number; // LP token balance
  dddBalance: number; // DDD token balance
  axlRegenBalance: number; // axlREGEN token balance
  totalValue: number; // Combined value
  discoveryMethod: 'direct' | 'proxy' | 'implementation' | 'none';
}

/**
 * Enhancement level (0-5 star system)
 */
export function calculateEnhancementLevel(impactAssets: ImpactAssets): number {
  const { totalValue } = impactAssets;

  if (totalValue === 0) return 0;
  if (totalValue < 0.01) return 1;
  if (totalValue < 0.05) return 2;
  if (totalValue < 0.1) return 3;
  if (totalValue < 0.5) return 4;
  return 5; // Legendary enhancement
}

/**
 * Calculate stat multipliers based on LP holdings
 *
 * Core Formula (proven from tasern 2):
 * - Each 0.01 LP token = +5% to all stats (500% per full LP!)
 * - DDD tokens boost attack (2x multiplier)
 * - axlREGEN tokens boost HP (3x multiplier)
 */
export function calculateLPMultipliers(impactAssets: ImpactAssets): {
  lpMultiplier: number;
  dddAttackBonus: number;
  axlRegenHealthBonus: number;
  overallMultiplier: number;
} {
  const { lpBalance, dddBalance, axlRegenBalance } = impactAssets;

  // LP provides the base multiplier (each 0.01 LP = +5% = 1.05x)
  // So 1 full LP = 100 * 0.01 * 5% = +500% = 6x multiplier!
  const lpMultiplier = 1 + lpBalance * 5;

  // DDD boosts attack specifically
  const dddAttackBonus = Math.floor(dddBalance * 2);

  // axlREGEN boosts health specifically
  const axlRegenHealthBonus = Math.floor(axlRegenBalance * 3);

  // Overall multiplier for general use
  const overallMultiplier = lpMultiplier + (dddBalance * 0.2) + (axlRegenBalance * 0.3);

  return {
    lpMultiplier,
    dddAttackBonus,
    axlRegenHealthBonus,
    overallMultiplier,
  };
}

/**
 * Apply LP enhancement to a card
 */
export function enhanceCardWithLP(card: Card, impactAssets: ImpactAssets): Card {
  if (impactAssets.totalValue === 0) {
    return card; // No enhancement
  }

  const multipliers = calculateLPMultipliers(impactAssets);
  const enhancementLevel = calculateEnhancementLevel(impactAssets);

  // Apply LP multiplier to base stats
  const enhancedCard: Card = {
    ...card,
    attack: Math.round(card.attack * multipliers.lpMultiplier) + multipliers.dddAttackBonus,
    hp: Math.round(card.hp * multipliers.lpMultiplier) + multipliers.axlRegenHealthBonus,
    maxHp: Math.round(card.maxHp * multipliers.lpMultiplier) + multipliers.axlRegenHealthBonus,
    defense: Math.round(card.defense * multipliers.lpMultiplier),
    speed: Math.round(card.speed * multipliers.lpMultiplier),
  };

  // Add enhancement indicators to abilities
  const enhancementAbilities: string[] = [];

  if (impactAssets.lpBalance > 0) {
    const lpBoostPercent = Math.round(impactAssets.lpBalance * 500);
    enhancementAbilities.push(
      `LP Enhanced +${lpBoostPercent}% (${impactAssets.lpBalance.toFixed(4)} LP)`
    );
  }

  if (impactAssets.dddBalance > 0) {
    enhancementAbilities.push(
      `DDD Backed +${multipliers.dddAttackBonus} ATK (${impactAssets.dddBalance.toFixed(3)} DDD)`
    );
  }

  if (impactAssets.axlRegenBalance > 0) {
    enhancementAbilities.push(
      `axlREGEN +${multipliers.axlRegenHealthBonus} HP (${impactAssets.axlRegenBalance.toFixed(
        3
      )} REGEN)`
    );
  }

  if (impactAssets.discoveryMethod !== 'none') {
    enhancementAbilities.push(`Impact Assets (${impactAssets.discoveryMethod})`);
  }

  // Add stars for visual indicator
  if (enhancementLevel > 0) {
    const stars = '⭐'.repeat(enhancementLevel);
    enhancementAbilities.push(`${stars} Tier ${enhancementLevel}`);
  }

  return {
    ...enhancedCard,
    abilities: [...card.abilities] as any,
  };
}

/**
 * Calculate player's LP bonus (used in Player.lpBonus)
 */
export function calculatePlayerLPBonus(impactAssets: ImpactAssets): number {
  const multipliers = calculateLPMultipliers(impactAssets);

  // Return the overall bonus as a decimal (e.g., 0.05 = +5%)
  return multipliers.overallMultiplier - 1;
}

/**
 * Get enhancement tier name
 */
export function getEnhancementTierName(level: number): string {
  switch (level) {
    case 0:
      return 'Standard';
    case 1:
      return 'Bronze';
    case 2:
      return 'Silver';
    case 3:
      return 'Gold';
    case 4:
      return 'Platinum';
    case 5:
      return 'Diamond';
    default:
      return 'Unknown';
  }
}

/**
 * Get enhancement color for UI
 */
export function getEnhancementColor(level: number): string {
  switch (level) {
    case 0:
      return '#808080'; // Gray
    case 1:
      return '#CD7F32'; // Bronze
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#FFD700'; // Gold
    case 4:
      return '#E5E4E2'; // Platinum
    case 5:
      return '#B9F2FF'; // Diamond
    default:
      return '#808080';
  }
}

/**
 * Format LP value for display
 */
export function formatLPValue(value: number): string {
  if (value === 0) return '0';
  if (value < 0.001) return value.toExponential(2);
  if (value < 1) return value.toFixed(4);
  return value.toFixed(2);
}

/**
 * Explain LP enhancement to players
 */
export function getEnhancementExplanation(impactAssets: ImpactAssets): string {
  const multipliers = calculateLPMultipliers(impactAssets);
  const level = calculateEnhancementLevel(impactAssets);
  const tierName = getEnhancementTierName(level);

  if (impactAssets.totalValue === 0) {
    return 'No LP enhancement. Hold LP tokens to boost your cards!';
  }

  const lines = [
    `**${tierName} Enhancement** (Tier ${level})`,
    '',
    `Base Multiplier: ${multipliers.lpMultiplier.toFixed(2)}x (from ${formatLPValue(
      impactAssets.lpBalance
    )} LP)`,
  ];

  if (impactAssets.dddBalance > 0) {
    lines.push(
      `Attack Bonus: +${multipliers.dddAttackBonus} (from ${formatLPValue(
        impactAssets.dddBalance
      )} DDD)`
    );
  }

  if (impactAssets.axlRegenBalance > 0) {
    lines.push(
      `Health Bonus: +${multipliers.axlRegenHealthBonus} (from ${formatLPValue(
        impactAssets.axlRegenBalance
      )} axlREGEN)`
    );
  }

  lines.push('', 'Your commitment to the ecosystem makes your cards stronger! 💎');

  return lines.join('\n');
}
