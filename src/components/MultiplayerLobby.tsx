/**
 * Multiplayer Lobby Component
 *
 * Handles PVP matchmaking flow:
 * 1. Connect wallet → Initialize peer
 * 2. Create lobby (get invite code) OR Join lobby (paste invite code)
 * 3. Both players select decks
 * 4. Start battle
 *
 * Philosophy: Make PVP feel like inviting a friend to play D&D at your table.
 */

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMultiplayerStore, selectPhase, selectInviteCode, selectOpponent, selectError } from '../state/multiplayerStore';
import { useNFTCardsStore } from '../state/nftCardsStore';
import { DeckSelection } from './DeckSelection';
import type { Card } from '../types/core';
import {
  TASERN_COLORS,
  TASERN_TYPOGRAPHY,
  TASERN_SHADOWS,
  TASERN_BORDERS,
  TASERN_SPACING,
} from '../styles/tasernTheme';

interface MultiplayerLobbyProps {
  onBattleReady: (localDeck: Card[], opponentDeck: Card[], opponentName: string, opponentWallet: string) => void;
  onClose?: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onBattleReady, onClose }) => {
  const { address, isConnected } = useAccount();
  const { getNFTCards } = useNFTCardsStore();

  const [playerName, setPlayerName] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [showDeckSelection, setShowDeckSelection] = useState(false);

  const phase = useMultiplayerStore(selectPhase);
  const inviteCode = useMultiplayerStore(selectInviteCode);
  const opponent = useMultiplayerStore(selectOpponent);
  const error = useMultiplayerStore(selectError);

  const {
    isInitialized,
    initialize,
    createLobby,
    joinLobby,
    setLocalDeck,
    disconnect,
    resetLobby,
    localDeck,
    isHost
  } = useMultiplayerStore();

  // Initialize multiplayer when wallet connects
  useEffect(() => {
    if (isConnected && address && !isInitialized) {
      console.log('🎮 Initializing multiplayer for wallet:', address);
      initialize(address);
    }
  }, [isConnected, address, isInitialized, initialize]);

  // When both players ready, start battle
  useEffect(() => {
    if (phase === 'ready' && localDeck && opponent?.deck) {
      console.log('🎮 Both players ready! Starting battle...');
      onBattleReady(localDeck, opponent.deck, opponent.name, opponent.walletAddress);
    }
  }, [phase, localDeck, opponent, onBattleReady]);

  const handleCreateLobby = () => {
    if (!address || !playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    createLobby(playerName.trim(), address);
  };

  const handleJoinLobby = async () => {
    if (!address || !playerName.trim() || !inviteCodeInput.trim()) {
      alert('Please enter your name and invite code');
      return;
    }
    console.log('🎮 Attempting to join lobby with code:', inviteCodeInput.trim());
    console.log('🎮 Code length:', inviteCodeInput.trim().length);
    await joinLobby(inviteCodeInput.trim(), playerName.trim(), address);
  };

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      alert('Invite code copied to clipboard!');
    }
  };

  const handleDeckSelected = (selectedCards: Card[]) => {
    console.log('🎴 Deck selected:', selectedCards.length, 'cards');
    setLocalDeck(selectedCards);
    setShowDeckSelection(false);
  };

  const handleDisconnect = () => {
    disconnect('User left lobby');
    if (onClose) {
      onClose();
    }
  };

  // Wallet not connected
  if (!isConnected) {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <h2 style={styles.title}>🌐 Multiplayer PVP</h2>
          <p style={styles.message}>
            Connect your wallet to play multiplayer battles!
          </p>
          <p style={styles.subMessage}>
            Your wallet address will be your unique ID in PVP battles.
          </p>
          {onClose && (
            <button style={styles.button} onClick={onClose}>
              ← Back to Menu
            </button>
          )}
        </div>
      </div>
    );
  }

  // Initializing peer connection
  if (phase === 'initializing') {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <h2 style={styles.title}>🌐 Connecting...</h2>
          <div style={styles.spinner}>⚔️</div>
          <p style={styles.message}>Establishing peer connection...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (phase === 'error') {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <h2 style={styles.titleError}>❌ Connection Error</h2>
          <p style={styles.errorMessage}>{error}</p>
          <div style={styles.buttonRow}>
            <button style={styles.button} onClick={resetLobby}>
              Try Again
            </button>
            {onClose && (
              <button style={styles.button} onClick={handleDisconnect}>
                ← Back to Menu
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Deck selection (after connection established)
  if (showDeckSelection || phase === 'deckSelection') {
    const nftCards = getNFTCards(address);
    return (
      <DeckSelection
        availableCards={nftCards}
        onConfirmSelection={handleDeckSelected}
        playerName={playerName}
        onClose={() => setShowDeckSelection(false)}
      />
    );
  }

  // Waiting for opponent's deck
  if (phase === 'connected' && localDeck && !opponent?.deck) {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <h2 style={styles.title}>⏳ Waiting for Opponent...</h2>
          <p style={styles.message}>
            {opponent?.name} is selecting their deck
          </p>
          <div style={styles.spinner}>🎴</div>
          <p style={styles.subMessage}>Your deck is ready ({localDeck.length} cards)</p>
          <button style={styles.buttonSecondary} onClick={handleDisconnect}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Connected, need to select deck
  if (phase === 'connected' && !localDeck) {
    const nftCards = getNFTCards(address);
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <h2 style={styles.title}>✅ Connected to {opponent?.name}!</h2>
          <p style={styles.message}>Select your deck to begin battle</p>
          <div style={styles.buttonRow}>
            <button style={styles.button} onClick={() => setShowDeckSelection(true)}>
              ⚔️ Select Deck ({nftCards.length} cards available)
            </button>
            <button style={styles.buttonSecondary} onClick={handleDisconnect}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for opponent to join
  if (phase === 'waiting') {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <h2 style={styles.title}>🎫 Lobby Created!</h2>
          <p style={styles.message}>Share this invite code with your opponent:</p>

          <div style={styles.inviteCodeBox}>
            <code style={styles.inviteCode}>{inviteCode}</code>
            <button style={styles.copyButton} onClick={handleCopyInviteCode}>
              📋 Copy
            </button>
          </div>

          <div style={styles.spinner}>⏳</div>
          <p style={styles.subMessage}>Waiting for opponent to join...</p>

          <button style={styles.buttonSecondary} onClick={handleDisconnect}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Main lobby menu (idle state)
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🌐 Multiplayer PVP 🌐</h1>
          {onClose && (
            <button style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <p style={styles.subtitle}>
          Battle with NFT cards against players around the world
        </p>

        <div style={styles.walletInfo}>
          <span style={styles.walletLabel}>Your Wallet:</span>
          <code style={styles.walletAddress}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </code>
        </div>

        {/* Name Input */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Your Name</label>
          <input
            type="text"
            placeholder="Enter your battle name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={styles.input}
            maxLength={20}
          />
        </div>

        {/* Create Game Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⚔️ Create Game</h2>
          <p style={styles.sectionText}>Generate an invite code to share with your opponent</p>
          <button
            style={styles.button}
            onClick={handleCreateLobby}
            disabled={!playerName.trim()}
          >
            🎫 Create Invite Code
          </button>
        </div>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerText}>OR</span>
        </div>

        {/* Join Game Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🎮 Join Game</h2>
          <p style={styles.sectionText}>Paste an invite code from your opponent</p>
          <input
            type="text"
            placeholder="Paste invite code here"
            value={inviteCodeInput}
            onChange={(e) => setInviteCodeInput(e.target.value)}
            style={styles.input}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          <button
            style={styles.button}
            onClick={handleJoinLobby}
            disabled={!playerName.trim() || !inviteCodeInput.trim()}
          >
            🚀 Join Game
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: TASERN_SPACING.xl,
  },
  container: {
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.3) 0%, rgba(26, 20, 16, 0.95) 100%)',
    border: `4px solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusLarge,
    padding: TASERN_SPACING['3xl'],
    maxWidth: '600px',
    width: '100%',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TASERN_SPACING.lg,
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
  },
  titleError: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    color: TASERN_COLORS.red,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.glowRed,
    marginBottom: TASERN_SPACING.lg,
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
  },
  subtitle: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    textAlign: 'center',
    marginBottom: TASERN_SPACING.xl,
    opacity: 0.9,
  },
  walletInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TASERN_SPACING.md,
    padding: TASERN_SPACING.md,
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: TASERN_BORDERS.radiusMedium,
    marginBottom: TASERN_SPACING.xl,
  },
  walletLabel: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.gold,
  },
  walletAddress: {
    fontFamily: 'monospace',
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    padding: `${TASERN_SPACING.xs} ${TASERN_SPACING.sm}`,
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: TASERN_BORDERS.radiusSmall,
  },
  inputGroup: {
    marginBottom: TASERN_SPACING.xl,
  },
  label: {
    display: 'block',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.gold,
    marginBottom: TASERN_SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    padding: TASERN_SPACING.md,
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    background: 'rgba(0, 0, 0, 0.5)',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.bronze}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    color: TASERN_COLORS.parchment,
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  section: {
    marginBottom: TASERN_SPACING.xl,
    padding: TASERN_SPACING.lg,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `1px solid ${TASERN_COLORS.bronze}`,
  },
  sectionTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.gold,
    marginBottom: TASERN_SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  sectionText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    marginBottom: TASERN_SPACING.md,
    opacity: 0.8,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: `${TASERN_SPACING.xl} 0`,
  },
  dividerText: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.stone,
    padding: `0 ${TASERN_SPACING.md}`,
    background: `linear-gradient(135deg, rgba(139, 105, 20, 0.3) 0%, rgba(26, 20, 16, 0.95) 100%)`,
  },
  button: {
    width: '100%',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    fontWeight: TASERN_TYPOGRAPHY.weightBold,
    padding: TASERN_SPACING.lg,
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    color: TASERN_COLORS.parchment,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.3s ease',
    boxShadow: TASERN_SHADOWS.glowGold,
    marginTop: TASERN_SPACING.md,
  },
  buttonSecondary: {
    width: '100%',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    padding: TASERN_SPACING.md,
    background: 'transparent',
    border: `${TASERN_BORDERS.widthMedium} solid ${TASERN_COLORS.stone}`,
    borderRadius: TASERN_BORDERS.radiusMedium,
    color: TASERN_COLORS.stone,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: TASERN_SPACING.md,
  },
  buttonRow: {
    display: 'flex',
    gap: TASERN_SPACING.md,
    marginTop: TASERN_SPACING.lg,
  },
  inviteCodeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: TASERN_SPACING.md,
    padding: TASERN_SPACING.lg,
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `${TASERN_BORDERS.widthThick} solid ${TASERN_COLORS.gold}`,
    marginBottom: TASERN_SPACING.lg,
  },
  inviteCode: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.gold,
    wordBreak: 'break-all',
    textShadow: TASERN_SHADOWS.glowGold,
  },
  copyButton: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    padding: `${TASERN_SPACING.sm} ${TASERN_SPACING.md}`,
    background: TASERN_COLORS.bronze,
    border: `2px solid ${TASERN_COLORS.gold}`,
    borderRadius: TASERN_BORDERS.radiusSmall,
    color: TASERN_COLORS.parchment,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  message: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.parchment,
    textAlign: 'center',
    marginBottom: TASERN_SPACING.lg,
  },
  subMessage: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    textAlign: 'center',
    marginBottom: TASERN_SPACING.md,
    opacity: 0.7,
  },
  errorMessage: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.red,
    textAlign: 'center',
    marginBottom: TASERN_SPACING.lg,
    padding: TASERN_SPACING.md,
    background: 'rgba(139, 0, 0, 0.2)',
    borderRadius: TASERN_BORDERS.radiusMedium,
    border: `2px solid ${TASERN_COLORS.red}`,
  },
  spinner: {
    fontSize: '48px',
    textAlign: 'center',
    animation: 'spin 2s linear infinite',
    marginBottom: TASERN_SPACING.md,
  },
};
