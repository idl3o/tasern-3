/**
 * Battle View Component (BattleScene)
 *
 * Main battle UI orchestrator. Composes all sub-components.
 * Pure presentation - all logic lives in the store.
 *
 * Philosophy: Components receive state, dispatch actions. Nothing more.
 */

import React, { useState } from 'react';
import {
  useBattleStore,
  selectBattleState,
  selectActivePlayer,
  selectIsProcessing,
  selectPhase,
  selectLocalPlayerId,
  selectIsMultiplayer,
} from '../state/battleStore';
import { BattlefieldGrid } from './BattlefieldGrid';
import { PlayerStatus } from './PlayerStatus';
import { BattleControls } from './BattleControls';
import { HandDisplay } from './HandDisplay';
import { DebugPanel } from './DebugPanel';
import type { Card, Position } from '../types/core';
import {
  TASERN_COLORS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
  TASERN_ICONS,
} from '../styles/tasernTheme';

export const BattleView: React.FC = () => {
  const battleState = useBattleStore(selectBattleState);
  const activePlayer = useBattleStore(selectActivePlayer);
  const isProcessing = useBattleStore(selectIsProcessing);
  const phase = useBattleStore(selectPhase);
  const localPlayerId = useBattleStore(selectLocalPlayerId);
  const isMultiplayer = useBattleStore(selectIsMultiplayer);

  const { endTurn, executeAction } = useBattleStore();

  // Human player interaction state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedBattlefieldCard, setSelectedBattlefieldCard] = useState<{ position: Position; cardId: string } | null>(null);

  if (!battleState) {
    return (
      <div style={styles.emptyState}>
        <h1 style={styles.emptyTitle}>🏰 Tasern Siegefront</h1>
        <p style={styles.emptyText}>No battle in progress</p>
      </div>
    );
  }

  const handleEndTurn = () => {
    if (!isProcessing) {
      setSelectedCard(null); // Clear selection when ending turn
      setSelectedBattlefieldCard(null);
      endTurn();
    }
  };

  const handleSurrender = () => {
    if (!isProcessing && activePlayer?.type === 'human' && battleState) {
      // Confirm surrender
      const confirmed = window.confirm('Are you sure you want to surrender?');
      if (confirmed) {
        // End the battle by declaring the opponent as winner
        const opponentId = Object.keys(battleState.players).find(id => id !== activePlayer.id);
        if (opponentId) {
          // Force victory for opponent using proper Immer-based state update
          useBattleStore.setState((state) => {
            if (state.battleState) {
              state.battleState.winner = opponentId;
              state.battleState.phase = 'victory';
            }
          });
          console.log('🏳️ Player surrendered - opponent wins!');
        }
      }
    }
  };

  // Helper: Check if it's the local player's turn
  const isLocalPlayerTurn = () => {
    if (!activePlayer) return false;
    if (isMultiplayer) {
      return activePlayer.id === localPlayerId;
    }
    return activePlayer.type === 'human';
  };

  const handleCardSelect = (card: Card) => {
    if (isLocalPlayerTurn() && !isProcessing) {
      setSelectedCard(selectedCard?.id === card.id ? null : card);
      setSelectedBattlefieldCard(null); // Clear battlefield selection
    }
  };

  const handleBattlefieldClick = (position: Position, card: any) => {
    if (!isLocalPlayerTurn() || isProcessing) {
      return;
    }

    // Case 1: Deploying a card from hand
    if (selectedCard && card === null) {
      executeAction({
        type: 'DEPLOY_CARD',
        playerId: activePlayer.id,
        cardId: selectedCard.id,
        position,
        // Include card data for multiplayer - opponent doesn't have this card in their local state
        generatedCard: isMultiplayer ? selectedCard : undefined,
      });
      setSelectedCard(null);
      return;
    }

    // Case 2: Selecting your own card to attack with
    if (card !== null && card.ownerId === activePlayer.id) {
      // Toggle selection
      if (selectedBattlefieldCard?.cardId === card.id) {
        setSelectedBattlefieldCard(null);
      } else {
        setSelectedBattlefieldCard({ position, cardId: card.id });
        setSelectedCard(null); // Clear hand selection
      }
      return;
    }

    // Case 3: Attacking an enemy card with selected card
    if (selectedBattlefieldCard && card !== null && card.ownerId !== activePlayer.id) {
      console.log('⚔️ Executing card attack - turn should continue');
      executeAction({
        type: 'ATTACK_CARD',
        playerId: activePlayer.id,
        attackerCardId: selectedBattlefieldCard.cardId,
        targetCardId: card.id,
      });
      setSelectedBattlefieldCard(null);
      return;
    }

    // Case 4: Click empty cell with battlefield card selected - deselect
    if (selectedBattlefieldCard && card === null) {
      setSelectedBattlefieldCard(null);
    }
  };

  const handleCastleAttack = (targetPlayerId: string) => {
    if (!isLocalPlayerTurn() || isProcessing || !selectedBattlefieldCard || !activePlayer) {
      return;
    }

    // Can't attack your own castle
    if (targetPlayerId === activePlayer.id) {
      return;
    }

    console.log('🏰 Executing castle attack - turn should continue');
    executeAction({
      type: 'ATTACK_CASTLE',
      playerId: activePlayer.id,
      attackerCardId: selectedBattlefieldCard.cardId,
      targetPlayerId,
    });

    setSelectedBattlefieldCard(null);
  };

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
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>⚔️ Tasern Siegefront ⚔️</h1>
        <div style={styles.headerRight}>
          <div style={styles.phaseIndicator}>
            {phase === 'victory' ? '🏆 Victory!' : `⚔️ Turn ${battleState.currentTurn}`}
          </div>
          {activePlayer && phase !== 'victory' && (
            <div style={{
              ...styles.turnIndicator,
              // Check if active player is the local player (for multiplayer) or is human type (for local games)
              ...((isMultiplayer && activePlayer.id === localPlayerId) || (!isMultiplayer && activePlayer.type === 'human')
                ? styles.turnIndicatorYou
                : styles.turnIndicatorOpponent)
            }}>
              {(isMultiplayer && activePlayer.id === localPlayerId) || (!isMultiplayer && activePlayer.type === 'human')
                ? '👤 YOUR TURN'
                : `${activePlayer.type === 'ai' ? '🤖' : '👥'} ${activePlayer.name}'s Turn`}
            </div>
          )}
        </div>
      </header>

      {/* Main Battle Area */}
      <div style={styles.mainContent}>
        {/* Left: Player 1 Status */}
        <div style={styles.sidePanel}>
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

        {/* Center: Battlefield */}
        <div style={styles.centerPanel}>
          <BattlefieldGrid
            battlefield={battleState.battlefield}
            playerNames={playerNames}
            onCellClick={handleBattlefieldClick}
            highlightedPositions={selectedBattlefieldCard ? [selectedBattlefieldCard.position] : []}
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

        {/* Right: Player 2 Status */}
        <div style={styles.sidePanel}>
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
      </div>

      {/* Bottom: Controls - Only show for local player */}
      {activePlayer && isLocalPlayerTurn() && (
        <div style={styles.controlsPanel}>
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

      {/* Human Player Hand - Only show for local player */}
      {activePlayer && isLocalPlayerTurn() && (
        <div style={styles.handPanel}>
          <HandDisplay
            cards={activePlayer.hand}
            onCardSelect={handleCardSelect}
            selectedCardId={selectedCard?.id}
            playerName={activePlayer.name}
          />
        </div>
      )}

      {/* Victory Overlay */}
      {phase === 'victory' && battleState.winner && (
        <div style={styles.victoryOverlay}>
          <div style={styles.victoryCard}>
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

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.lg,
    padding: TASERN_SPACING.lg,
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
    gap: TASERN_SPACING.xl,
    flex: 1,
    alignItems: 'flex-start',
  },
  sidePanel: {
    flex: '0 0 350px',
  },
  centerPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: TASERN_SPACING.lg,
  },
  controlsPanel: {
    display: 'flex',
    justifyContent: 'center',
  },
  handPanel: {
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '100%',
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
};
