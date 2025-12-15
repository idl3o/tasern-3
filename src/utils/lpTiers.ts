/**
 * LP Tier System
 *
 * Defines tier badges based on LP holdings for visual feedback
 * Tiers correspond to enhancement levels from universalImpactScanner
 */

export interface LPTier {
  name: string;
  level: number;
  minLp: number;
  color: string;
  bgGradient: string;
  borderColor: string;
  icon: string;
  description: string;
}

/**
 * LP Tier definitions
 * Level 0 = No LP, Level 1-5 = Bronze through Diamond
 */
export const LP_TIERS: Record<number, LPTier> = {
  0: {
    name: 'Unenhanced',
    level: 0,
    minLp: 0,
    color: '#6B7280',
    bgGradient: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
    borderColor: '#4B5563',
    icon: '○',
    description: 'No LP holdings detected'
  },
  1: {
    name: 'Bronze',
    level: 1,
    minLp: 0.001,
    color: '#CD7F32',
    bgGradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
    borderColor: '#CD7F32',
    icon: '🥉',
    description: 'Entry tier - any LP holdings'
  },
  2: {
    name: 'Silver',
    level: 2,
    minLp: 0.01,
    color: '#C0C0C0',
    bgGradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
    borderColor: '#C0C0C0',
    icon: '🥈',
    description: '0.01+ LP - +50% stats'
  },
  3: {
    name: 'Gold',
    level: 3,
    minLp: 0.1,
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    borderColor: '#FFD700',
    icon: '🥇',
    description: '0.1+ LP - +500% stats'
  },
  4: {
    name: 'Platinum',
    level: 4,
    minLp: 0.5,
    color: '#E5E4E2',
    bgGradient: 'linear-gradient(135deg, #E5E4E2 0%, #BCC6CC 100%)',
    borderColor: '#E5E4E2',
    icon: '💎',
    description: '0.5+ LP - +2500% stats'
  },
  5: {
    name: 'Diamond',
    level: 5,
    minLp: 1.0,
    color: '#B9F2FF',
    bgGradient: 'linear-gradient(135deg, #B9F2FF 0%, #00CED1 100%)',
    borderColor: '#B9F2FF',
    icon: '👑',
    description: '1.0+ LP - +5000% stats (max tier)'
  }
};

/**
 * Get tier information for an enhancement level
 */
export function getTierForLevel(enhancementLevel: number): LPTier {
  const level = Math.min(Math.max(0, enhancementLevel), 5);
  return LP_TIERS[level];
}

/**
 * Get tier information for an LP balance
 */
export function getTierForLpBalance(lpBalance: number): LPTier {
  if (lpBalance >= 1.0) return LP_TIERS[5];
  if (lpBalance >= 0.5) return LP_TIERS[4];
  if (lpBalance >= 0.1) return LP_TIERS[3];
  if (lpBalance >= 0.01) return LP_TIERS[2];
  if (lpBalance > 0) return LP_TIERS[1];
  return LP_TIERS[0];
}

/**
 * Format LP balance with tier badge text
 */
export function formatLpWithTier(lpBalance: number, enhancementLevel: number): string {
  const tier = getTierForLevel(enhancementLevel);
  if (enhancementLevel === 0) return 'No LP';
  return `${tier.icon} ${tier.name} (${lpBalance.toFixed(4)} LP)`;
}

/**
 * Get star display for enhancement level (legacy support)
 */
export function getStarsForLevel(enhancementLevel: number): string {
  if (enhancementLevel <= 0) return '';
  return '⭐'.repeat(Math.min(enhancementLevel, 5));
}

export default {
  LP_TIERS,
  getTierForLevel,
  getTierForLpBalance,
  formatLpWithTier,
  getStarsForLevel
};
