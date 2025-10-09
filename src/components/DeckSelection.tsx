/**
 * Deck Selection Component
 *
 * Pre-battle phase where human player selects 5 cards from 15.
 * Pure presentation - dispatches selection on completion.
 */

import React, { useState, useEffect } from 'react';
import type { Card } from '../types/core';
import { CardDisplay } from './CardDisplay';
import {
  TASERN_COLORS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
} from '../styles/tasernTheme';

interface DeckSelectionProps {
  availableCards: Card[];
  onConfirmSelection: (selectedCards: Card[]) => void;
  playerName?: string;
  onClose?: () => void;
}

export const DeckSelection: React.FC<DeckSelectionProps> = ({
  availableCards,
  onConfirmSelection,
  playerName = 'You',
  onClose,
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCardClick = (card: Card) => {
    const newSelection = new Set(selectedCardIds);

    if (newSelection.has(card.id)) {
      // Deselect
      newSelection.delete(card.id);
    } else if (newSelection.size < 5) {
      // Select (max 5 for starting hand)
      newSelection.add(card.id);
    }

    setSelectedCardIds(newSelection);
  };

  const handleConfirm = () => {
    const selectedForHand = availableCards.filter(card => selectedCardIds.has(card.id));
    const unselectedForDeck = availableCards.filter(card => !selectedCardIds.has(card.id));
    // Return hand cards first, then deck cards
    onConfirmSelection([...selectedForHand, ...unselectedForDeck]);
  };

  const selectedCount = selectedCardIds.size;
  const canConfirm = selectedCount === 5;

  // Separate NFT cards from generated cards
  const nftCards = availableCards.filter(card => card.isNFT);
  const generatedCards = availableCards.filter(card => !card.isNFT);

  const renderCardGrid = (cards: Card[], title: string) => {
    if (cards.length === 0) return null;

    return (
      <div style={styles.categorySection}>
        <h2 style={styles.categoryTitle}>{title}</h2>
        <div style={styles.cardsGrid}>
          {cards.map((card) => {
            const isSelected = selectedCardIds.has(card.id);
            return (
              <div
                key={card.id}
                style={{
                  ...styles.cardWrapper,
                  ...(isSelected ? styles.cardWrapperSelected : {}),
                }}
                onClick={() => handleCardClick(card)}
              >
                <CardDisplay card={card} isActive={isSelected} />
                {card.isNFT && (
                  <div style={styles.nftBadge}>
                    NFT
                  </div>
                )}
                {isSelected && (
                  <div style={styles.selectionBadge}>
                    ✓ Selected
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header with Close Button */}
        <div style={styles.header}>
          <h1 style={styles.title}>⚔️ {playerName}: Choose Your Battle Deck ⚔️</h1>
          {onClose && (
            <button style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <p style={styles.subtitle}>
          Select 5 cards for your starting hand from {availableCards.length} available cards
        </p>

        <div style={styles.selectionCounter}>
          <span style={styles.counterText}>
            Starting Hand: <span style={styles.counterNumber}>{selectedCount}</span> / 5
          </span>
          {canConfirm && (
            <span style={styles.readyIndicator}>✓ Ready to battle!</span>
          )}
        </div>

        {/* NFT Cards Section */}
        {renderCardGrid(nftCards, `🎴 NFT Cards (${nftCards.length})`)}

        {/* Battle Ready Cards Section */}
        {renderCardGrid(generatedCards, `⚔️ Battle Ready Cards (${generatedCards.length})`)}


        <div style={styles.buttonContainer}>
          <button
            style={{
              ...styles.confirmButton,
              ...(canConfirm ? {} : styles.confirmButtonDisabled),
            }}
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {canConfirm
              ? '⚔️ Enter Battle!'
              : `Select ${5 - selectedCount} more card${5 - selectedCount === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1000,
    padding: TASERN_SPACING.xl,
    overflowY: 'auto',
    paddingTop: TASERN_SPACING.xl,
  },
  container: {
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.3) 0%, rgba(26, 20, 16, 0.95) 100%)',
    border: `4px solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusLarge,
    padding: TASERN_SPACING['3xl'],
    maxWidth: '1400px',
    width: '100%',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TASERN_SPACING.md,
  },
  title: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    color: TASERN_COLORS.gold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.glowGold,
    margin: 0,
    flex: 1,
  },
  closeButton: {
    background: 'transparent',
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    color: TASERN_COLORS.gold,
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  subtitle: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.parchment,
    textAlign: 'center',
    marginBottom: TASERN_SPACING.xl,
    opacity: 0.9,
  },
  selectionCounter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: TASERN_SPACING.xl,
    marginBottom: TASERN_SPACING.xl,
    padding: TASERN_SPACING.lg,
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.bronze}`,
  },
  counterText: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.parchment,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
  },
  counterNumber: {
    color: TASERN_COLORS.gold,
    fontSize: TASERN_TYPOGRAPHY.titleSmall,
  },
  readyIndicator: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.green,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    animation: 'pulse 2s ease-in-out infinite',
  },
  categorySection: {
    marginBottom: TASERN_SPACING.xl,
  },
  categoryTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.gold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: TASERN_SPACING.lg,
    textShadow: TASERN_SHADOWS.soft,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: TASERN_SPACING.lg,
    marginBottom: TASERN_SPACING.md,
    maxHeight: '40vh',
    overflowY: 'auto',
    padding: TASERN_SPACING.md,
    border: `1px solid ${TASERN_COLORS.bronze}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    background: 'rgba(0, 0, 0, 0.3)',
  },
  cardWrapper: {
    position: 'relative',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
    opacity: 0.7,
  },
  cardWrapperSelected: {
    transform: 'scale(1.05)',
    opacity: 1,
  },
  nftBadge: {
    position: 'absolute',
    top: TASERN_SPACING.sm,
    left: TASERN_SPACING.sm,
    background: TASERN_COLORS.purple,
    color: TASERN_COLORS.parchment,
    padding: `${TASERN_SPACING.xs} ${TASERN_SPACING.sm}`,
    borderRadius: TASERN_BORDERS.radiusSmall,
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    textTransform: 'uppercase',
    boxShadow: TASERN_SHADOWS.strong,
  },
  selectionBadge: {
    position: 'absolute',
    top: TASERN_SPACING.sm,
    right: TASERN_SPACING.sm,
    background: TASERN_COLORS.green,
    color: '#1A1410',
    padding: `${TASERN_SPACING.xs} ${TASERN_SPACING.sm}`,
    borderRadius: TASERN_BORDERS.radiusSmall,
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    boxShadow: TASERN_SHADOWS.strong,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: TASERN_SPACING.xl,
  },
  confirmButton: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    padding: `${TASERN_SPACING.lg} ${TASERN_SPACING['3xl']}`,
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    border: `${TASERN_BORDERS.widthThick} solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    color: TASERN_COLORS.parchment,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.3s ease',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    boxShadow: TASERN_SHADOWS.soft,
    borderColor: TASERN_COLORS.stone,
  },
};
