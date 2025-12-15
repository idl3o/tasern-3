/**
 * LP Allocation Screen
 *
 * Full-screen UI for allocating LP to cards before battle.
 * Shown after deck selection, before battle starts.
 *
 * Features:
 * - Card grid with +/- allocation buttons
 * - Real-time bonus calculation display
 * - Progress bar for total allocated
 * - Quick actions: Clear All, Distribute Evenly
 * - Skip / Confirm buttons
 */

import React, { useEffect } from 'react';
import type { Card } from '../types/core';
import { useAllocationStore } from '../state/allocationStore';
import { useLoyaltyStore } from '../state/loyaltyStore';
import { LP_REWARDS_CONFIG, calculateAllocationBonus, LOYALTY_TIERS } from '../types/lpRewards';

interface LPAllocationScreenProps {
  playerId: string;
  walletAddress: string;
  totalLPAvailable: number;
  handCards: Card[];
  onConfirm: (allocations: Map<string, number>) => void;
  onSkip: () => void;
}

export const LPAllocationScreen: React.FC<LPAllocationScreenProps> = ({
  playerId,
  walletAddress,
  totalLPAvailable,
  handCards,
  onConfirm,
  onSkip,
}) => {
  const {
    currentAllocation,
    initializeAllocation,
    allocateToCard,
    deallocateFromCard,
    getCardAllocation,
    getTotalAllocated,
    getRemainingLP,
    clearAllCardAllocations,
    distributeEvenly,
    finalizeAllocation,
  } = useAllocationStore();

  const loyaltyData = useLoyaltyStore((state) =>
    state.loyaltyByWallet[walletAddress.toLowerCase()]
  );

  const currentTier = loyaltyData
    ? LOYALTY_TIERS[loyaltyData.currentTierLevel]
    : LOYALTY_TIERS[0];

  // Initialize allocation on mount
  useEffect(() => {
    initializeAllocation(playerId, walletAddress, totalLPAvailable);
  }, [playerId, walletAddress, totalLPAvailable, initializeAllocation]);

  const handleIncrement = (card: Card) => {
    allocateToCard(card.id, card.name, LP_REWARDS_CONFIG.ALLOCATION_INCREMENT);
  };

  const handleDecrement = (card: Card) => {
    deallocateFromCard(card.id, LP_REWARDS_CONFIG.ALLOCATION_INCREMENT);
  };

  const handleDistributeEvenly = () => {
    distributeEvenly(
      handCards.map((c) => c.id),
      handCards.map((c) => c.name)
    );
  };

  const handleConfirm = () => {
    finalizeAllocation();
    const allocations = new Map<string, number>();
    currentAllocation?.cardAllocations.forEach((alloc) => {
      allocations.set(alloc.cardId, alloc.bonusMultiplier);
    });
    onConfirm(allocations);
  };

  const totalAllocated = getTotalAllocated();
  const remainingLP = getRemainingLP();
  const allocationPercent = totalLPAvailable > 0
    ? Math.round((totalAllocated / totalLPAvailable) * 100)
    : 0;

  // Skip if no LP available
  if (totalLPAvailable <= 0) {
    return (
      <div style={styles.container}>
        <div style={styles.noLPMessage}>
          <span style={styles.noLPIcon}>!</span>
          <h2 style={styles.noLPTitle}>No LP Available</h2>
          <p style={styles.noLPText}>
            You need LP tokens to allocate tactical bonuses to your cards.
          </p>
          <button style={styles.skipButton} onClick={onSkip}>
            Continue to Battle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Tactical LP Allocation</h1>
        <p style={styles.subtitle}>
          Boost your cards for this battle! Each 0.01 LP = +10% stats
        </p>
      </div>

      {/* Loyalty Status */}
      <div style={styles.loyaltySection}>
        <span style={styles.loyaltyIcon}>{currentTier.icon}</span>
        <span style={styles.loyaltyTier}>{currentTier.name}</span>
        {loyaltyData && (
          <span style={styles.loyaltyStreak}>
            {loyaltyData.consecutiveDays}d streak
          </span>
        )}
        {currentTier.bonusMultiplier > 0 && (
          <span style={styles.loyaltyBonus}>
            +{(currentTier.bonusMultiplier * 100).toFixed(0)}% base
          </span>
        )}
      </div>

      {/* LP Progress Bar */}
      <div style={styles.progressSection}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>LP Allocated</span>
          <span style={styles.progressValues}>
            {totalAllocated.toFixed(2)} / {totalLPAvailable.toFixed(2)} LP
          </span>
        </div>
        <div style={styles.progressBarContainer}>
          <div
            style={{
              ...styles.progressBarFill,
              width: `${allocationPercent}%`,
            }}
          />
        </div>
        <div style={styles.remainingLabel}>
          {remainingLP.toFixed(2)} LP remaining
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <button
          style={styles.quickActionButton}
          onClick={handleDistributeEvenly}
        >
          Distribute Evenly
        </button>
        <button
          style={styles.quickActionButton}
          onClick={clearAllCardAllocations}
        >
          Clear All
        </button>
      </div>

      {/* Card Grid */}
      <div style={styles.cardGrid}>
        {handCards.map((card) => {
          const allocation = getCardAllocation(card.id);
          const allocatedLP = allocation?.allocatedLP || 0;
          const bonusPercent = allocation
            ? Math.round(allocation.bonusMultiplier * 100)
            : 0;

          return (
            <div key={card.id} style={styles.cardItem}>
              {/* Card Preview */}
              <div style={styles.cardPreview}>
                <div style={styles.cardName}>{card.name}</div>
                <div style={styles.cardStats}>
                  <span>ATK {card.attack}</span>
                  <span>DEF {card.defense}</span>
                  <span>HP {card.hp}</span>
                </div>
                <div style={styles.cardMana}>{card.manaCost} mana</div>
              </div>

              {/* Allocation Controls */}
              <div style={styles.allocationControls}>
                <button
                  style={styles.allocButton}
                  onClick={() => handleDecrement(card)}
                  disabled={allocatedLP <= 0}
                >
                  -
                </button>
                <div style={styles.allocValue}>
                  <span style={styles.allocLP}>{allocatedLP.toFixed(2)}</span>
                  <span style={styles.allocLabel}>LP</span>
                </div>
                <button
                  style={styles.allocButton}
                  onClick={() => handleIncrement(card)}
                  disabled={
                    remainingLP < LP_REWARDS_CONFIG.ALLOCATION_INCREMENT ||
                    allocatedLP >= LP_REWARDS_CONFIG.MAX_ALLOCATION_PER_CARD
                  }
                >
                  +
                </button>
              </div>

              {/* Bonus Display */}
              {bonusPercent > 0 && (
                <div style={styles.bonusBadge}>+{bonusPercent}% stats</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={styles.actionButtons}>
        <button style={styles.skipButton} onClick={onSkip}>
          Skip Allocation
        </button>
        <button style={styles.confirmButton} onClick={handleConfirm}>
          Confirm & Battle!
        </button>
      </div>

      {/* Help Text */}
      <div style={styles.helpText}>
        Allocations reset after each battle. Your LP is never spent - only committed for tactical bonuses.
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  title: {
    fontFamily: "'Cinzel', serif",
    fontSize: '28px',
    color: '#D4AF37',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    margin: 0,
    textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: '14px',
    marginTop: '8px',
  },
  loyaltySection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  loyaltyIcon: {
    fontSize: '20px',
  },
  loyaltyTier: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontFamily: "'Cinzel', serif",
  },
  loyaltyStreak: {
    color: '#9CA3AF',
    fontSize: '13px',
  },
  loyaltyBonus: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: '13px',
    marginLeft: '8px',
  },
  progressSection: {
    width: '100%',
    maxWidth: '500px',
    marginBottom: '16px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  progressLabel: {
    color: '#9CA3AF',
    fontSize: '13px',
  },
  progressValues: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  progressBarContainer: {
    height: '12px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '6px',
    overflow: 'hidden',
    border: '1px solid rgba(212, 175, 55, 0.3)',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #D4AF37 0%, #FFD700 100%)',
    borderRadius: '6px',
    transition: 'width 0.2s ease',
  },
  remainingLabel: {
    color: '#6B7280',
    fontSize: '12px',
    textAlign: 'right',
    marginTop: '4px',
  },
  quickActions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  quickActionButton: {
    padding: '8px 16px',
    background: 'rgba(212, 175, 55, 0.2)',
    border: '1px solid rgba(212, 175, 55, 0.4)',
    borderRadius: '6px',
    color: '#D4AF37',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s ease',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    width: '100%',
    maxWidth: '800px',
    marginBottom: '24px',
  },
  cardItem: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  cardPreview: {
    textAlign: 'center',
    marginBottom: '12px',
  },
  cardName: {
    color: '#F4E4C1',
    fontFamily: "'Cinzel', serif",
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '6px',
  },
  cardStats: {
    display: 'flex',
    gap: '8px',
    fontSize: '11px',
    color: '#9CA3AF',
  },
  cardMana: {
    color: '#60A5FA',
    fontSize: '11px',
    marginTop: '4px',
  },
  allocationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  allocButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #D4AF37',
    background: 'rgba(212, 175, 55, 0.2)',
    color: '#D4AF37',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  allocValue: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '60px',
  },
  allocLP: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  allocLabel: {
    color: '#6B7280',
    fontSize: '10px',
    textTransform: 'uppercase',
  },
  bonusBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  actionButtons: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  skipButton: {
    padding: '12px 24px',
    background: 'rgba(107, 114, 128, 0.3)',
    border: '1px solid rgba(107, 114, 128, 0.5)',
    borderRadius: '8px',
    color: '#9CA3AF',
    fontSize: '14px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  confirmButton: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#1a1a1a',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)',
  },
  helpText: {
    color: '#6B7280',
    fontSize: '12px',
    textAlign: 'center',
    maxWidth: '400px',
  },
  noLPMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
  },
  noLPIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#6B7280',
  },
  noLPTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: '24px',
    color: '#D4AF37',
    margin: '0 0 12px 0',
  },
  noLPText: {
    color: '#9CA3AF',
    fontSize: '14px',
    marginBottom: '24px',
    maxWidth: '300px',
  },
};

export default LPAllocationScreen;
