/**
 * LP Rewards Type Definitions
 *
 * Types for the hybrid LP reward system:
 * 1. Time-Based Loyalty - Passive bonus grows with consecutive days holding LP
 * 2. Per-Game Allocation - Active tactical boost for specific cards
 */

// ============================================================================
// LOYALTY SYSTEM TYPES
// ============================================================================

/**
 * Loyalty tier definition based on consecutive days holding LP
 */
export interface LoyaltyTier {
  name: string;
  level: number;
  minDays: number;
  maxDays: number;
  bonusMultiplier: number; // Additional percentage as decimal (0.05 = +5%)
  icon: string;
  color: string;
  bgGradient: string;
  description: string;
}

/**
 * Loyalty tier definitions
 * Bonus stacks additively with base LP bonus
 */
export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Newcomer',
    level: 0,
    minDays: 0,
    maxDays: 0,
    bonusMultiplier: 0,
    icon: '🌱',
    color: '#6B7280',
    bgGradient: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
    description: 'Just arrived - start your journey!'
  },
  {
    name: 'Apprentice',
    level: 1,
    minDays: 1,
    maxDays: 7,
    bonusMultiplier: 0.05,
    icon: '📜',
    color: '#CD7F32',
    bgGradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
    description: '1-7 days loyalty (+5% stats)'
  },
  {
    name: 'Journeyman',
    level: 2,
    minDays: 8,
    maxDays: 30,
    bonusMultiplier: 0.10,
    icon: '⚔️',
    color: '#C0C0C0',
    bgGradient: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
    description: '8-30 days loyalty (+10% stats)'
  },
  {
    name: 'Veteran',
    level: 3,
    minDays: 31,
    maxDays: 90,
    bonusMultiplier: 0.20,
    icon: '🛡️',
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    description: '31-90 days loyalty (+20% stats)'
  },
  {
    name: 'Legend',
    level: 4,
    minDays: 91,
    maxDays: Infinity,
    bonusMultiplier: 0.30,
    icon: '👑',
    color: '#B9F2FF',
    bgGradient: 'linear-gradient(135deg, #B9F2FF 0%, #00CED1 100%)',
    description: '91+ days loyalty (+30% stats, max tier!)'
  },
];

/**
 * Get loyalty tier for a given number of consecutive days
 */
export function getLoyaltyTierForDays(consecutiveDays: number): LoyaltyTier {
  // Find the highest tier the user qualifies for
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (consecutiveDays >= LOYALTY_TIERS[i].minDays) {
      return LOYALTY_TIERS[i];
    }
  }
  return LOYALTY_TIERS[0]; // Newcomer
}

/**
 * Loyalty data tracked per wallet
 */
export interface WalletLoyaltyData {
  walletAddress: string;

  // Timestamps (Unix ms)
  firstConnectionDate: number;   // When first connected with LP > 0
  lastSnapshotDate: number;      // Most recent LP balance check
  lastSnapshotDayStart: number;  // Start of the day (UTC midnight) of last snapshot

  // LP tracking
  lastKnownLPBalance: number;    // LP balance at last snapshot

  // Streak tracking
  consecutiveDays: number;       // Current streak
  highestStreak: number;         // All-time best streak

  // Computed (derived from consecutiveDays)
  currentTierLevel: number;      // Index into LOYALTY_TIERS
}

// ============================================================================
// ALLOCATION SYSTEM TYPES
// ============================================================================

/**
 * LP allocation for a single card
 */
export interface CardLPAllocation {
  cardId: string;
  cardName: string;              // For display purposes
  allocatedLP: number;           // Amount of LP allocated
  bonusMultiplier: number;       // Computed: allocatedLP * ALLOCATION_BONUS_RATE
}

/**
 * Pre-battle allocation state
 */
export interface BattleAllocationState {
  playerId: string;
  walletAddress: string;
  totalLPAvailable: number;      // Player's total LP balance
  totalLPAllocated: number;      // Sum of all card allocations
  cardAllocations: CardLPAllocation[];
  matchId: string;               // Unique per battle
  finalized: boolean;            // True after player confirms
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const LP_REWARDS_CONFIG = {
  // Allocation system
  ALLOCATION_INCREMENT: 0.01,    // LP per +/- click
  ALLOCATION_BONUS_RATE: 10,     // +10% per 0.01 LP allocated (so 0.01 LP = 0.10 multiplier)
  MAX_ALLOCATION_PER_CARD: 1.0,  // Cap allocation per card (1.0 LP max)

  // Loyalty system
  STREAK_GRACE_PERIOD_HOURS: 24, // Hours before missed day breaks streak

  // Feature flags
  LOYALTY_ENABLED: true,
  ALLOCATION_ENABLED: true,
};

/**
 * Calculate allocation bonus multiplier for a given LP amount
 * Formula: Each 0.01 LP = +10% stats
 */
export function calculateAllocationBonus(allocatedLP: number): number {
  // 0.01 LP * 100 = 1, * 10 = 10% = 0.10 multiplier
  return (allocatedLP / LP_REWARDS_CONFIG.ALLOCATION_INCREMENT) * (LP_REWARDS_CONFIG.ALLOCATION_BONUS_RATE / 100);
}

/**
 * Get days until next loyalty tier
 */
export function getDaysUntilNextTier(consecutiveDays: number): number | null {
  const currentTier = getLoyaltyTierForDays(consecutiveDays);
  const currentIndex = LOYALTY_TIERS.findIndex(t => t.name === currentTier.name);

  if (currentIndex >= LOYALTY_TIERS.length - 1) {
    return null; // Already at max tier
  }

  const nextTier = LOYALTY_TIERS[currentIndex + 1];
  return nextTier.minDays - consecutiveDays;
}

/**
 * Calculate progress percentage to next tier
 */
export function getTierProgress(consecutiveDays: number): number {
  const currentTier = getLoyaltyTierForDays(consecutiveDays);
  const currentIndex = LOYALTY_TIERS.findIndex(t => t.name === currentTier.name);

  if (currentIndex >= LOYALTY_TIERS.length - 1) {
    return 100; // Max tier
  }

  const nextTier = LOYALTY_TIERS[currentIndex + 1];
  const daysInCurrentTier = consecutiveDays - currentTier.minDays;
  const daysNeededForNext = nextTier.minDays - currentTier.minDays;

  return Math.min(100, Math.floor((daysInCurrentTier / daysNeededForNext) * 100));
}
