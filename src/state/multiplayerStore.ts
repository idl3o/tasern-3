/**
 * Multiplayer Store - Lobby & Matchmaking State
 *
 * Manages PVP lobby flow: creating/joining games, deck selection, connection state.
 * Uses Zustand with Immer for immutable state updates (matches project patterns).
 *
 * Philosophy: Multiplayer is just another way to get two players into a battle.
 * The battle engine doesn't care if it's local, AI, or remote.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MultiplayerService } from '../services/MultiplayerService';
import type { Card } from '../types/core';

// ============================================================================
// TYPES
// ============================================================================

export type LobbyPhase =
  | 'idle'           // Not in lobby
  | 'initializing'   // Setting up peer connection
  | 'creating'       // Creating invite code
  | 'waiting'        // Waiting for opponent to join
  | 'joining'        // Joining opponent's game
  | 'connected'      // Opponent connected, selecting decks
  | 'deckSelection'  // Choosing cards for battle
  | 'ready'          // Both players ready, starting battle
  | 'error';         // Something went wrong

interface OpponentInfo {
  name: string;
  walletAddress: string;
  deck: Card[] | null;
  isReady: boolean;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface MultiplayerStore {
  // Connection state
  isInitialized: boolean;
  peerId: string | null;
  service: MultiplayerService | null;

  // Lobby state
  phase: LobbyPhase;
  inviteCode: string | null;
  isHost: boolean; // Host created the lobby, guest joined

  // Player info
  localPlayerName: string | null;
  localPlayerWallet: string | null;
  localDeck: Card[] | null;

  // Opponent info
  opponent: OpponentInfo | null;

  // Battle state
  firstPlayerId: 'host' | 'guest' | null; // Who goes first (randomized)

  // Error handling
  error: string | null;

  // Actions
  initialize: (walletAddress: string) => Promise<void>;
  createLobby: (playerName: string, walletAddress: string) => void;
  joinLobby: (inviteCode: string, playerName: string, walletAddress: string) => Promise<void>;
  setLocalDeck: (deck: Card[]) => void;
  startBattle: () => void;
  disconnect: (reason?: string) => void;
  resetLobby: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useMultiplayerStore = create<MultiplayerStore>()(
  immer((set, get) => ({
    // Initial state
    isInitialized: false,
    peerId: null,
    service: null,
    phase: 'idle',
    inviteCode: null,
    isHost: false,
    localPlayerName: null,
    localPlayerWallet: null,
    localDeck: null,
    opponent: null,
    firstPlayerId: null,
    error: null,

    // Initialize multiplayer service
    initialize: async (walletAddress: string) => {
      const existingService = get().service;

      if (existingService) {
        console.log('🌐 Multiplayer already initialized');
        return;
      }

      set((state) => {
        state.phase = 'initializing';
        state.error = null;
      });

      try {
        const service = new MultiplayerService();
        const peerId = await service.initialize(walletAddress);

        // Setup event listeners
        setupEventListeners(service, set, get);

        set((state) => {
          state.service = service;
          state.peerId = peerId;
          state.isInitialized = true;
          state.localPlayerWallet = walletAddress;
          state.phase = 'idle';
        });

        console.log('✅ Multiplayer initialized:', peerId);
      } catch (error) {
        console.error('❌ Failed to initialize multiplayer:', error);
        set((state) => {
          state.phase = 'error';
          state.error = error instanceof Error ? error.message : 'Failed to initialize';
        });
      }
    },

    // Create lobby and generate invite code
    createLobby: (playerName: string, walletAddress: string) => {
      const service = get().service;

      if (!service) {
        console.error('❌ Service not initialized');
        return;
      }

      set((state) => {
        state.phase = 'creating';
      });

      try {
        const inviteCode = service.createInvite(playerName, walletAddress);

        set((state) => {
          state.inviteCode = inviteCode;
          state.isHost = true;
          state.localPlayerName = playerName;
          state.localPlayerWallet = walletAddress;
          state.phase = 'waiting';
        });

        console.log('🎮 Lobby created! Invite code:', inviteCode);
      } catch (error) {
        console.error('❌ Failed to create lobby:', error);
        set((state) => {
          state.phase = 'error';
          state.error = error instanceof Error ? error.message : 'Failed to create lobby';
        });
      }
    },

    // Join lobby via invite code
    joinLobby: async (inviteCode: string, playerName: string, walletAddress: string) => {
      const service = get().service;

      if (!service) {
        console.error('❌ Service not initialized');
        return;
      }

      set((state) => {
        state.phase = 'joining';
        state.error = null;
      });

      try {
        const inviteData = await service.joinGame(inviteCode);

        set((state) => {
          state.isHost = false;
          state.localPlayerName = playerName;
          state.localPlayerWallet = walletAddress;
          state.opponent = {
            name: inviteData.playerName,
            walletAddress: inviteData.walletAddress,
            deck: null,
            isReady: false
          };
          state.phase = 'connected';
        });

        // Send acceptance message to host
        service.send({
          type: 'ACCEPT',
          playerName,
          walletAddress,
          deck: [] // Will be set during deck selection
        });

        console.log('✅ Joined lobby successfully');
      } catch (error) {
        console.error('❌ Failed to join lobby:', error);
        set((state) => {
          state.phase = 'error';
          state.error = error instanceof Error ? error.message : 'Failed to join lobby';
        });
      }
    },

    // Set local player's deck (ready to battle)
    setLocalDeck: (deck: Card[]) => {
      const service = get().service;

      if (!service) {
        console.error('❌ Service not initialized');
        return;
      }

      set((state) => {
        state.localDeck = deck;
      });

      // Notify opponent
      service.send({
        type: 'DECK_SELECTED',
        deck
      });

      console.log('🎴 Deck selected:', deck.length, 'cards');

      // Check if both players ready
      const opponent = get().opponent;
      if (opponent?.deck) {
        set((state) => {
          state.phase = 'ready';
        });
      }
    },

    // Start battle (both players ready)
    startBattle: () => {
      const { isHost, service, localDeck, opponent } = get();

      if (!service || !localDeck || !opponent?.deck) {
        console.error('❌ Cannot start battle - missing decks');
        return;
      }

      // Only host sends battle start signal (and determines turn order)
      if (isHost) {
        // Randomize who goes first (50/50 coin flip)
        const firstPlayerId: 'host' | 'guest' = Math.random() < 0.5 ? 'host' : 'guest';

        console.log(`🎲 Turn order randomized: ${firstPlayerId} goes first!`);

        // Store locally
        set((state) => {
          state.firstPlayerId = firstPlayerId;
        });

        // Notify guest
        service.send({
          type: 'BATTLE_START',
          hostDeck: localDeck,
          guestDeck: opponent.deck,
          firstPlayerId
        });
      }

      console.log('🎮 Starting battle!');
    },

    // Disconnect from multiplayer
    disconnect: (reason?: string) => {
      const service = get().service;

      if (service) {
        service.disconnect(reason);
      }

      set((state) => {
        state.service = null;
        state.isInitialized = false;
        state.phase = 'idle';
        state.inviteCode = null;
        state.isHost = false;
        state.localPlayerName = null;
        state.localDeck = null;
        state.opponent = null;
        state.firstPlayerId = null;
        state.error = null;
      });

      console.log('🔌 Disconnected from multiplayer');
    },

    // Reset lobby (stay connected, but return to idle)
    resetLobby: () => {
      set((state) => {
        state.phase = 'idle';
        state.inviteCode = null;
        state.isHost = false;
        state.localPlayerName = null;
        state.localDeck = null;
        state.opponent = null;
        state.firstPlayerId = null;
        state.error = null;
      });

      console.log('🔄 Lobby reset');
    }
  }))
);

// ============================================================================
// EVENT LISTENERS SETUP
// ============================================================================

function setupEventListeners(
  service: MultiplayerService,
  set: any,
  get: () => MultiplayerStore
) {
  // Opponent connected
  service.on('connected', ({ peerId }: { peerId: string }) => {
    console.log('✅ Opponent connected:', peerId);

    set((state: MultiplayerStore) => {
      state.phase = 'connected';
    });
  });

  // Opponent accepted invite (host receives this)
  service.on('opponentAccepted', (data: { playerName: string; walletAddress: string; deck: Card[] }) => {
    console.log('✅ Opponent accepted:', data.playerName);

    set((state: MultiplayerStore) => {
      state.opponent = {
        name: data.playerName,
        walletAddress: data.walletAddress,
        deck: data.deck.length > 0 ? data.deck : null,
        isReady: data.deck.length > 0
      };
      state.phase = 'connected';
    });
  });

  // Opponent selected deck
  service.on('deckSelected', ({ deck }: { deck: Card[] }) => {
    console.log('🎴 Opponent selected deck:', deck.length, 'cards');

    set((state: MultiplayerStore) => {
      if (state.opponent) {
        state.opponent.deck = deck;
        state.opponent.isReady = true;
      }

      // If local player also ready, transition to ready phase
      if (state.localDeck) {
        state.phase = 'ready';
      }
    });
  });

  // Battle starting
  service.on('battleStart', ({ hostDeck, guestDeck, firstPlayerId }: { hostDeck: Card[]; guestDeck: Card[]; firstPlayerId: 'host' | 'guest' }) => {
    console.log('🎮 Battle starting! Host:', hostDeck.length, 'Guest:', guestDeck.length);
    console.log(`🎲 ${firstPlayerId} goes first!`);

    set((state: MultiplayerStore) => {
      state.firstPlayerId = firstPlayerId;
      state.phase = 'ready';
    });
  });

  // Opponent disconnected
  service.on('opponentDisconnected', ({ reason }: { reason?: string }) => {
    console.warn('⚠️ Opponent disconnected:', reason);

    set((state: MultiplayerStore) => {
      state.phase = 'error';
      state.error = `Opponent disconnected${reason ? `: ${reason}` : ''}`;
    });
  });

  // Connection error
  service.on('error', ({ error }: { error: Error }) => {
    console.error('❌ Connection error:', error);

    set((state: MultiplayerStore) => {
      state.phase = 'error';
      state.error = error.message;
    });
  });

  // Reconnect failed
  service.on('reconnectFailed', () => {
    console.error('❌ Reconnect failed');

    set((state: MultiplayerStore) => {
      state.phase = 'error';
      state.error = 'Lost connection to signaling server';
    });
  });
}

// ============================================================================
// SELECTORS (for optimized component subscriptions)
// ============================================================================

export const selectPhase = (state: MultiplayerStore) => state.phase;
export const selectIsInitialized = (state: MultiplayerStore) => state.isInitialized;
export const selectInviteCode = (state: MultiplayerStore) => state.inviteCode;
export const selectIsHost = (state: MultiplayerStore) => state.isHost;
export const selectOpponent = (state: MultiplayerStore) => state.opponent;
export const selectLocalDeck = (state: MultiplayerStore) => state.localDeck;
export const selectFirstPlayerId = (state: MultiplayerStore) => state.firstPlayerId;
export const selectError = (state: MultiplayerStore) => state.error;
export const selectService = (state: MultiplayerStore) => state.service;
