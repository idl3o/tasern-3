/**
 * Hand Display Component
 *
 * Shows human player's hand of cards they can deploy.
 * Pure presentation - dispatches actions on click.
 */

import React, { useState } from 'react';
import type { Card } from '../types/core';
import { CardDisplay } from './CardDisplay';
import {
  TASERN_COLORS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
} from '../styles/tasernTheme';
import '../styles/responsive.css';

interface HandDisplayProps {
  cards: Card[];
  onCardSelect?: (card: Card) => void;
  selectedCardId?: string | null;
  playerName?: string;
}

export const HandDisplay: React.FC<HandDisplayProps> = ({
  cards,
  onCardSelect,
  selectedCardId,
  playerName = 'You',
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>✋ {playerName}'s Hand</span>
        <span style={styles.count}>
          {cards.length} card{cards.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={styles.cardsContainer}>
        {cards.length === 0 ? (
          <div style={styles.emptyState}>No cards in hand</div>
        ) : (
          cards.map((card) => (
            <div
              key={card.id}
              className="hand-card-wrapper"
              style={styles.cardWrapper}
            >
              <CardDisplay
                card={card}
                isActive={selectedCardId === card.id}
                onClick={() => onCardSelect?.(card)}
              />
            </div>
          ))
        )}
      </div>

      {selectedCardId && (
        <div style={styles.hint}>
          💡 Click a battlefield position to deploy
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.md,
    padding: TASERN_SPACING.lg,
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.2) 0%, rgba(26, 20, 16, 0.9) 100%)',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.bronze}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    boxShadow: TASERN_SHADOWS.medium,
    maxHeight: '100%', // Don't overflow parent
    overflow: 'hidden', // Container doesn't scroll, only cardsContainer does
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: TASERN_SPACING.sm,
    borderBottom: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  title: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.gold,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  count: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    opacity: 0.8,
  },
  cardsContainer: {
    display: 'flex',
    flexDirection: 'column', // Vertical stack
    gap: TASERN_SPACING.md,
    overflowY: 'auto', // Vertical scroll
    overflowX: 'hidden',
    padding: TASERN_SPACING.sm,
    maxHeight: '600px', // Allow scrolling if many cards
    minHeight: '200px',
  },
  cardWrapper: {
    width: '100%', // Full width of container
    flexShrink: 0, // Don't shrink cards
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.stone,
    fontStyle: 'italic',
  },
  hint: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.gold,
    textAlign: 'center',
    padding: TASERN_SPACING.sm,
    background: 'rgba(212, 175, 55, 0.2)',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusSmall,
    animation: 'pulse 2s ease-in-out infinite',
  },
};
