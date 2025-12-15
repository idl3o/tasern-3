/**
 * Allocation Store
 *
 * Manages per-game LP allocation for tactical card boosting.
 * Does NOT persist - allocations reset after each battle.
 *
 * Allocation Formula:
 * - Each 0.01 LP allocated = +10% stats for that card
 * - Total allocation cannot exceed wallet's LP balance
 * - Allocations reset after battle ends
 */

import { create } from 'zustand';
import type { BattleAllocationState, CardLPAllocation } from '../types/lpRewards';
import { LP_REWARDS_CONFIG, calculateAllocationBonus } from '../types/lpRewards';

interface AllocationState {
  // Current battle's allocation (null if not in allocation phase)
  currentAllocation: BattleAllocationState | null;

  // Actions
  initializeAllocation: (playerId: string, walletAddress: string, totalLPAvailable: number) => void;
  allocateToCard: (cardId: string, cardName: string, amount: number) => boolean;
  deallocateFromCard: (cardId: string, amount?: number) => void;
  setCardAllocation: (cardId: string, cardName: string, totalAmount: number) => boolean;
  getCardAllocation: (cardId: string) => CardLPAllocation | null;
  getAllocationBonus: (cardId: string) => number;
  getTotalAllocated: () => number;
  getRemainingLP: () => number;
  finalizeAllocation: () => BattleAllocationState | null;
  clearAllocation: () => void;

  // Batch operations
  clearAllCardAllocations: () => void;
  distributeEvenly: (cardIds: string[], cardNames: string[]) => void;
}

/**
 * Generate a unique match ID
 */
function generateMatchId(): string {
  return `match-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useAllocationStore = create<AllocationState>((set, get) => ({
  currentAllocation: null,

  /**
   * Initialize allocation for a new battle
   */
  initializeAllocation: (playerId, walletAddress, totalLPAvailable) => {
    const matchId = generateMatchId();

    console.log(`⚡ Allocation initialized: ${totalLPAvailable.toFixed(4)} LP available for match ${matchId.slice(0, 12)}...`);

    set({
      currentAllocation: {
        playerId,
        walletAddress: walletAddress.toLowerCase(),
        totalLPAvailable,
        totalLPAllocated: 0,
        cardAllocations: [],
        matchId,
        finalized: false,
      },
    });
  },

  /**
   * Add LP allocation to a card
   * Returns false if allocation would exceed available LP
   */
  allocateToCard: (cardId, cardName, amount) => {
    const current = get().currentAllocation;
    if (!current || current.finalized) return false;

    // Validate amount
    if (amount <= 0) return false;

    // Check if this would exceed available LP
    const existingAllocation = current.cardAllocations.find(a => a.cardId === cardId);
    const existingAmount = existingAllocation?.allocatedLP || 0;
    const newTotalForCard = existingAmount + amount;

    // Check per-card max
    if (newTotalForCard > LP_REWARDS_CONFIG.MAX_ALLOCATION_PER_CARD) {
      console.warn(`⚠️ Allocation would exceed per-card max (${LP_REWARDS_CONFIG.MAX_ALLOCATION_PER_CARD} LP)`);
      return false;
    }

    // Check total LP available
    const newTotalAllocated = current.totalLPAllocated - existingAmount + newTotalForCard;
    if (newTotalAllocated > current.totalLPAvailable) {
      console.warn(`⚠️ Allocation would exceed available LP (${current.totalLPAvailable.toFixed(4)} LP)`);
      return false;
    }

    // Calculate bonus
    const bonusMultiplier = calculateAllocationBonus(newTotalForCard);

    // Update or add allocation
    const updatedAllocations = current.cardAllocations.filter(a => a.cardId !== cardId);
    updatedAllocations.push({
      cardId,
      cardName,
      allocatedLP: newTotalForCard,
      bonusMultiplier,
    });

    set({
      currentAllocation: {
        ...current,
        cardAllocations: updatedAllocations,
        totalLPAllocated: newTotalAllocated,
      },
    });

    console.log(`⚡ Allocated ${amount.toFixed(4)} LP to ${cardName} (total: ${newTotalForCard.toFixed(4)} LP, +${(bonusMultiplier * 100).toFixed(0)}%)`);
    return true;
  },

  /**
   * Remove LP allocation from a card
   */
  deallocateFromCard: (cardId, amount) => {
    const current = get().currentAllocation;
    if (!current || current.finalized) return;

    const existingAllocation = current.cardAllocations.find(a => a.cardId === cardId);
    if (!existingAllocation) return;

    // If no amount specified, remove all
    const removeAmount = amount ?? existingAllocation.allocatedLP;
    const newAmount = Math.max(0, existingAllocation.allocatedLP - removeAmount);

    if (newAmount === 0) {
      // Remove allocation entirely
      set({
        currentAllocation: {
          ...current,
          cardAllocations: current.cardAllocations.filter(a => a.cardId !== cardId),
          totalLPAllocated: current.totalLPAllocated - existingAllocation.allocatedLP,
        },
      });
    } else {
      // Reduce allocation
      const bonusMultiplier = calculateAllocationBonus(newAmount);
      set({
        currentAllocation: {
          ...current,
          cardAllocations: current.cardAllocations.map(a =>
            a.cardId === cardId
              ? { ...a, allocatedLP: newAmount, bonusMultiplier }
              : a
          ),
          totalLPAllocated: current.totalLPAllocated - removeAmount,
        },
      });
    }
  },

  /**
   * Set exact allocation amount for a card
   */
  setCardAllocation: (cardId, cardName, totalAmount) => {
    const current = get().currentAllocation;
    if (!current || current.finalized) return false;

    // Remove existing allocation first
    get().deallocateFromCard(cardId);

    // If new amount is 0, we're done
    if (totalAmount <= 0) return true;

    // Add new allocation
    return get().allocateToCard(cardId, cardName, totalAmount);
  },

  /**
   * Get allocation for a specific card
   */
  getCardAllocation: (cardId) => {
    const current = get().currentAllocation;
    if (!current) return null;
    return current.cardAllocations.find(a => a.cardId === cardId) || null;
  },

  /**
   * Get the bonus multiplier for a card
   */
  getAllocationBonus: (cardId) => {
    const allocation = get().getCardAllocation(cardId);
    return allocation?.bonusMultiplier || 0;
  },

  /**
   * Get total LP currently allocated
   */
  getTotalAllocated: () => {
    return get().currentAllocation?.totalLPAllocated || 0;
  },

  /**
   * Get remaining LP available for allocation
   */
  getRemainingLP: () => {
    const current = get().currentAllocation;
    if (!current) return 0;
    return current.totalLPAvailable - current.totalLPAllocated;
  },

  /**
   * Finalize allocation before battle starts
   */
  finalizeAllocation: () => {
    const current = get().currentAllocation;
    if (!current) return null;

    set({
      currentAllocation: {
        ...current,
        finalized: true,
      },
    });

    console.log(`✅ Allocation finalized: ${current.totalLPAllocated.toFixed(4)} LP across ${current.cardAllocations.length} card(s)`);
    return get().currentAllocation;
  },

  /**
   * Clear all allocations (called after battle ends)
   */
  clearAllocation: () => {
    console.log('🔄 Allocation cleared');
    set({ currentAllocation: null });
  },

  /**
   * Clear allocations from all cards but keep state
   */
  clearAllCardAllocations: () => {
    const current = get().currentAllocation;
    if (!current || current.finalized) return;

    set({
      currentAllocation: {
        ...current,
        cardAllocations: [],
        totalLPAllocated: 0,
      },
    });
  },

  /**
   * Distribute available LP evenly across specified cards
   */
  distributeEvenly: (cardIds, cardNames) => {
    const current = get().currentAllocation;
    if (!current || current.finalized || cardIds.length === 0) return;

    // Clear existing allocations first
    get().clearAllCardAllocations();

    // Calculate even distribution (rounded to ALLOCATION_INCREMENT)
    const increment = LP_REWARDS_CONFIG.ALLOCATION_INCREMENT;
    const lpPerCard = Math.floor((current.totalLPAvailable / cardIds.length) / increment) * increment;

    if (lpPerCard <= 0) return;

    // Allocate to each card
    cardIds.forEach((cardId, index) => {
      const cardName = cardNames[index] || `Card ${index + 1}`;
      get().allocateToCard(cardId, cardName, lpPerCard);
    });

    console.log(`📊 Distributed ${lpPerCard.toFixed(4)} LP each to ${cardIds.length} cards`);
  },
}));

// Export selectors
export const selectCurrentAllocation = (state: AllocationState) => state.currentAllocation;
export const selectTotalAllocated = (state: AllocationState) => state.currentAllocation?.totalLPAllocated || 0;
export const selectRemainingLP = (state: AllocationState) =>
  state.currentAllocation
    ? state.currentAllocation.totalLPAvailable - state.currentAllocation.totalLPAllocated
    : 0;
