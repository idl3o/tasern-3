/**
 * Loyalty Store
 *
 * Tracks LP holding streaks and calculates loyalty bonuses.
 * Persists to localStorage so streaks survive browser refreshes.
 *
 * Streak Logic:
 * - Streak increments if LP balance >= previous day's balance
 * - Streak resets if LP balance drops below previous snapshot
 * - Grace period of 24 hours before missed day breaks streak
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WalletLoyaltyData, LoyaltyTier } from '../types/lpRewards';
import { LOYALTY_TIERS, getLoyaltyTierForDays, LP_REWARDS_CONFIG } from '../types/lpRewards';

interface LoyaltyState {
  // Map of wallet address (lowercase) -> loyalty data
  loyaltyByWallet: Record<string, WalletLoyaltyData>;

  // Actions
  initializeLoyalty: (walletAddress: string, currentLPBalance: number) => void;
  updateLoyaltySnapshot: (walletAddress: string, currentLPBalance: number) => void;
  getLoyaltyData: (walletAddress: string) => WalletLoyaltyData | null;
  getLoyaltyMultiplier: (walletAddress: string) => number;
  getCurrentTier: (walletAddress: string) => LoyaltyTier;
  resetLoyalty: (walletAddress: string) => void;
  clearAllLoyalty: () => void;
}

/**
 * Get the start of the current day in UTC (midnight)
 */
function getDayStartUTC(timestamp: number = Date.now()): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Calculate days between two timestamps
 */
function daysBetween(timestamp1: number, timestamp2: number): number {
  const day1 = getDayStartUTC(timestamp1);
  const day2 = getDayStartUTC(timestamp2);
  return Math.floor((day2 - day1) / (24 * 60 * 60 * 1000));
}

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      loyaltyByWallet: {},

      /**
       * Initialize loyalty tracking for a new wallet
       * Called when wallet first connects with LP > 0
       */
      initializeLoyalty: (walletAddress, currentLPBalance) => {
        const address = walletAddress.toLowerCase();
        const existing = get().loyaltyByWallet[address];

        // If already tracked, update instead
        if (existing) {
          get().updateLoyaltySnapshot(walletAddress, currentLPBalance);
          return;
        }

        const now = Date.now();
        const dayStart = getDayStartUTC(now);

        const newData: WalletLoyaltyData = {
          walletAddress: address,
          firstConnectionDate: now,
          lastSnapshotDate: now,
          lastSnapshotDayStart: dayStart,
          lastKnownLPBalance: currentLPBalance,
          consecutiveDays: currentLPBalance > 0 ? 1 : 0,
          highestStreak: currentLPBalance > 0 ? 1 : 0,
          currentTierLevel: 0,
        };

        // Set tier based on initial days
        const tier = getLoyaltyTierForDays(newData.consecutiveDays);
        newData.currentTierLevel = LOYALTY_TIERS.findIndex(t => t.name === tier.name);

        console.log(`🌱 Loyalty initialized for ${address.slice(0, 6)}... with ${currentLPBalance.toFixed(4)} LP`);

        set((state) => ({
          loyaltyByWallet: {
            ...state.loyaltyByWallet,
            [address]: newData,
          },
        }));
      },

      /**
       * Update loyalty snapshot with current LP balance
       * Called on each NFT scan / LP refresh
       */
      updateLoyaltySnapshot: (walletAddress, currentLPBalance) => {
        const address = walletAddress.toLowerCase();
        const existing = get().loyaltyByWallet[address];

        // If not tracked yet, initialize
        if (!existing) {
          get().initializeLoyalty(walletAddress, currentLPBalance);
          return;
        }

        const now = Date.now();
        const currentDayStart = getDayStartUTC(now);
        const lastDayStart = existing.lastSnapshotDayStart;

        // Same day - just update balance
        if (currentDayStart === lastDayStart) {
          set((state) => ({
            loyaltyByWallet: {
              ...state.loyaltyByWallet,
              [address]: {
                ...existing,
                lastSnapshotDate: now,
                lastKnownLPBalance: currentLPBalance,
              },
            },
          }));
          return;
        }

        // New day - check streak logic
        const daysSinceLastSnapshot = daysBetween(lastDayStart, currentDayStart);
        let newConsecutiveDays = existing.consecutiveDays;

        // Check if LP was maintained or increased
        if (currentLPBalance >= existing.lastKnownLPBalance && currentLPBalance > 0) {
          // LP maintained or increased - continue streak
          if (daysSinceLastSnapshot === 1) {
            // Exactly one day passed - increment streak
            newConsecutiveDays += 1;
            console.log(`⭐ Loyalty streak increased to ${newConsecutiveDays} days for ${address.slice(0, 6)}...`);
          } else if (daysSinceLastSnapshot <= Math.ceil(LP_REWARDS_CONFIG.STREAK_GRACE_PERIOD_HOURS / 24)) {
            // Within grace period - increment by days passed (catch up)
            newConsecutiveDays += daysSinceLastSnapshot;
            console.log(`⭐ Loyalty streak caught up to ${newConsecutiveDays} days for ${address.slice(0, 6)}... (grace period)`);
          } else {
            // Too many days missed - reset streak but keep at 1 if holding LP
            newConsecutiveDays = 1;
            console.log(`💔 Loyalty streak reset for ${address.slice(0, 6)}... (${daysSinceLastSnapshot} days missed)`);
          }
        } else if (currentLPBalance < existing.lastKnownLPBalance) {
          // LP decreased - reset streak
          newConsecutiveDays = currentLPBalance > 0 ? 1 : 0;
          console.log(`💔 Loyalty streak reset for ${address.slice(0, 6)}... (LP decreased from ${existing.lastKnownLPBalance.toFixed(4)} to ${currentLPBalance.toFixed(4)})`);
        } else if (currentLPBalance === 0) {
          // No LP - reset streak
          newConsecutiveDays = 0;
          console.log(`💔 Loyalty streak reset for ${address.slice(0, 6)}... (no LP)`);
        }

        // Update highest streak
        const newHighestStreak = Math.max(existing.highestStreak, newConsecutiveDays);

        // Calculate new tier
        const tier = getLoyaltyTierForDays(newConsecutiveDays);
        const newTierLevel = LOYALTY_TIERS.findIndex(t => t.name === tier.name);

        // Check for tier changes
        if (newTierLevel !== existing.currentTierLevel) {
          if (newTierLevel > existing.currentTierLevel) {
            console.log(`🎉 Loyalty tier UP: ${tier.icon} ${tier.name} for ${address.slice(0, 6)}...!`);
          } else {
            console.log(`📉 Loyalty tier down to ${tier.icon} ${tier.name} for ${address.slice(0, 6)}...`);
          }
        }

        set((state) => ({
          loyaltyByWallet: {
            ...state.loyaltyByWallet,
            [address]: {
              ...existing,
              lastSnapshotDate: now,
              lastSnapshotDayStart: currentDayStart,
              lastKnownLPBalance: currentLPBalance,
              consecutiveDays: newConsecutiveDays,
              highestStreak: newHighestStreak,
              currentTierLevel: newTierLevel,
            },
          },
        }));
      },

      /**
       * Get loyalty data for a wallet
       */
      getLoyaltyData: (walletAddress) => {
        if (!walletAddress) return null;
        return get().loyaltyByWallet[walletAddress.toLowerCase()] || null;
      },

      /**
       * Get the loyalty bonus multiplier for a wallet
       * Returns 0 if no loyalty data or newcomer tier
       */
      getLoyaltyMultiplier: (walletAddress) => {
        if (!walletAddress) return 0;
        const data = get().loyaltyByWallet[walletAddress.toLowerCase()];
        if (!data) return 0;

        const tier = LOYALTY_TIERS[data.currentTierLevel] || LOYALTY_TIERS[0];
        return tier.bonusMultiplier;
      },

      /**
       * Get the current loyalty tier for a wallet
       */
      getCurrentTier: (walletAddress) => {
        if (!walletAddress) return LOYALTY_TIERS[0];
        const data = get().loyaltyByWallet[walletAddress.toLowerCase()];
        if (!data) return LOYALTY_TIERS[0];

        return LOYALTY_TIERS[data.currentTierLevel] || LOYALTY_TIERS[0];
      },

      /**
       * Reset loyalty for a specific wallet
       */
      resetLoyalty: (walletAddress) => {
        const address = walletAddress.toLowerCase();
        set((state) => {
          const updated = { ...state.loyaltyByWallet };
          delete updated[address];
          return { loyaltyByWallet: updated };
        });
      },

      /**
       * Clear all loyalty data
       */
      clearAllLoyalty: () => {
        set({ loyaltyByWallet: {} });
      },
    }),
    {
      name: 'tasern-loyalty-storage',
      version: 1,
    }
  )
);

// Export selectors for component use
export const selectLoyaltyData = (walletAddress: string | undefined) => (state: LoyaltyState) =>
  walletAddress ? state.loyaltyByWallet[walletAddress.toLowerCase()] : null;

export const selectLoyaltyMultiplier = (walletAddress: string | undefined) => (state: LoyaltyState) =>
  walletAddress ? state.getLoyaltyMultiplier(walletAddress) : 0;
