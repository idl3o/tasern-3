/**
 * BattleViewDesktop Component
 *
 * Desktop-optimized battle UI (>= 900px).
 * Sidebar layout with player stats, hand, and battle log.
 * Pure presentation - receives all state and handlers as props.
 *
 * Philosophy: Components receive state, dispatch actions. Nothing more.
 */

import React from 'react';
import type { BattleState, Player, Card, Position } from '../types/core';
import { BattlefieldGrid } from './BattlefieldGrid';
import { PlayerStatus } from './PlayerStatus';
import { BattleControls } from './BattleControls';
import { HandDisplay } from './HandDisplay';
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
// @ts-ignore
import '../styles/responsive.css';

export interface BattleViewDesktopProps {
  battleState: BattleState | null;
  activePlayer: Player | null;
  isProcessing: boolean;
  phase: string;
  localPlayerId: string | null;
  isMultiplayer: boolean;
  selectedCard: Card | null;
  selectedBattlefieldCard: { position: Position; cardId: string } | null;
  inspectedCard: any | null;
  handleEndTurn: () => void;
  handleSurrender: () => void;
  handleCardSelect: (card: Card) => void;
  handleBattlefieldClick: (position: Position, card: any) => void;
  handleCardInspect: (card: any) => void;
  handleCastleAttack: (targetPlayerId: string) => void;
  getAvailableSpaces: () => Position[];
  isLocalPlayerTurn: () => boolean;
  setInspectedCard: (card: any | null) => void;
}

export const BattleViewDesktop: React.FC<BattleViewDesktopProps> = ({
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
  // All handlers come from props - no logic here!

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
    <div className="battle-view-container" style={styles.container}>
      {/* Main Battle Area */}
      <div className="battle-main-content" style={styles.mainContent}>
        {/* Left: Player 1 Status OR Opponent Status + Controls (hidden on mobile) */}
        <div className="battle-side-panel battle-side-panel-left hide-mobile" style={styles.sidePanel}>
          <div style={styles.sidePanelPlayerStatus}>
            <PlayerStatus
              player={players[0]}
              isActive={activePlayer?.id === players[0].id}
              isWinner={battleState.winner === players[0].id}
              onCastleClick={() => handleCastleAttack(players[0].id)}
              isTargetable={
                activePlayer?.type === 'human' &&
                selectedBattlefieldCard !== null &&
                players[0].id !== activePlayer.id
              }
            />
          </div>

          {/* Player 1's Hand - Show if they're the local player */}
          {players[0].id === activePlayer?.id && isLocalPlayerTurn() && (
            <div className="battle-hand-section" style={{...styles.sidePanelHand, ...styles.sidePanelHandDisplay}}>
              <HandDisplay
                cards={players[0].hand}
                onCardSelect={handleCardSelect}
                selectedCardId={selectedCard?.id}
                playerName={players[0].name}
              />
            </div>
          )}

          {/* Controls + Battle Log - Show on opponent's side if player 2 is active */}
          {players[1].id === activePlayer?.id && isLocalPlayerTurn() && (
            <div className="battle-controls-section hide-mobile" style={{...styles.sidePanelControls, ...styles.sidePanelBattleControls}}>
              <BattleControls
                activePlayer={activePlayer}
                isProcessing={isProcessing}
                currentTurn={battleState.currentTurn}
                battleLog={battleState.battleLog}
                onEndTurn={handleEndTurn}
                onSurrender={handleSurrender}
              />
            </div>
          )}
        </div>

        {/* Center: Battlefield */}
        <div className="battle-center-panel" style={styles.centerPanel}>
          <BattlefieldGrid
            battlefield={battleState.battlefield}
            gridConfig={battleState.gridConfig}
            mapTheme={battleState.mapTheme}
            blockedTiles={battleState.blockedTiles}
            playerNames={playerNames}
            onCellClick={handleBattlefieldClick}
            onCardInspect={handleCardInspect}
            highlightedPositions={selectedBattlefieldCard ? [selectedBattlefieldCard.position] : []}
            validDropZones={[]} // No longer used - using availableSpaces instead
            availableSpaces={getAvailableSpaces()}
          />

          {/* Weather Display */}
          {battleState.weather && (
            <div style={styles.weatherDisplay}>
              <span style={styles.weatherIcon}>
                {TASERN_ICONS[`weather${battleState.weather.type.charAt(0) + battleState.weather.type.slice(1).toLowerCase()}` as keyof typeof TASERN_ICONS] || '☀️'}
              </span>
              <span style={styles.weatherName}>{battleState.weather.type}</span>
              <span style={styles.weatherDuration}>
                {battleState.weather.turnsRemaining} turns remaining
              </span>
            </div>
          )}
        </div>

        {/* Right: Player 2 Status OR Opponent Status + Controls (hidden on mobile) */}
        <div className="battle-side-panel battle-side-panel-right hide-mobile" style={styles.sidePanel}>
          <div style={styles.sidePanelPlayerStatus}>
            <PlayerStatus
              player={players[1]}
              isActive={activePlayer?.id === players[1].id}
              isWinner={battleState.winner === players[1].id}
              onCastleClick={() => handleCastleAttack(players[1].id)}
              isTargetable={
                activePlayer?.type === 'human' &&
                selectedBattlefieldCard !== null &&
                players[1].id !== activePlayer.id
              }
            />
          </div>

          {/* Player 2's Hand - Show if they're the local player */}
          {players[1].id === activePlayer?.id && isLocalPlayerTurn() && (
            <div className="battle-hand-section" style={{...styles.sidePanelHand, ...styles.sidePanelHandDisplay}}>
              <HandDisplay
                cards={players[1].hand}
                onCardSelect={handleCardSelect}
                selectedCardId={selectedCard?.id}
                playerName={players[1].name}
              />
            </div>
          )}

          {/* Controls + Battle Log - Show on opponent's side if player 1 is active */}
          {players[0].id === activePlayer?.id && isLocalPlayerTurn() && (
            <div className="battle-controls-section hide-mobile" style={{...styles.sidePanelControls, ...styles.sidePanelBattleControls}}>
              <BattleControls
                activePlayer={activePlayer}
                isProcessing={isProcessing}
                currentTurn={battleState.currentTurn}
                battleLog={battleState.battleLog}
                onEndTurn={handleEndTurn}
                onSurrender={handleSurrender}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Simplified Bottom Section - Just Hand (shown only on mobile) */}
      <div className="mobile-bottom-section show-mobile">
        {/* Hand Display - Only show for local player's turn */}
        {isLocalPlayerTurn() && activePlayer && (
          <div className="mobile-hand-display">
            <HandDisplay
              cards={activePlayer.hand}
              onCardSelect={handleCardSelect}
              selectedCardId={selectedCard?.id}
              playerName={activePlayer.name}
            />
          </div>
        )}
      </div>

      {/* Mobile Sticky Controls - Only show on mobile when local player's turn */}
      {isLocalPlayerTurn() && activePlayer && (
        <div className="mobile-sticky-controls show-mobile">
          <button
            style={{
              ...styles.mobileButton,
              ...styles.mobileButtonPrimary,
              ...(isProcessing ? styles.mobileButtonDisabled : {}),
            }}
            onClick={handleEndTurn}
            disabled={isProcessing}
          >
            {isProcessing ? '⏳ Processing...' : '⏭️ End Turn'}
          </button>
          <button
            style={{
              ...styles.mobileButton,
              ...styles.mobileButtonSecondary,
              ...(isProcessing ? styles.mobileButtonDisabled : {}),
            }}
            onClick={handleSurrender}
            disabled={isProcessing}
          >
            🏳️ Surrender
          </button>
        </div>
      )}

      {/* Victory Overlay */}
      {phase === 'victory' && battleState.winner && (
        <div style={styles.victoryOverlay}>
          <div className="victory-card" style={styles.victoryCard}>
            <h1 style={styles.victoryTitle}>🏆 Victory!</h1>
            <h2 style={styles.victoryWinner}>
              {battleState.players[battleState.winner].name} wins!
            </h2>
            <p style={styles.victoryTurn}>Battle concluded on turn {battleState.currentTurn}</p>
            <button
              style={styles.victoryButton}
              onClick={() => window.location.reload()}
            >
              ⚔️ Return to Main Menu
            </button>
          </div>
        </div>
      )}

      {/* Card Inspection Modal */}
      {inspectedCard && (
        <div
          style={styles.inspectionOverlay}
          onClick={() => setInspectedCard(null)}
        >
          <div
            style={styles.inspectionCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.inspectionHeader}>
              <h3 style={styles.inspectionTitle}>Card Details</h3>
              <button
                style={styles.inspectionCloseButton}
                onClick={() => setInspectedCard(null)}
              >
                ✕
              </button>
            </div>
            <div style={styles.inspectionCardDisplay}>
              {/* Import CardDisplay at the top of the file */}
              <CardDisplay
                card={inspectedCard}
                isOnBattlefield={false}
                ownerName={playerNames[inspectedCard.ownerId]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh', // Fixed viewport height - fit everything on screen
    maxHeight: '100vh', // Prevent overflow
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.md,
    padding: TASERN_SPACING.md, // Reduced padding for desktop
    overflow: 'hidden', // No scroll on desktop
    boxSizing: 'border-box',
  },
  emptyState: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TASERN_SPACING.lg,
  },
  emptyTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.glowGold,
  },
  emptyText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.parchment,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: TASERN_SPACING.lg,
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.3) 0%, rgba(26, 20, 16, 0.9) 100%)',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  title: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.glowGold,
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.sm,
    alignItems: 'flex-end',
  },
  phaseIndicator: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.parchment,
    padding: `${TASERN_SPACING.sm} ${TASERN_SPACING.lg}`,
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  turnIndicator: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    padding: `${TASERN_SPACING.md} ${TASERN_SPACING.xl}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `${TASERN_BORDERS.widthThick} solid`,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    transition: 'all 0.3s ease',
  },
  turnIndicatorYou: {
    background: 'linear-gradient(135deg, rgba(6, 95, 70, 0.7) 0%, rgba(6, 95, 70, 0.9) 100%)',
    borderColor: TASERN_COLORS.green,
    color: TASERN_COLORS.parchment,
    boxShadow: `0 0 20px ${TASERN_COLORS.green}`,
    animation: 'pulse 2s ease-in-out infinite',
  },
  turnIndicatorOpponent: {
    background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.5) 0%, rgba(139, 0, 0, 0.7) 100%)',
    borderColor: TASERN_COLORS.red,
    color: TASERN_COLORS.parchment,
    boxShadow: `0 0 15px ${TASERN_COLORS.red}`,
    opacity: 0.8,
  },
  mainContent: {
    display: 'flex',
    gap: TASERN_SPACING.md,
    flex: 1,
    alignItems: 'stretch',
    minHeight: 0, // Allow flex children to shrink below content size
    maxHeight: '100%', // Don't overflow container
    overflow: 'hidden', // Hide overflow on desktop
  },
  sidePanel: {
    flex: '0 1 320px', // Flexible width, smaller base width
    minWidth: '280px', // Minimum viable width
    maxWidth: '350px', // Cap maximum width
    maxHeight: '100%', // Don't overflow viewport
    overflow: 'visible', // No scrollbar on the panel itself
    display: 'flex',
    flexDirection: 'column',
    gap: 0, // No gap - unified panel
    background: TASERN_GRADIENTS.cardBackground,
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    padding: TASERN_SPACING.md,
    boxShadow: TASERN_SHADOWS.medium,
  },
  sidePanelHand: {
    // HandDisplay has its own styling, this just provides spacing
    marginTop: TASERN_SPACING.md,
    flex: 1, // Grow to fill available vertical space
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0, // Allow flexbox to shrink below content size
  },
  // Styles for components inside the unified sidebar panel
  sidePanelPlayerStatus: {
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
    padding: 0,
    paddingBottom: TASERN_SPACING.sm,
    marginBottom: 0,
  },
  sidePanelHandDisplay: {
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
    padding: 0,
  },
  sidePanelBattleControls: {
    background: 'transparent',
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
    padding: 0,
    paddingTop: 0,
    marginTop: TASERN_SPACING.md,
  },
  sidePanelControls: {
    // BattleControls has its own styling, this just provides spacing
    marginTop: TASERN_SPACING.md,
    flex: 1, // Grow to fill available vertical space
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.sm,
    minHeight: 0, // Allow flexbox to shrink below content size
  },
  centerPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center battlefield horizontally
    justifyContent: 'center', // Center vertically for better desktop layout
    gap: TASERN_SPACING.sm,
    minHeight: 0, // Allow flex children to shrink
    minWidth: 0, // Allow flex children to shrink horizontally
    maxHeight: '100%', // Don't overflow
    overflow: 'hidden', // Hide overflow
  },
  weatherDisplay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TASERN_SPACING.md,
    padding: TASERN_SPACING.lg,
    background: 'rgba(30, 58, 138, 0.3)',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.blue}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    boxShadow: TASERN_SHADOWS.glowBlue,
  },
  weatherIcon: {
    fontSize: '2rem',
  },
  weatherName: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.blue,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    textTransform: 'uppercase',
  },
  weatherDuration: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    fontStyle: 'italic',
  },
  victoryOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  victoryCard: {
    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(26, 20, 16, 0.95) 100%)',
    border: `4px solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusLarge,
    padding: TASERN_SPACING['3xl'],
    textAlign: 'center',
    boxShadow: TASERN_SHADOWS.glowGold,
    minWidth: '500px',
  },
  victoryTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: '4rem',
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.glowGold,
    marginBottom: TASERN_SPACING.lg,
  },
  victoryWinner: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleMedium,
    color: TASERN_COLORS.parchment,
    marginBottom: TASERN_SPACING.md,
  },
  victoryTurn: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.parchment,
    opacity: 0.8,
    marginBottom: TASERN_SPACING.xl,
  },
  victoryButton: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    padding: `${TASERN_SPACING.lg} ${TASERN_SPACING['2xl']}`,
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    border: `${TASERN_BORDERS.widthThick} solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    color: TASERN_COLORS.parchment,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.3s ease',
    boxShadow: TASERN_SHADOWS.medium,
  },
  mobileButton: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: '18px',
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    padding: `${TASERN_SPACING.md} ${TASERN_SPACING.xl}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `${TASERN_BORDERS.widthMedium} solid`,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flex: 1,
    maxWidth: '200px',
    minHeight: '56px',
  },
  mobileButtonPrimary: {
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    borderColor: TASERN_COLORS.gold,
    color: TASERN_COLORS.parchment,
    boxShadow: TASERN_SHADOWS.medium,
  },
  mobileButtonSecondary: {
    background: 'linear-gradient(135deg, rgba(139, 0, 0, 0.8) 0%, rgba(92, 64, 51, 0.8) 100%)',
    borderColor: TASERN_COLORS.red,
    color: TASERN_COLORS.parchment,
    boxShadow: TASERN_SHADOWS.soft,
  },
  mobileButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  // Mobile Header Styles
  mobileHeader: {
    display: 'none', // Hidden by default, shown via CSS media query
    background: `linear-gradient(135deg, ${TASERN_COLORS.leather} 0%, rgba(26, 20, 16, 0.95) 100%)`,
    borderBottom: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.gold}`,
    padding: TASERN_SPACING.md,
    boxShadow: TASERN_SHADOWS.medium,
  },
  mobileCastleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: TASERN_SPACING.md,
  },
  mobileCastle: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: TASERN_SPACING.xs,
    padding: TASERN_SPACING.sm,
    background: 'rgba(26, 20, 16, 0.7)',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
    borderRadius: TASERN_BORDERS.radiusSmall,
    transition: 'all 0.3s ease',
  },
  mobileCastleActive: {
    borderColor: TASERN_COLORS.gold,
    boxShadow: `0 0 12px ${TASERN_COLORS.gold}`,
  },
  mobileCastleTargetable: {
    cursor: 'pointer',
    borderColor: TASERN_COLORS.red,
    background: 'rgba(139, 0, 0, 0.3)',
    boxShadow: `0 0 12px ${TASERN_COLORS.red}`,
  },
  mobileCastleName: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.gold,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'center',
  },
  mobileCastleHP: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
  },
  mobileTurnWheel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    border: `${TASERN_BORDERS.widthThick} solid ${TASERN_COLORS.gold}`,
    borderRadius: '50%',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  mobileTurnNumber: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.gold,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    lineHeight: 1,
  },
  mobileTurnPlayer: {
    fontSize: '1.2rem',
    marginTop: TASERN_SPACING.xs,
  },
  inspectionOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  inspectionCard: {
    background: TASERN_GRADIENTS.cardBackground,
    border: `${TASERN_BORDERS.widthThick} solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusLarge,
    padding: TASERN_SPACING.xl,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: `${TASERN_SHADOWS.glowGold}, ${TASERN_SHADOWS.strong}`,
  },
  inspectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TASERN_SPACING.lg,
    paddingBottom: TASERN_SPACING.md,
    borderBottom: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.bronze}`,
  },
  inspectionTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: 0,
  },
  inspectionCloseButton: {
    background: 'rgba(139, 0, 0, 0.5)',
    border: `${TASERN_BORDERS.widthThin} solid ${TASERN_COLORS.red}`,
    borderRadius: TASERN_BORDERS.radiusSmall,
    color: TASERN_COLORS.parchment,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    padding: `${TASERN_SPACING.xs} ${TASERN_SPACING.md}`,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  inspectionCardDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};
