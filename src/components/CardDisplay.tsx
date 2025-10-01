/**
 * CardDisplay Component
 *
 * Individual card with medieval D&D Tasern aesthetic.
 * Shows attack, defense, HP, abilities, and status effects.
 *
 * Philosophy: Pure presentation. No game logic.
 */

import React from 'react';
import type { BattleCard, Card } from '../types/core';
import {
  TASERN_COLORS,
  TASERN_GRADIENTS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
  TASERN_ICONS,
  getRarityColor,
  getRarityGlow,
} from '../styles/tasernTheme';

interface CardDisplayProps {
  card: BattleCard | Card;
  isOnBattlefield?: boolean;
  isActive?: boolean;
  isTargetable?: boolean;
  onClick?: () => void;
  ownerName?: string;
}

export const CardDisplay: React.FC<CardDisplayProps> = ({
  card,
  isOnBattlefield = false,
  isActive = false,
  isTargetable = false,
  onClick,
  ownerName,
}) => {
  const battleCard = isOnBattlefield ? (card as BattleCard) : null;
  const rarityColor = getRarityColor(card.rarity);
  const rarityGlow = getRarityGlow(card.rarity);

  const cardStyle: React.CSSProperties = {
    ...styles.card,
    borderColor: rarityColor,
    boxShadow: isActive
      ? `${rarityGlow}, ${TASERN_SHADOWS.strong}`
      : `${rarityGlow}, ${TASERN_SHADOWS.medium}`,
    transform: isActive ? 'translateY(-4px) scale(1.02)' : 'none',
    cursor: onClick ? 'pointer' : 'default',
    opacity: isTargetable ? 1 : battleCard?.hasAttacked ? 0.7 : 1,
  };

  const hpPercentage = (card.hp / card.maxHp) * 100;
  const hpBarColor =
    hpPercentage > 66
      ? TASERN_COLORS.green
      : hpPercentage > 33
      ? TASERN_COLORS.gold
      : TASERN_COLORS.red;

  return (
    <div style={cardStyle} onClick={onClick}>
      {/* Card Header */}
      <div style={styles.header}>
        <div style={styles.name}>{card.name}</div>
        <div style={styles.manaCost}>
          {TASERN_ICONS.mana} {card.manaCost}
        </div>
      </div>

      {/* Card Art Placeholder */}
      <div style={styles.artContainer}>
        <div style={styles.artPlaceholder}>
          <span style={styles.artIcon}>
            {card.rarity === 'legendary' && '⭐'}
            {card.rarity === 'epic' && '💜'}
            {card.rarity === 'rare' && '💎'}
            {card.rarity === 'uncommon' && '🗡️'}
            {card.rarity === 'common' && '⚔️'}
          </span>
        </div>
        {/* Combat Type Badge */}
        <div style={styles.combatTypeBadge}>
          {card.combatType === 'melee' && '🗡️'}
          {card.combatType === 'ranged' && '🏹'}
          {card.combatType === 'hybrid' && '⚔️'}
        </div>
        {battleCard && battleCard.statusEffects.length > 0 && (
          <div style={styles.statusBadges}>
            {battleCard.statusEffects.map((effect, idx) => (
              <span key={idx} style={styles.statusBadge}>
                {effect.type === 'buff' && '↑'}
                {effect.type === 'debuff' && '↓'}
                {effect.type === 'stun' && '⚡'}
                {effect.type === 'poison' && '☠️'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statIcon}>{TASERN_ICONS.attack}</span>
          <span style={styles.statValue}>{card.attack}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statIcon}>{TASERN_ICONS.defense}</span>
          <span style={styles.statValue}>{card.defense}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statIcon}>{TASERN_ICONS.speed}</span>
          <span style={styles.statValue}>{card.speed}</span>
        </div>
      </div>

      {/* HP Bar */}
      <div style={styles.hpContainer}>
        <div style={styles.hpLabel}>
          {TASERN_ICONS.hp} {card.hp} / {card.maxHp}
        </div>
        <div style={styles.hpBarBg}>
          <div
            style={{
              ...styles.hpBarFill,
              width: `${hpPercentage}%`,
              backgroundColor: hpBarColor,
            }}
          />
        </div>
      </div>

      {/* Abilities */}
      {card.abilities.length > 0 && (
        <div style={styles.abilities}>
          {card.abilities.slice(0, 2).map((ability, idx) => (
            <div key={idx} style={styles.ability}>
              <span style={styles.abilityName}>{ability.name}</span>
              {ability.currentCooldown > 0 && (
                <span style={styles.cooldown}>({ability.currentCooldown})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Battle Status Indicators */}
      {battleCard && (
        <div style={styles.battleStatus}>
          {battleCard.hasMoved && <span style={styles.indicator}>🏃 Moved</span>}
          {battleCard.hasAttacked && <span style={styles.indicator}>⚔️ Attacked</span>}
        </div>
      )}

      {/* Owner Badge */}
      {ownerName && (
        <div style={styles.ownerBadge}>{ownerName}</div>
      )}

      {/* Rarity Badge */}
      <div
        style={{
          ...styles.rarityBadge,
          backgroundColor: rarityColor,
        }}
      >
        {card.rarity.toUpperCase()}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: TASERN_GRADIENTS.cardBackground,
    border: `${TASERN_BORDERS.widthThick} solid`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    padding: TASERN_SPACING.md,
    width: '200px',
    fontFamily: TASERN_TYPOGRAPHY.body,
    color: TASERN_COLORS.parchment,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TASERN_SPACING.sm,
  },
  name: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    color: TASERN_COLORS.gold,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  manaCost: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.blue,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    marginLeft: TASERN_SPACING.sm,
  },
  artContainer: {
    position: 'relative',
    width: '100%',
    height: '120px',
    marginBottom: TASERN_SPACING.sm,
  },
  artPlaceholder: {
    width: '100%',
    height: '100%',
    background: TASERN_GRADIENTS.metalTexture,
    borderRadius: TASERN_BORDERS.radiusSmall,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  artIcon: {
    fontSize: '3rem',
  },
  statusBadges: {
    position: 'absolute',
    top: TASERN_SPACING.xs,
    right: TASERN_SPACING.xs,
    display: 'flex',
    gap: TASERN_SPACING.xs,
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    padding: '2px 6px',
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
  },
  combatTypeBadge: {
    position: 'absolute',
    bottom: TASERN_SPACING.xs,
    left: TASERN_SPACING.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    padding: '2px 6px',
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: TASERN_SPACING.sm,
    padding: TASERN_SPACING.xs,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: TASERN_BORDERS.radiusSmall,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statIcon: {
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
  },
  statValue: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    color: TASERN_COLORS.parchment,
  },
  hpContainer: {
    marginBottom: TASERN_SPACING.sm,
  },
  hpLabel: {
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.parchment,
    marginBottom: '2px',
    textAlign: 'center',
  },
  hpBarBg: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    overflow: 'hidden',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  hpBarFill: {
    height: '100%',
    transition: 'width 0.5s ease, background-color 0.3s ease',
    boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
  },
  abilities: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.xs,
    marginBottom: TASERN_SPACING.sm,
  },
  ability: {
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.purple,
    padding: '2px 4px',
    background: 'rgba(91, 33, 182, 0.2)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    display: 'flex',
    justifyContent: 'space-between',
  },
  abilityName: {
    fontWeight: TASERN_TYPOGRAPHY.weightMedium,
  },
  cooldown: {
    color: TASERN_COLORS.red,
    fontStyle: 'italic',
  },
  battleStatus: {
    display: 'flex',
    gap: TASERN_SPACING.xs,
    flexWrap: 'wrap',
    marginBottom: TASERN_SPACING.xs,
  },
  indicator: {
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    backgroundColor: 'rgba(139, 105, 20, 0.5)',
    padding: '2px 6px',
    borderRadius: TASERN_BORDERS.radiusSmall,
  },
  ownerBadge: {
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.gold,
    textAlign: 'center',
    padding: '2px 4px',
    background: 'rgba(212, 175, 55, 0.2)',
    borderRadius: TASERN_BORDERS.radiusSmall,
    fontWeight: TASERN_TYPOGRAPHY.weightMedium,
  },
  rarityBadge: {
    position: 'absolute',
    top: TASERN_SPACING.xs,
    left: TASERN_SPACING.xs,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    color: TASERN_COLORS.white,
    padding: '2px 8px',
    borderRadius: TASERN_BORDERS.radiusSmall,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};
