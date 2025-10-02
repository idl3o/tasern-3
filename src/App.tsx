/**
 * Tasern Siegefront - Main Application
 *
 * Philosophy: Clean separation - UI dispatches actions, store manages state
 */

import React, { useEffect, useState } from 'react';
import { BattleView } from './components/BattleView';
import { DeckSelection } from './components/DeckSelection';
import { WalletConnect } from './components/WalletConnect';
import { NFTGallery } from './components/NFTGallery';
import { useBattleStore } from './state/battleStore';
import { PlayerFactory } from './core/PlayerFactory';
import { HumanStrategy } from './strategies/HumanStrategy';
import type { Card, Player, AIPersonality } from './types/core';
import {
  LADY_SWIFTBLADE,
  THORNWICK_THE_TACTICIAN,
  SIR_STUMBLEHEART,
  GROK_THE_UNPREDICTABLE,
  ARCHMAGUS_NETHYS
} from './ai/personalities';
import { TASERN_COLORS, TASERN_TYPOGRAPHY, TASERN_SHADOWS } from './styles/tasernTheme';

console.log('📱 App component loading...');

export const App: React.FC = () => {
  console.log('🎮 App component rendering...');
  const { battleState, initializeBattle, processAITurn } = useBattleStore();
  console.log('🎯 battleState:', battleState ? 'exists' : 'null');

  const [deckSelectionState, setDeckSelectionState] = useState<{
    availableCards: Card[];
    opponent: AIPersonality | null;
    humanPlayer: boolean;
    isPlayer2: boolean;
    player1Cards?: Card[];
  } | null>(null);

  const [showNFTGallery, setShowNFTGallery] = useState(false);

  const startBattle = (opponentName: string, humanPlayer: boolean = true, humanVsHuman: boolean = false) => {
    let opponent;
    switch (opponentName) {
      case 'swiftblade':
        opponent = LADY_SWIFTBLADE;
        break;
      case 'thornwick':
        opponent = THORNWICK_THE_TACTICIAN;
        break;
      case 'stumbleheart':
        opponent = SIR_STUMBLEHEART;
        break;
      case 'grok':
        opponent = GROK_THE_UNPREDICTABLE;
        break;
      case 'nethys':
        opponent = ARCHMAGUS_NETHYS;
        break;
      default:
        opponent = THORNWICK_THE_TACTICIAN;
    }

    if (humanVsHuman) {
      // Human vs Human - start with player 1 deck selection
      const tempPlayer = PlayerFactory.createHuman('Player 1');
      const strategy = tempPlayer.strategy as HumanStrategy;

      // Generate initial deck of 15 cards
      const availableCards = strategy.generateInitialDeck(tempPlayer, {
        id: 'temp',
        currentTurn: 0,
        phase: 'deployment',
        activePlayerId: tempPlayer.id,
        players: { [tempPlayer.id]: tempPlayer },
        battlefield: [[null, null, null], [null, null, null], [null, null, null]],
        weather: null,
        terrainEffects: [],
        controlledZones: {},
        winner: null,
        battleLog: [],
        aiMemories: {},
      });

      setDeckSelectionState({ availableCards, opponent: null, humanPlayer: true, isPlayer2: false });
    } else if (humanPlayer) {
      // For human players, show deck selection first
      const tempPlayer = PlayerFactory.createHuman('You');
      const strategy = tempPlayer.strategy as HumanStrategy;

      // Generate initial deck of 15 cards
      const availableCards = strategy.generateInitialDeck(tempPlayer, {
        id: 'temp',
        currentTurn: 0,
        phase: 'deployment',
        activePlayerId: tempPlayer.id,
        players: { [tempPlayer.id]: tempPlayer },
        battlefield: [[null, null, null], [null, null, null], [null, null, null]],
        weather: null,
        terrainEffects: [],
        controlledZones: {},
        winner: null,
        battleLog: [],
        aiMemories: {},
      });

      setDeckSelectionState({ availableCards, opponent, humanPlayer, isPlayer2: false });
    } else {
      // AI vs AI battle starts immediately
      const player1 = PlayerFactory.createAI('Lady Swiftblade', LADY_SWIFTBLADE);
      const player2 = PlayerFactory.createAI(opponent.name, opponent);
      initializeBattle(player1, player2);
    }
  };

  const handleDeckSelectionComplete = (selectedCards: Card[]) => {
    if (!deckSelectionState) return;

    if (deckSelectionState.opponent === null) {
      // Human vs Human - this is player 1 selection, move to player 2
      if (!deckSelectionState.isPlayer2) {
        // Generate deck for player 2
        const tempPlayer = PlayerFactory.createHuman('Player 2');
        const strategy = tempPlayer.strategy as HumanStrategy;
        const availableCards = strategy.generateInitialDeck(tempPlayer, {
          id: 'temp',
          currentTurn: 0,
          phase: 'deployment',
          activePlayerId: tempPlayer.id,
          players: { [tempPlayer.id]: tempPlayer },
          battlefield: [[null, null, null], [null, null, null], [null, null, null]],
          weather: null,
          terrainEffects: [],
          controlledZones: {},
          winner: null,
          battleLog: [],
          aiMemories: {},
        });

        setDeckSelectionState({
          availableCards,
          opponent: null,
          humanPlayer: true,
          isPlayer2: true,
          player1Cards: selectedCards
        });
      } else {
        // Both players have selected - start battle
        const player1 = PlayerFactory.createHuman('Player 1');
        player1.hand = deckSelectionState.player1Cards!.slice(0, 5);
        player1.deck = deckSelectionState.player1Cards!.slice(5);

        const player2 = PlayerFactory.createHuman('Player 2');
        player2.hand = selectedCards.slice(0, 5);
        player2.deck = selectedCards.slice(5);

        console.log(`📚 Player 1 deck: ${player1.hand.length} in hand, ${player1.deck.length} in deck`);
        console.log(`📚 Player 2 deck: ${player2.hand.length} in hand, ${player2.deck.length} in deck`);

        setDeckSelectionState(null);
        initializeBattle(player1, player2);
      }
    } else {
      // Human vs AI
      const player1 = PlayerFactory.createHuman('You');
      player1.hand = selectedCards.slice(0, 5);
      player1.deck = selectedCards.slice(5);

      console.log(`📚 Player deck created: ${player1.hand.length} in hand, ${player1.deck.length} in deck`);

      const player2 = PlayerFactory.createAI(
        deckSelectionState.opponent.name,
        deckSelectionState.opponent
      );

      setDeckSelectionState(null);
      initializeBattle(player1, player2);
    }
  };

  // Auto-process AI turns for AI vs AI battles
  useEffect(() => {
    if (battleState && (battleState.phase === 'deployment' || battleState.phase === 'battle')) {
      const activePlayer = battleState.players[battleState.activePlayerId];
      if (activePlayer && activePlayer.type === 'ai') {
        console.log('⏰ Scheduling AI turn for:', activePlayer.name, 'phase:', battleState.phase);
        // Small delay to make it watchable
        const timer = setTimeout(() => {
          processAITurn();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [battleState, processAITurn]);

  // Show NFT Gallery modal
  if (showNFTGallery) {
    return (
      <>
        {/* Show menu in background */}
        <div style={styles.menuContainer}>
          <div style={styles.menuCard}>
            <div style={styles.header}>
              <div>
                <h1 style={styles.title}>⚔️ Tasern Siegefront ⚔️</h1>
                <p style={styles.subtitle}>Tales of Tasern Battle Arena</p>
              </div>
              <WalletConnect />
            </div>
          </div>
        </div>
        {/* NFT Gallery Overlay */}
        <NFTGallery onClose={() => setShowNFTGallery(false)} />
      </>
    );
  }

  // Show deck selection if human player needs to choose cards
  if (deckSelectionState) {
    return (
      <DeckSelection
        availableCards={deckSelectionState.availableCards}
        onConfirmSelection={handleDeckSelectionComplete}
        playerName={deckSelectionState.isPlayer2 ? 'Player 2' : (deckSelectionState.opponent === null ? 'Player 1' : 'You')}
      />
    );
  }

  if (!battleState) {
    return (
      <div style={styles.menuContainer}>
        <div style={styles.menuCard}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>⚔️ Tasern Siegefront ⚔️</h1>
              <p style={styles.subtitle}>Tales of Tasern Battle Arena</p>
            </div>
            <WalletConnect />
          </div>

          <div style={styles.personalityGrid}>
            <h2 style={styles.sectionTitle}>Play vs AI</h2>

            <button style={styles.opponentButton} onClick={() => startBattle('stumbleheart')}>
              <div style={styles.opponentName}>Sir Stumbleheart</div>
              <div style={styles.opponentTitle}>"The Noble Blunderer"</div>
              <div style={styles.opponentTraits}>Creative • Low Aggression • Patient</div>
            </button>

            <button style={styles.opponentButton} onClick={() => startBattle('swiftblade')}>
              <div style={styles.opponentName}>Lady Swiftblade</div>
              <div style={styles.opponentTitle}>"The Lightning Duelist"</div>
              <div style={styles.opponentTraits}>Aggressive • High Risk • Swift</div>
            </button>

            <button style={styles.opponentButton} onClick={() => startBattle('thornwick')}>
              <div style={styles.opponentName}>Thornwick the Tactician</div>
              <div style={styles.opponentTitle}>"The Chess Master"</div>
              <div style={styles.opponentTraits}>Patient • Adaptive • Calculating</div>
            </button>

            <button style={styles.opponentButton} onClick={() => startBattle('grok')}>
              <div style={styles.opponentName}>Grok the Unpredictable</div>
              <div style={styles.opponentTitle}>"The Chaos Warrior"</div>
              <div style={styles.opponentTraits}>Creative • High Risk • Chaotic</div>
            </button>

            <button style={styles.opponentButton} onClick={() => startBattle('nethys')}>
              <div style={styles.opponentName}>Archmagus Nethys</div>
              <div style={styles.opponentTitle}>"Master of the Arcane"</div>
              <div style={styles.opponentTraits}>Creative • Patient • Mystical</div>
            </button>
          </div>

          <div style={styles.divider}></div>

          <div style={styles.personalityGrid}>
            <h2 style={styles.sectionTitle}>NFT Cards</h2>

            <button style={styles.opponentButton} onClick={() => setShowNFTGallery(true)}>
              <div style={styles.opponentName}>🎴 View NFT Gallery</div>
              <div style={styles.opponentTraits}>Turn your Tasern NFTs into playable cards</div>
            </button>
          </div>

          <div style={styles.divider}></div>

          <div style={styles.personalityGrid}>
            <h2 style={styles.sectionTitle}>Human vs Human</h2>

            <button style={styles.opponentButton} onClick={() => startBattle('', true, true)}>
              <div style={styles.opponentName}>Player 1 vs Player 2</div>
              <div style={styles.opponentTraits}>Face your friend in tactical combat</div>
            </button>
          </div>

          <div style={styles.divider}></div>

          <div style={styles.personalityGrid}>
            <h2 style={styles.sectionTitle}>Watch AI vs AI</h2>

            <button style={styles.opponentButton} onClick={() => startBattle('swiftblade', false)}>
              <div style={styles.opponentName}>Lady Swiftblade vs Thornwick</div>
              <div style={styles.opponentTraits}>Aggressive vs Patient</div>
            </button>

            <button style={styles.opponentButton} onClick={() => startBattle('grok', false)}>
              <div style={styles.opponentName}>Lady Swiftblade vs Grok</div>
              <div style={styles.opponentTraits}>Aggressive vs Chaotic</div>
            </button>
          </div>

          <p style={styles.note}>
            🦋 Watch AI personalities clash in consciousness-driven battle
          </p>
        </div>
      </div>
    );
  }

  return <BattleView />;
};

// Medieval D&D Tasern styling
const styles: Record<string, React.CSSProperties> = {
  menuContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
  },
  menuCard: {
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.2) 0%, rgba(26, 20, 16, 0.9) 100%)',
    border: `3px solid ${TASERN_COLORS.gold}`,
    borderRadius: '16px',
    padding: '3rem',
    maxWidth: '800px',
    boxShadow: TASERN_SHADOWS.glowGold,
    backdropFilter: 'blur(10px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '2rem',
  },
  title: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    color: TASERN_COLORS.gold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.glowGold,
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontFamily: TASERN_TYPOGRAPHY.accent,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.parchment,
    textAlign: 'center',
    marginBottom: '0',
    opacity: 0.8,
  },
  personalityGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '2rem',
  },
  sectionTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleSmall,
    color: TASERN_COLORS.gold,
    textAlign: 'center',
    marginBottom: '1rem',
  },
  opponentButton: {
    background: 'linear-gradient(135deg, rgba(92, 64, 51, 0.8) 0%, rgba(26, 20, 16, 0.9) 100%)',
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '8px',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s',
    color: TASERN_COLORS.parchment,
    fontFamily: TASERN_TYPOGRAPHY.body,
    textAlign: 'left',
  },
  opponentName: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.gold,
    marginBottom: '0.25rem',
  },
  opponentTitle: {
    fontFamily: TASERN_TYPOGRAPHY.accent,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    marginBottom: '0.5rem',
    opacity: 0.9,
  },
  opponentTraits: {
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.bronze,
    fontStyle: 'italic',
  },
  note: {
    textAlign: 'center',
    marginTop: '2rem',
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  divider: {
    height: '2px',
    background: `linear-gradient(90deg, transparent 0%, ${TASERN_COLORS.bronze} 50%, transparent 100%)`,
    margin: '2rem 0',
    opacity: 0.5,
  },
};
