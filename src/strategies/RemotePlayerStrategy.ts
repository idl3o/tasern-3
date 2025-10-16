/**
 * Remote Player Strategy
 *
 * Represents a human player on another device.
 * Actions arrive via WebRTC DataChannel from opponent's browser.
 *
 * CRITICAL: This follows the strategy pattern - NEVER check player.type.
 * Remote players are functionally identical to local humans from the game engine's perspective.
 *
 * Philosophy: The network is just another input source, like mouse/keyboard.
 */

import type { Player, BattleState, BattleAction, Card, PlayerStrategy } from '../types/core';
import { MultiplayerService } from '../services/MultiplayerService';

export class RemotePlayerStrategy implements PlayerStrategy {
  private multiplayerService: MultiplayerService;
  private pendingActionResolve?: (action: BattleAction) => void;
  private pendingActionReject?: (error: Error) => void;
  private actionTimeout: NodeJS.Timeout | null = null;

  constructor(multiplayerService: MultiplayerService) {
    this.multiplayerService = multiplayerService;

    // Listen for actions from remote player
    this.multiplayerService.on('action', (data: { action: BattleAction }) => {
      console.log('🌐 Received action from remote player:', data.action.type);
      this.resolveAction(data.action);
    });

    // Handle disconnection during action wait
    this.multiplayerService.on('opponentDisconnected', () => {
      console.warn('⚠️ Opponent disconnected during turn');
      this.rejectAction(new Error('Opponent disconnected'));
    });
  }

  /**
   * Get available cards for remote player
   * Remote player's hand is synced via game state
   */
  getAvailableCards(player: Player, state: BattleState): Card[] {
    return player.hand;
  }

  /**
   * Wait for action from remote player
   * This is called by the battle engine when it's the remote player's turn
   */
  async selectAction(player: Player, state: BattleState): Promise<BattleAction> {
    console.log('🌐 Waiting for remote player action...');

    // Notify remote player it's their turn
    this.multiplayerService.send({
      type: 'TURN_START',
      playerId: player.id,
      state: state
    });

    return new Promise((resolve, reject) => {
      this.pendingActionResolve = resolve;
      this.pendingActionReject = reject;

      // Timeout after 60 seconds (prevent infinite wait)
      this.actionTimeout = setTimeout(() => {
        console.error('❌ Remote player action timeout');
        this.rejectAction(new Error('Remote player action timeout (60s)'));
      }, 60000);
    });
  }

  /**
   * Resolve pending action promise
   */
  private resolveAction(action: BattleAction) {
    if (this.pendingActionResolve) {
      this.clearActionTimeout();
      this.pendingActionResolve(action);
      this.pendingActionResolve = undefined;
      this.pendingActionReject = undefined;
    }
  }

  /**
   * Reject pending action promise
   */
  private rejectAction(error: Error) {
    if (this.pendingActionReject) {
      this.clearActionTimeout();
      this.pendingActionReject(error);
      this.pendingActionResolve = undefined;
      this.pendingActionReject = undefined;
    }
  }

  /**
   * Clear action timeout
   */
  private clearActionTimeout() {
    if (this.actionTimeout) {
      clearTimeout(this.actionTimeout);
      this.actionTimeout = null;
    }
  }

  /**
   * Called when turn starts
   * Notify remote player via WebRTC
   */
  onTurnStart(player: Player, state: BattleState): void {
    console.log(`🌐 ${player.name}'s turn begins (remote)`);

    // Send turn notification (already done in selectAction, but keep for consistency)
    this.multiplayerService.send({
      type: 'TURN_START',
      playerId: player.id,
      state: state
    });
  }

  /**
   * Called when turn ends
   */
  onTurnEnd(player: Player, state: BattleState): void {
    console.log(`🌐 ${player.name} ends turn (remote)`);

    // Clear any pending action (shouldn't happen, but safety)
    if (this.pendingActionResolve) {
      console.warn('⚠️ Turn ended with pending action');
      this.rejectAction(new Error('Turn ended'));
    }
  }

  /**
   * Cleanup method for when player disconnects
   */
  cleanup() {
    this.clearActionTimeout();

    if (this.pendingActionReject) {
      this.rejectAction(new Error('Strategy cleanup'));
    }
  }
}
