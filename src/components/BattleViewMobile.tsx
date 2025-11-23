/**
 * BattleViewMobile Component
 *
 * Mobile-optimized battle UI (< 900px).
 * Touch-friendly vertical layout with large targets.
 * Pure presentation - receives all state and handlers as props.
 */

import React from 'react';
import type { BattleViewDesktopProps } from './BattleViewDesktop';
import { BattlefieldGrid } from './BattlefieldGrid';
import { CardDisplay } from './CardDisplay';
import {
  TASERN_COLORS,
  TASERN_GRADIENTS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
  TASERN_ICONS,
} from '../styles/tasernTheme';

// Mobile uses same props as Desktop
export type BattleViewMobileProps = BattleViewDesktopProps;

export const BattleViewMobile: React.FC<BattleViewMobileProps> = ({
  battleState,
  activePlayer,
  isProcessing,
  phase,
  localPlayerId,
  isMultiplayer,
  selectedCard,
  selectedBattlefieldCard,
  inspectedCard,
  handleEndTurn,
  handleSurrender,
  handleCardSelect,
  handleBattlefieldClick,
  handleCardInspect,
  handleCastleAttack,
  getAvailableSpaces,
  isLocalPlayerTurn,
  setInspectedCard,
}) => {
  if (!battleState) {
    return (
      <div style={styles.emptyState}>
        <h1 style={styles.emptyTitle}>🏰 Tasern Siegefront</h1>
        <p style={styles.emptyText}>No battle in progress</p>
      </div>
    );
  }

  const playerNames = Object.fromEntries(
    Object.entries(battleState.players).map(([id, player]) => [id, player.name])
  );

  const players = Object.values(battleState.players);

  if (players.length < 2) {
    return (
      <div style={styles.emptyState}>
        <h1 style={styles.emptyTitle}>⚠️ Error</h1>
        <p style={styles.emptyText}>Battle requires two players</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Compact Header */}
      <div style={styles.header}>
        {/* Castle Health Row */}
        <div style={styles.castleRow}>
          <div
            style={{
              ...styles.castle,
              ...(selectedBattlefieldCard && players[0].id !== activePlayer?.id
                ? styles.castleTargetable
                : {}),
            }}
            onClick={() => handleCastleAttack(players[0].id)}
          >
            <div style={styles.castleName}>{players[0].name}</div>
            <div style={styles.castleHP}>
              🏰 {players[0].castleHp}/{players[0].maxCastleHp}
            </div>
          </div>

          <div style={styles.turnIndicator}>
            <div style={styles.turnNumber}>T{battleState.currentTurn}</div>
            {activePlayer && (
              <div style={styles.turnPlayer}>
                {activePlayer.type === 'ai' ? '🤖' : '👤'}
              </div>
            )}
          </div>

          <div
            style={{
              ...styles.castle,
              ...(selectedBattlefieldCard && players[1].id !== activePlayer?.id
                ? styles.castleTargetable
                : {}),
            }}
            onClick={() => handleCastleAttack(players[1].id)}
          >
            <div style={styles.castleName}>{players[1].name}</div>
            <div style={styles.castleHP}>
              🏰 {players[1].castleHp}/{players[1].maxCastleHp}
            </div>
          </div>
        </div>
      </div>

      {/* Battlefield - Main Focus */}
      <div style={styles.battlefieldContainer}>
        <BattlefieldGrid
          battlefield={battleState.battlefield}
          gridConfig={battleState.gridConfig}
          mapTheme={battleState.mapTheme}
          blockedTiles={battleState.blockedTiles || []}
          playerNames={playerNames}
          onCellClick={handleBattlefieldClick}
          highlightedPositions={
            selectedBattlefieldCard ? [selectedBattlefieldCard.position] : []
          }
          validDropZones={[]}
          availableSpaces={getAvailableSpaces()}
        />
      </div>

      {/* Hand - Horizontal Swipe */}
      {activePlayer && isLocalPlayerTurn() && activePlayer.hand.length > 0 && (
        <div style={styles.handContainer}>
          <div style={styles.handTitle}>
            ✋ Your Hand ({activePlayer.hand.length})
          </div>
          <div style={styles.handScroll}>
            {activePlayer.hand.map((card) => (
              <div
                key={card.id}
                style={styles.handCard}
                onClick={() => handleCardSelect(card)}
              >
                <CardDisplay
                  card={card}
                  isActive={selectedCard?.id === card.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Controls - Sticky */}
      <div style={styles.bottomControls}>
        {activePlayer?.type === 'human' && isLocalPlayerTurn() && (
          <>
            <button
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isProcessing ? styles.buttonDisabled : {}),
              }}
              onClick={handleEndTurn}
              disabled={isProcessing}
            >
              {isProcessing ? '⏳ Processing...' : '⏭️ End Turn'}
            </button>
            <button
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isProcessing ? styles.buttonDisabled : {}),
              }}
              onClick={handleSurrender}
              disabled={isProcessing}
            >
              🏳️ Surrender
            </button>
          </>
        )}
        {activePlayer?.type === 'ai' && (
          <div style={styles.aiThinking}>
            <span>🧠</span>
            <span>{activePlayer.name} is thinking...</span>
          </div>
        )}
      </div>

      {/* Card Inspection Modal */}
      {inspectedCard && (
        <div style={styles.inspectionOverlay} onClick={() => setInspectedCard(null)}>
          <div style={styles.inspectionCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.inspectionHeader}>
              <h3 style={styles.inspectionTitle}>Card Details</h3>
              <button
                style={styles.inspectionCloseButton}
                onClick={() => setInspectedCard(null)}
              >
                ✕
              </button>
            </div>
            <CardDisplay
              card={inspectedCard}
              isOnBattlefield={false}
              ownerName={playerNames[inspectedCard.ownerId]}
            />
          </div>
        </div>
      )}

      {/* Victory Overlay */}
      {battleState.winner && (
        <div style={styles.victoryOverlay}>
          <div style={styles.victoryCard}>
            <h1 style={styles.victoryTitle}>Victory!</h1>
            <p style={styles.victoryWinner}>
              {battleState.players[battleState.winner]?.name} wins!
            </p>
            <p style={styles.victoryTurn}>Turn {battleState.currentTurn}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: `linear-gradient(135deg, ${TASERN_COLORS.leather} 0%, rgba(26, 20, 16, 0.95) 100%)`,
    color: TASERN_COLORS.parchment,
    fontFamily: TASERN_TYPOGRAPHY.body,
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: TASERN_SPACING.xl,
  },
  emptyTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    color: TASERN_COLORS.gold,
    marginBottom: TASERN_SPACING.md,
  },
  emptyText: {
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    opacity: 0.8,
  },
  header: {
    background: `linear-gradient(135deg, ${TASERN_COLORS.leather} 0%, rgba(26, 20, 16, 0.95) 100())`,
    borderBottom: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.gold}`,
    padding: TASERN_SPACING.md,
    boxShadow: TASERN_SHADOWS.medium,
  },
  castleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: TASERN_SPACING.sm,
  },
  castle: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: TASERN_SPACING.xs,
    padding: TASERN_SPACING.sm,
    background: 'rgba(26, 20, 16, 0.7)',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
    borderRadius: TASERN_BORDERS.radiusSmall,
    minHeight: '60px',
    cursor: 'pointer',
  },
  castleTargetable: {
    borderColor: TASERN_COLORS.red,
    boxShadow: `0 0 12px ${TASERN_COLORS.red}`,
  },
  castleName: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.gold,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    textAlign: 'center',
  },
  castleHP: {
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
  },
  turnIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: TASERN_SPACING.sm,
    background: TASERN_GRADIENTS.goldShine,
    border: `${TASERN_BORDERS.widthThick} solid ${TASERN_COLORS.gold}`,
    borderRadius: '50%',
    width: '70px',
    height: '70px',
  },
  turnNumber: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.leather,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    lineHeight: 1,
  },
  turnPlayer: {
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
  },
  battlefieldContainer: {
    flex: 1,
    overflow: 'auto',
    padding: TASERN_SPACING.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handContainer: {
    borderTop: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.bronze}`,
    background: 'rgba(26, 20, 16, 0.95)',
    padding: TASERN_SPACING.md,
  },
  handTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.gold,
    marginBottom: TASERN_SPACING.sm,
    textAlign: 'center',
  },
  handScroll: {
    display: 'flex',
    gap: TASERN_SPACING.sm,
    overflowX: 'auto',
    overflowY: 'hidden',
    paddingBottom: TASERN_SPACING.sm,
  },
  handCard: {
    flexShrink: 0,
    width: '140px',
  },
  bottomControls: {
    display: 'flex',
    gap: TASERN_SPACING.sm,
    padding: TASERN_SPACING.md,
    background: 'rgba(26, 20, 16, 0.98)',
    borderTop: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.gold}`,
    boxShadow: `0 -4px 12px rgba(0, 0, 0, 0.5)`,
  },
  button: {
    flex: 1,
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    padding: `${TASERN_SPACING.md} ${TASERN_SPACING.lg}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `${TASERN_BORDERS.widthMedium} solid`,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    minHeight: '56px',
  },
  buttonPrimary: {
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    borderColor: TASERN_COLORS.gold,
    color: TASERN_COLORS.parchment,
    boxShadow: TASERN_SHADOWS.medium,
  },
  buttonSecondary: {
    background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.8) 0%, rgba(92, 64, 51, 0.8) 100%)',
    borderColor: TASERN_COLORS.red,
    color: TASERN_COLORS.parchment,
    boxShadow: TASERN_SHADOWS.soft,
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  aiThinking: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TASERN_SPACING.md,
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.purple,
    background: 'rgba(91, 33, 182, 0.2)',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.purple}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    padding: TASERN_SPACING.md,
  },
  inspectionOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: TASERN_SPACING.lg,
  },
  inspectionCard: {
    background: TASERN_GRADIENTS.parchment,
    border: `${TASERN_BORDERS.widthThick} solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusLarge,
    padding: TASERN_SPACING.lg,
    maxWidth: '400px',
    boxShadow: TASERN_SHADOWS.strong,
  },
  inspectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TASERN_SPACING.md,
  },
  inspectionTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.leather,
    margin: 0,
  },
  inspectionCloseButton: {
    background: 'transparent',
    border: 'none',
    fontSize: TASERN_TYPOGRAPHY.titleMedium,
    color: TASERN_COLORS.leather,
    cursor: 'pointer',
    padding: TASERN_SPACING.xs,
  },
  victoryOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  victoryCard: {
    background: TASERN_GRADIENTS.parchment,
    border: `${TASERN_BORDERS.widthThick} solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusLarge,
    padding: TASERN_SPACING['2xl'],
    textAlign: 'center',
    boxShadow: `0 0 40px ${TASERN_COLORS.gold}`,
    minWidth: 'min(500px, 90vw)',
  },
  victoryTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: '3rem',
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.textGold,
    marginBottom: TASERN_SPACING.lg,
  },
  victoryWinner: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleMedium,
    color: TASERN_COLORS.leather,
    marginBottom: TASERN_SPACING.md,
  },
  victoryTurn: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.leather,
    opacity: 0.8,
  },
};
