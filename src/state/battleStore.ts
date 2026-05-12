/**
 * Battle Store - Single Source of Truth
 *
 * Uses Zustand for state management with Immer for immutability.
 * All game state lives here. React components subscribe to this store.
 *
 * Philosophy: UI state is separate from game state.
 * Game state is managed here. UI state lives in React components.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { BattleState, BattleAction, Player, VictoryResult, GridConfig, CompleteMapPreset } from '../types/core';
import { BattleEngine } from '../core/BattleEngine';
import type { MultiplayerService } from '../services/MultiplayerService';

interface BattleStore {
  // State
  battleState: BattleState | null;
  isProcessing: boolean;
  error: string | null;

  // Multiplayer state
  isMultiplayer: boolean;
  multiplayerService: MultiplayerService | null;
  localPlayerId: string | null;

  // Actions
  initializeBattle: (player1: Player, player2: Player, config?: GridConfig | CompleteMapPreset) => void;
  initializeMultiplayerBattle: (
    localPlayer: Player,
    remotePlayer: Player,
    service: MultiplayerService,
    localWalletAddress: string,
    config?: GridConfig | CompleteMapPreset
  ) => void;
  executeAction: (action: BattleAction) => void;
  endTurn: () => void;
  processAITurn: () => Promise<void>;
  checkVictory: () => VictoryResult | null;
  resetBattle: () => void;

  // Getters (computed values)
  getActivePlayer: () => Player | null;
  getPlayer: (playerId: string) => Player | null;
  getBattleLog: () => string[];
}

export const useBattleStore = create<BattleStore>()(
  immer((set, get) => ({
    // Initial state
    battleState: null,
    isProcessing: false,
    error: null,
    isMultiplayer: false,
    multiplayerService: null,
    localPlayerId: null,

    // Initialize a new battle (local or vs AI)
    initializeBattle: (player1: Player, player2: Player, config?: GridConfig | CompleteMapPreset) => {
      console.log('🎮 Initializing battle in store');

      try {
        const newState = BattleEngine.initializeBattle(player1, player2, config);

        // Initialize each player via their strategy
        const updatedPlayers = { ...newState.players };
        Object.values(updatedPlayers).forEach((player) => {
          player.strategy.onTurnStart?.(player, newState);
        });

        set((state) => {
          state.battleState = {
            ...newState,
            players: updatedPlayers,
          };
          state.error = null;
        });

        console.log('✅ Battle initialized');
      } catch (error) {
        console.error('❌ Failed to initialize battle:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to initialize battle';
        });
      }
    },

    // Initialize a multiplayer PVP battle
    initializeMultiplayerBattle: (
      localPlayer: Player,
      remotePlayer: Player,
      service: MultiplayerService,
      localWalletAddress: string,
      config?: GridConfig | CompleteMapPreset
    ) => {
      console.log('🌐 Initializing multiplayer battle');
      console.log('   Local wallet:', localWalletAddress);
      console.log('   Player 1 (first turn):', localPlayer.id);
      console.log('   Player 2:', remotePlayer.id);

      try {
        const newState = BattleEngine.initializeBattle(localPlayer, remotePlayer, config);

        // Initialize each player via their strategy
        const updatedPlayers = { ...newState.players };
        Object.values(updatedPlayers).forEach((player) => {
          player.strategy.onTurnStart?.(player, newState);
        });

        // Use deterministic player ID based on wallet address
        const localPlayerDeterministicId = `player-${localWalletAddress}`;

        set((state) => {
          state.battleState = {
            ...newState,
            players: updatedPlayers,
          };
          state.isMultiplayer = true;
          state.multiplayerService = service;
          state.localPlayerId = localPlayerDeterministicId; // Use deterministic ID
          state.error = null;
        });

        console.log(`✅ Multiplayer battle initialized - localPlayerId set to: ${localPlayerDeterministicId}`);

        // Setup listener for remote player actions
        service.on('action', (data: { action: BattleAction }) => {
          console.log('🔔 ========================================');
          console.log('📨 RECEIVED OPPONENT ACTION');
          console.log('   Action type:', data.action.type);
          console.log('   Action from playerId:', data.action.playerId);
          console.log('   Current activePlayerId:', get().battleState?.activePlayerId);
          console.log('   Local playerId:', get().localPlayerId);
          console.log('   Is processing:', get().isProcessing);
          console.log('   Full action:', JSON.stringify(data.action, null, 2));
          console.log('🔔 ========================================');
          get().executeAction(data.action);
        });

        console.log('✅ Multiplayer battle initialized');
      } catch (error) {
        console.error('❌ Failed to initialize multiplayer battle:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to initialize multiplayer battle';
        });
      }
    },

    // Execute a battle action
    executeAction: (action: BattleAction) => {
      const currentState = get().battleState;

      if (!currentState) {
        console.error('❌ No battle state');
        return;
      }

      if (get().isProcessing) {
        console.warn('⚠️ Already processing an action');
        return;
      }

      const { isMultiplayer, multiplayerService, localPlayerId } = get();

      // If this is a local action in multiplayer, broadcast to opponent
      // Note: END_TURN is already broadcast in endTurn(), so skip it here to avoid double-broadcasting
      if (isMultiplayer && action.playerId === localPlayerId && multiplayerService && action.type !== 'END_TURN') {
        console.log('📡 ========================================');
        console.log('📤 BROADCASTING ACTION TO OPPONENT');
        console.log('   Action type:', action.type);
        console.log('   From playerId:', action.playerId);
        console.log('   Local playerId:', localPlayerId);
        console.log('   Full action:', JSON.stringify(action, null, 2));
        console.log('📡 ========================================');
        multiplayerService.send({
          type: 'ACTION',
          action
        });
      }

      set((state) => {
        state.isProcessing = true;
      });

      try {
        console.log('⚡ Executing action in store:', action.type);
        console.log('📍 Active player before action:', currentState.activePlayerId);

        const newState = BattleEngine.executeAction(currentState, action);

        console.log('📍 Active player after action:', newState.activePlayerId);

        // Verify active player hasn't changed for attack actions
        if ((action.type === 'ATTACK_CARD' || action.type === 'ATTACK_CASTLE') &&
            currentState.activePlayerId !== newState.activePlayerId) {
          console.error('🚨 BUG DETECTED: Active player changed during attack!');
          console.error('   Before:', currentState.activePlayerId);
          console.error('   After:', newState.activePlayerId);
        }

        set((state) => {
          state.battleState = newState;
          state.isProcessing = false;
          state.error = null;
        });

        // Check for victory after each action
        const victory = BattleEngine.checkVictoryConditions(newState);
        if (victory) {
          console.log('🏆 Victory detected!');
          set((state) => {
            if (state.battleState) {
              state.battleState.winner = victory.winnerId;
              state.battleState.phase = 'victory';
            }
          });
        }
      } catch (error) {
        console.error('❌ Failed to execute action:', error);
        set((state) => {
          state.isProcessing = false;
          state.error = error instanceof Error ? error.message : 'Failed to execute action';
        });
      }
    },

    // End the current turn
    endTurn: () => {
      const currentState = get().battleState;

      if (!currentState) {
        console.error('❌ No battle state');
        return;
      }

      const { isMultiplayer, multiplayerService, localPlayerId } = get();

      // In multiplayer, broadcast END_TURN action to opponent
      if (isMultiplayer && multiplayerService && currentState.activePlayerId === localPlayerId) {
        console.log('📤 Broadcasting END_TURN to opponent');
        multiplayerService.send({
          type: 'ACTION',
          action: {
            type: 'END_TURN',
            playerId: localPlayerId
          }
        });
      }

      try {
        console.log('⏭️ Ending turn in store');

        const newState = BattleEngine.endTurn(currentState);

        set((state) => {
          state.battleState = newState;
          state.error = null;
        });

        // If next player is auto-driven (e.g. AI), drive their turn locally
        const nextPlayer = newState.players[newState.activePlayerId];
        if (nextPlayer.strategy.autoDriven) {
          console.log('🤖 Auto-driven turn starting...');

          // Action loop - keep taking actions until END_TURN
          const processAutoActions = async () => {
            let currentState = get().battleState;
            if (!currentState) return;

            const player = currentState.players[currentState.activePlayerId];
            if (!player.strategy.autoDriven) return;

            try {
              // Keep selecting and executing actions until AI decides to end turn
              while (true) {
                const action = await player.strategy.selectAction(player, currentState);

                if (action.type === 'END_TURN') {
                  // AI wants to end turn
                  get().endTurn();
                  break;
                }

                // Execute the action
                get().executeAction(action);

                // Small delay between actions for better UX
                await new Promise(resolve => setTimeout(resolve, 800));

                // Get updated state after action
                currentState = get().battleState;
                if (!currentState || currentState.winner) {
                  // Game ended
                  break;
                }

                // Verify it's still AI's turn (shouldn't change, but safety check)
                if (currentState.activePlayerId !== player.id) {
                  console.warn('⚠️ Active player changed unexpectedly');
                  break;
                }
              }
            } catch (error) {
              console.error('❌ Auto-driven strategy failed to select action:', error);
              // Strategy failed, end turn
              get().endTurn();
            }
          };

          // Start action loop with initial delay
          setTimeout(processAutoActions, 500);
        }
      } catch (error) {
        console.error('❌ Failed to end turn:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to end turn';
        });
      }
    },

    // Process auto-driven turn (e.g. AI vs AI battles)
    processAITurn: async () => {
      const currentState = get().battleState;

      if (!currentState) {
        console.error('❌ No battle state');
        return;
      }

      const activePlayer = currentState.players[currentState.activePlayerId];

      if (!activePlayer.strategy.autoDriven) {
        console.warn('⚠️ Active player is not auto-driven');
        return;
      }

      if (get().isProcessing) {
        console.warn('⚠️ Already processing');
        return;
      }

      set((state) => {
        state.isProcessing = true;
      });

      try {
        console.log('🤖 Processing AI turn:', activePlayer.name);
        const action = await activePlayer.strategy.selectAction(activePlayer, currentState);

        set((state) => {
          state.isProcessing = false;
        });

        get().executeAction(action);

        // Auto-end turn after AI action
        setTimeout(() => {
          get().endTurn();
        }, 1000);
      } catch (error) {
        console.error('❌ AI failed to process turn:', error);
        set((state) => {
          state.isProcessing = false;
          state.error = error instanceof Error ? error.message : 'AI turn failed';
        });
        // Skip turn on error
        get().endTurn();
      }
    },

    // Check victory conditions
    checkVictory: () => {
      const currentState = get().battleState;

      if (!currentState) {
        return null;
      }

      return BattleEngine.checkVictoryConditions(currentState);
    },

    // Reset battle
    resetBattle: () => {
      console.log('🔄 Resetting battle');

      set((state) => {
        state.battleState = null;
        state.isProcessing = false;
        state.error = null;
        state.isMultiplayer = false;
        state.multiplayerService = null;
        state.localPlayerId = null;
      });
    },

    // Getters
    getActivePlayer: () => {
      const state = get().battleState;
      if (!state) return null;
      return state.players[state.activePlayerId] || null;
    },

    getPlayer: (playerId: string) => {
      const state = get().battleState;
      if (!state) return null;
      return state.players[playerId] || null;
    },

    getBattleLog: () => {
      const state = get().battleState;
      if (!state) return [];
      return state.battleLog.map((entry) => {
        const player = state.players[entry.playerId];
        const playerName = player ? player.name : entry.playerId;
        return `[Turn ${entry.turn}] ${playerName}: ${entry.result}`;
      });
    },
  }))
);

/**
 * Selectors for optimized component subscriptions
 * Components should use these to avoid unnecessary re-renders
 */

export const selectBattleState = (state: BattleStore) => state.battleState;
export const selectActivePlayer = (state: BattleStore) => state.getActivePlayer();
export const selectIsProcessing = (state: BattleStore) => state.isProcessing;
export const selectError = (state: BattleStore) => state.error;
export const selectBattlefield = (state: BattleStore) => state.battleState?.battlefield;
export const selectCurrentTurn = (state: BattleStore) => state.battleState?.currentTurn;
export const selectPhase = (state: BattleStore) => state.battleState?.phase;
export const selectWinner = (state: BattleStore) => state.battleState?.winner;
export const selectBattleLog = (state: BattleStore) => state.getBattleLog();
export const selectLocalPlayerId = (state: BattleStore) => state.localPlayerId;
export const selectIsMultiplayer = (state: BattleStore) => state.isMultiplayer;
