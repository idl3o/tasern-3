/**
 * Battle View Wrapper
 *
 * Thin orchestrator that detects screen size and delegates to appropriate layout:
 * - BattleViewDesktop (>= 900px) - Optimized sidebar layout
 * - BattleViewMobile (< 900px) - Touch-optimized vertical layout
 *
 * Contains ALL game logic, hooks, and handlers.
 * Child components are pure presentation.
 */

import React, { useState, useEffect } from 'react';
import {
  useBattleStore,
  selectBattleState,
  selectActivePlayer,
  selectIsProcessing,
  selectPhase,
  selectLocalPlayerId,
  selectIsMultiplayer,
} from '../state/battleStore';
import { BattleViewDesktop } from './BattleViewDesktop';
import { BattleViewMobile } from './BattleViewMobile';
import type { Card, Position } from '../types/core';

// Screen size breakpoint for mobile vs desktop
const MOBILE_BREAKPOINT = 900;

export const BattleView: React.FC = () => {
  // ===== GAME STATE (from store) =====
  const battleState = useBattleStore(selectBattleState);
  const activePlayer = useBattleStore(selectActivePlayer);
  const isProcessing = useBattleStore(selectIsProcessing);
  const phase = useBattleStore(selectPhase);
  const localPlayerId = useBattleStore(selectLocalPlayerId);
  const isMultiplayer = useBattleStore(selectIsMultiplayer);
  const { endTurn, executeAction } = useBattleStore();

  // ===== LOCAL UI STATE =====
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedBattlefieldCard, setSelectedBattlefieldCard] = useState<{
    position: Position;
    cardId: string
  } | null>(null);
  const [inspectedCard, setInspectedCard] = useState<any | null>(null);

  // ===== SCREEN SIZE DETECTION =====
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== HANDLERS =====
  const handleEndTurn = () => {
    if (!isProcessing) {
      setSelectedCard(null);
      setSelectedBattlefieldCard(null);
      endTurn();
    }
  };

  const handleSurrender = () => {
    if (!isProcessing && activePlayer?.type === 'human' && battleState) {
      const confirmed = window.confirm('Are you sure you want to surrender?');
      if (confirmed) {
        const opponentId = Object.keys(battleState.players).find(
          id => id !== activePlayer.id
        );
        if (opponentId) {
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
      setSelectedBattlefieldCard(null);
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
        playerId: activePlayer!.id,
        cardId: selectedCard.id,
        position,
        generatedCard: isMultiplayer ? selectedCard : undefined,
      });
      setSelectedCard(null);
      return;
    }

    // Case 2: Selecting your own card to attack with
    if (card !== null && card.ownerId === activePlayer!.id) {
      if (selectedBattlefieldCard?.cardId === card.id) {
        setSelectedBattlefieldCard(null);
      } else {
        setSelectedBattlefieldCard({ position, cardId: card.id });
        setSelectedCard(null);
      }
      return;
    }

    // Case 3: Attacking an enemy card with selected card
    if (selectedBattlefieldCard && card !== null && card.ownerId !== activePlayer!.id) {
      executeAction({
        type: 'ATTACK_CARD',
        playerId: activePlayer!.id,
        attackerCardId: selectedBattlefieldCard.cardId,
        targetCardId: card.id,
        randomSeed: Math.random(),
      });
      setSelectedBattlefieldCard(null);
      return;
    }

    // Case 4: Click empty cell with battlefield card selected - deselect
    if (selectedBattlefieldCard && card === null) {
      setSelectedBattlefieldCard(null);
    }
  };

  const handleCardInspect = (card: any) => {
    setInspectedCard(card);
  };

  const handleCastleAttack = (targetPlayerId: string) => {
    if (!isLocalPlayerTurn() || isProcessing || !selectedBattlefieldCard || !activePlayer) {
      return;
    }

    if (targetPlayerId === activePlayer.id) {
      return;
    }

    executeAction({
      type: 'ATTACK_CASTLE',
      playerId: activePlayer.id,
      attackerCardId: selectedBattlefieldCard.cardId,
      targetPlayerId,
      randomSeed: Math.random(),
    });
    setSelectedBattlefieldCard(null);
  };

  const getAvailableSpaces = (): Position[] => {
    if (!battleState || !activePlayer || !isLocalPlayerTurn() || isProcessing) {
      return [];
    }

    if (!selectedCard) {
      return [];
    }

    if (activePlayer.mana < selectedCard.manaCost) {
      return [];
    }

    const playerIds = Object.keys(battleState.players);
    const playerIndex = playerIds.indexOf(activePlayer.id);
    const totalCols = battleState.gridConfig.cols;
    const middleCol = Math.floor(totalCols / 2);

    const canDeployToColumn = (col: number): boolean => {
      if (playerIndex === 0) {
        return col <= middleCol;
      } else {
        return col >= middleCol;
      }
    };

    const availablePositions: Position[] = [];
    battleState.battlefield.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const position: Position = { row: rowIndex, col: colIndex };

        if (cell !== null) return;

        const isBlocked = battleState.blockedTiles?.some(
          (blocked) => blocked.row === rowIndex && blocked.col === colIndex
        );
        if (isBlocked) return;

        if (!canDeployToColumn(colIndex)) return;

        availablePositions.push(position);
      });
    });

    return availablePositions;
  };

  // ===== SHARED PROPS FOR BOTH LAYOUTS =====
  const sharedProps = {
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
  };

  // ===== RENDER APPROPRIATE LAYOUT =====
  return isMobile ? (
    <BattleViewMobile {...sharedProps} />
  ) : (
    <BattleViewDesktop {...sharedProps} />
  );
};
