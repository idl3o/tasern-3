/**
 * LoyaltyStatus Component
 *
 * Displays the player's loyalty tier, streak, and progress.
 * Supports compact mode for inline use in headers/sidebars.
 */

import React from 'react';
import { useLoyaltyStore } from '../state/loyaltyStore';
import {
  LOYALTY_TIERS,
  getLoyaltyTierForDays,
  getDaysUntilNextTier,
  getTierProgress,
} from '../types/lpRewards';

interface LoyaltyStatusProps {
  walletAddress?: string;
  compact?: boolean;
}

export const LoyaltyStatus: React.FC<LoyaltyStatusProps> = ({
  walletAddress,
  compact = false,
}) => {
  const loyaltyData = useLoyaltyStore((state) =>
    walletAddress ? state.loyaltyByWallet[walletAddress.toLowerCase()] : null
  );

  // No loyalty data yet
  if (!loyaltyData) {
    if (compact) {
      return (
        <div style={styles.compactContainer}>
          <span style={styles.compactIcon}>{LOYALTY_TIERS[0].icon}</span>
          <span style={styles.compactText}>No LP streak</span>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.icon}>{LOYALTY_TIERS[0].icon}</span>
          <span style={styles.tierName}>{LOYALTY_TIERS[0].name}</span>
        </div>
        <div style={styles.description}>
          Connect wallet and hold LP to start building your loyalty streak!
        </div>
      </div>
    );
  }

  const currentTier = LOYALTY_TIERS[loyaltyData.currentTierLevel] || LOYALTY_TIERS[0];
  const nextTier = LOYALTY_TIERS[loyaltyData.currentTierLevel + 1];
  const daysUntilNext = getDaysUntilNextTier(loyaltyData.consecutiveDays);
  const progress = getTierProgress(loyaltyData.consecutiveDays);

  // Compact mode - single line display
  if (compact) {
    return (
      <div style={styles.compactContainer}>
        <span style={{ ...styles.compactIcon, color: currentTier.color }}>
          {currentTier.icon}
        </span>
        <span style={styles.compactTier}>{currentTier.name}</span>
        <span style={styles.compactStreak}>
          {loyaltyData.consecutiveDays}d streak
        </span>
        {currentTier.bonusMultiplier > 0 && (
          <span style={styles.compactBonus}>
            +{(currentTier.bonusMultiplier * 100).toFixed(0)}%
          </span>
        )}
      </div>
    );
  }

  // Full display mode
  return (
    <div style={{ ...styles.container, background: currentTier.bgGradient }}>
      {/* Header with tier */}
      <div style={styles.header}>
        <span style={styles.icon}>{currentTier.icon}</span>
        <div style={styles.tierInfo}>
          <span style={{ ...styles.tierName, color: currentTier.color }}>
            {currentTier.name}
          </span>
          <span style={styles.streakText}>
            {loyaltyData.consecutiveDays} day streak
          </span>
        </div>
      </div>

      {/* Bonus display */}
      <div style={styles.bonusSection}>
        <span style={styles.bonusLabel}>Loyalty Bonus:</span>
        <span style={styles.bonusValue}>
          +{(currentTier.bonusMultiplier * 100).toFixed(0)}% stats
        </span>
      </div>

      {/* Progress to next tier */}
      {nextTier && daysUntilNext !== null && (
        <div style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <span style={styles.progressLabel}>
              {nextTier.icon} {nextTier.name} in {daysUntilNext} days
            </span>
            <span style={styles.progressPercent}>{progress}%</span>
          </div>
          <div style={styles.progressBarContainer}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${progress}%`,
                background: nextTier.color,
              }}
            />
          </div>
        </div>
      )}

      {/* Max tier reached */}
      {!nextTier && (
        <div style={styles.maxTierSection}>
          <span style={styles.maxTierText}>Maximum tier reached!</span>
          <span style={styles.highestStreak}>
            Highest streak: {loyaltyData.highestStreak} days
          </span>
        </div>
      )}

      {/* Description */}
      <div style={styles.description}>{currentTier.description}</div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  // Compact mode styles
  compactContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    borderRadius: '4px',
    background: 'rgba(0, 0, 0, 0.3)',
    fontSize: '12px',
  },
  compactIcon: {
    fontSize: '14px',
  },
  compactTier: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  compactText: {
    color: '#9CA3AF',
  },
  compactStreak: {
    color: '#9CA3AF',
    fontSize: '11px',
  },
  compactBonus: {
    color: '#10B981',
    fontWeight: 'bold',
    marginLeft: '4px',
  },

  // Full mode styles
  container: {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  icon: {
    fontSize: '32px',
  },
  tierInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  tierName: {
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: "'Cinzel', serif",
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  streakText: {
    color: '#9CA3AF',
    fontSize: '14px',
  },
  bonusSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  bonusLabel: {
    color: '#9CA3AF',
    fontSize: '13px',
  },
  bonusValue: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  progressSection: {
    marginBottom: '12px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  progressLabel: {
    color: '#D4AF37',
    fontSize: '12px',
  },
  progressPercent: {
    color: '#9CA3AF',
    fontSize: '12px',
  },
  progressBarContainer: {
    height: '6px',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  maxTierSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px',
    background: 'rgba(212, 175, 55, 0.1)',
    borderRadius: '6px',
    marginBottom: '12px',
  },
  maxTierText: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  highestStreak: {
    color: '#9CA3AF',
    fontSize: '12px',
    marginTop: '4px',
  },
  description: {
    color: '#9CA3AF',
    fontSize: '12px',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};

export default LoyaltyStatus;
