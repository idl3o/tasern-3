/**
 * PlayerStatus Component
 *
 * Shows castle HP, mana, turn indicator, and AI personality.
 * Medieval D&D aesthetic with parchment and bronze.
 *
 * Philosophy: Pure presentation. No game logic.
 */

import React from 'react';
import type { Player } from '../types/core';
import {
  TASERN_COLORS,
  TASERN_GRADIENTS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
  TASERN_ICONS,
} from '../styles/tasernTheme';

interface PlayerStatusProps {
  player: Player;
  isActive: boolean;
  isWinner?: boolean;
  onCastleClick?: () => void;
  isTargetable?: boolean;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({
  player,
  isActive,
  isWinner = false,
  onCastleClick,
  isTargetable = false,
}) => {
  const castleHpPercentage = (player.castleHp / player.maxCastleHp) * 100;
  const manaPercentage = (player.mana / player.maxMana) * 100;

  const castleBarColor =
    castleHpPercentage > 66
      ? TASERN_COLORS.green
      : castleHpPercentage > 33
      ? TASERN_COLORS.gold
      : TASERN_COLORS.red;

  return (
    <div
      className="player-status-container"
      style={{
        ...styles.container,
        ...(isActive ? styles.containerActive : {}),
        ...(isWinner ? styles.containerWinner : {}),
      }}
    >
      {/* Header */}
      <div className="player-status-header" style={styles.header}>
        <div style={styles.nameSection}>
          <div style={styles.playerName}>{player.name}</div>
          {player.type === 'ai' && player.aiPersonality && (
            <div style={styles.personalityTitle}>
              {player.aiPersonality.title}
            </div>
          )}
        </div>
        {isActive && (
          <div style={styles.activeBadge}>
            {TASERN_ICONS.turn} ACTIVE
          </div>
        )}
        {isWinner && (
          <div style={styles.winnerBadge}>
            {TASERN_ICONS.victory} WINNER
          </div>
        )}
      </div>

      {/* Castle HP */}
      <div
        className={`stat-section ${isTargetable ? 'castle-targetable' : ''}`}
        style={{
          ...styles.statSection,
          ...(isTargetable ? styles.castleTargetable : {}),
        }}
        onClick={onCastleClick}
      >
        <div style={styles.statLabel}>
          {TASERN_ICONS.castle} Castle {isTargetable && '🎯'}
        </div>
        <div style={styles.statBar}>
          <div style={styles.barBg}>
            <div
              style={{
                ...styles.barFill,
                width: `${castleHpPercentage}%`,
                backgroundColor: castleBarColor,
              }}
            />
          </div>
          <div style={styles.statValue}>
            {player.castleHp} / {player.maxCastleHp}
          </div>
        </div>
      </div>

      {/* Mana */}
      <div style={styles.statSection}>
        <div style={styles.statLabel}>
          {TASERN_ICONS.mana} Mana
        </div>
        <div style={styles.statBar}>
          <div style={styles.barBg}>
            <div
              style={{
                ...styles.barFill,
                width: `${manaPercentage}%`,
                backgroundColor: TASERN_COLORS.blue,
              }}
            />
          </div>
          <div style={styles.statValue}>
            {player.mana} / {player.maxMana}
          </div>
        </div>
      </div>

      {/* AI Personality Traits */}
      {player.type === 'ai' && player.aiPersonality && (
        <div style={styles.personalitySection}>
          <div style={styles.personalityGrid}>
            <div style={styles.trait}>
              <span style={styles.traitLabel}>Aggression</span>
              <span style={styles.traitBar}>
                <span
                  style={{
                    ...styles.traitFill,
                    width: `${player.aiPersonality.aggression * 100}%`,
                    backgroundColor: TASERN_COLORS.red,
                  }}
                />
              </span>
            </div>
            <div style={styles.trait}>
              <span style={styles.traitLabel}>Creativity</span>
              <span style={styles.traitBar}>
                <span
                  style={{
                    ...styles.traitFill,
                    width: `${player.aiPersonality.creativity * 100}%`,
                    backgroundColor: TASERN_COLORS.purple,
                  }}
                />
              </span>
            </div>
            <div style={styles.trait}>
              <span style={styles.traitLabel}>Risk</span>
              <span style={styles.traitBar}>
                <span
                  style={{
                    ...styles.traitFill,
                    width: `${player.aiPersonality.riskTolerance * 100}%`,
                    backgroundColor: TASERN_COLORS.gold,
                  }}
                />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* LP Bonus (if present) */}
      {player.lpBonus > 0 && (
        <div style={styles.lpBonus}>
          {TASERN_ICONS.star} LP Bonus: +{(player.lpBonus * 100).toFixed(0)}%
        </div>
      )}

      {/* Deck/Hand Count */}
      <div className="player-status-footer" style={styles.footer}>
        <div style={styles.footerStat}>
          <span>🃏 Hand: {player.hand.length}</span>
        </div>
        <div style={styles.footerStat}>
          <span>📚 Deck: {player.deck.length}</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: TASERN_GRADIENTS.cardBackground,
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.bronze}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    padding: TASERN_SPACING.lg,
    fontFamily: TASERN_TYPOGRAPHY.body,
    color: TASERN_COLORS.parchment,
    minWidth: '300px',
    transition: 'all 0.3s ease',
    boxShadow: TASERN_SHADOWS.medium,
  },
  containerActive: {
    borderColor: TASERN_COLORS.gold,
    boxShadow: `${TASERN_SHADOWS.glowGold}, ${TASERN_SHADOWS.strong}`,
    transform: 'scale(1.02)',
  },
  containerWinner: {
    borderColor: TASERN_COLORS.gold,
    boxShadow: TASERN_SHADOWS.glowGold,
    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(26, 20, 16, 0.9) 100%)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: TASERN_SPACING.md,
    paddingBottom: TASERN_SPACING.sm,
    borderBottom: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  nameSection: {
    flex: 1,
  },
  playerName: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleSmall,
    color: TASERN_COLORS.gold,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: TASERN_SPACING.xs,
  },
  personalityTitle: {
    fontFamily: TASERN_TYPOGRAPHY.accent,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    fontStyle: 'italic',
    opacity: 0.9,
  },
  activeBadge: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    padding: '4px 12px',
    borderRadius: TASERN_BORDERS.radiusSmall,
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.gold}`,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    letterSpacing: '0.05em',
  },
  winnerBadge: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.5)',
    padding: '6px 16px',
    borderRadius: TASERN_BORDERS.radiusSmall,
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.gold}`,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    letterSpacing: '0.05em',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  statSection: {
    marginBottom: TASERN_SPACING.md,
  },
  castleTargetable: {
    cursor: 'pointer',
    padding: TASERN_SPACING.sm,
    marginLeft: `-${TASERN_SPACING.sm}`,
    marginRight: `-${TASERN_SPACING.sm}`,
    borderRadius: TASERN_BORDERS.radiusSmall,
    background: 'rgba(139, 0, 0, 0.2)',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.red}`,
    boxShadow: `0 0 12px ${TASERN_COLORS.red}`,
    transition: 'all 0.3s ease',
  },
  statLabel: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.gold,
    marginBottom: TASERN_SPACING.xs,
    fontWeight: TASERN_TYPOGRAPHY.weightMedium,
  },
  statBar: {
    display: 'flex',
    alignItems: 'center',
    gap: TASERN_SPACING.sm,
  },
  barBg: {
    flex: 1,
    height: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    overflow: 'hidden',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  barFill: {
    height: '100%',
    transition: 'width 0.5s ease, background-color 0.3s ease',
    boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
  },
  statValue: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    minWidth: '80px',
    textAlign: 'right',
  },
  personalitySection: {
    marginBottom: TASERN_SPACING.md,
    padding: TASERN_SPACING.sm,
    background: 'rgba(91, 33, 182, 0.1)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.purple}`,
  },
  personalityGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.xs,
  },
  trait: {
    display: 'flex',
    alignItems: 'center',
    gap: TASERN_SPACING.sm,
  },
  traitLabel: {
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.parchment,
    width: '80px',
    fontWeight: TASERN_TYPOGRAPHY.weightMedium,
  },
  traitBar: {
    flex: 1,
    height: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    overflow: 'hidden',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.stone}`,
    display: 'block',
  },
  traitFill: {
    height: '100%',
    display: 'block',
    transition: 'width 0.5s ease',
  },
  lpBonus: {
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.gold,
    textAlign: 'center',
    padding: TASERN_SPACING.sm,
    background: 'rgba(212, 175, 55, 0.2)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.gold}`,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    marginBottom: TASERN_SPACING.md,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: TASERN_SPACING.sm,
    paddingTop: TASERN_SPACING.sm,
    borderTop: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  footerStat: {
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    fontWeight: TASERN_TYPOGRAPHY.weightMedium,
  },
};
