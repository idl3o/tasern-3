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
import type { BattleState, BattleAction, Player, VictoryResult } from '../types/core';
import { BattleEngine } from '../core/BattleEngine';

interface BattleStore {
  // State
  battleState: BattleState | null;
  isProcessing: boolean;
  error: string | null;

  // Actions
  initializeBattle: (player1: Player, player2: Player) => void;
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

    // Initialize a new battle
    initializeBattle: (player1: Player, player2: Player) => {
      console.log('🎮 Initializing battle in store');

      try {
        const newState = BattleEngine.initializeBattle(player1, player2);

        // Initialize hands for human players
        const updatedPlayers = { ...newState.players };
        Object.values(updatedPlayers).forEach((player) => {
          if (player.type === 'human') {
            console.log('👤 Initializing hand for human player:', player.name);
            // Call strategy to populate hand
            player.strategy.onTurnStart?.(player, newState);
          }
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

      try {
        console.log('⏭️ Ending turn in store');

        const newState = BattleEngine.endTurn(currentState);

        set((state) => {
          state.battleState = newState;
          state.error = null;
        });

        // If next player is AI, trigger their turn
        const nextPlayer = newState.players[newState.activePlayerId];
        if (nextPlayer.type === 'ai') {
          console.log('🤖 AI turn starting...');

          // Small delay for better UX
          setTimeout(async () => {
            try {
              const action = await nextPlayer.strategy.selectAction(nextPlayer, newState);
              get().executeAction(action);
            } catch (error) {
              console.error('❌ AI failed to select action:', error);
              // AI failed, end turn
              get().endTurn();
            }
          }, 500);
        }
      } catch (error) {
        console.error('❌ Failed to end turn:', error);
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to end turn';
        });
      }
    },

    // Process AI turn (for AI vs AI battles)
    processAITurn: async () => {
      const currentState = get().battleState;

      if (!currentState) {
        console.error('❌ No battle state');
        return;
      }

      const activePlayer = currentState.players[currentState.activePlayerId];

      if (activePlayer.type !== 'ai') {
        console.warn('⚠️ Active player is not AI');
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
