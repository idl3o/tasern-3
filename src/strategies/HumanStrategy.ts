/**
 * Human Player Strategy
 *
 * Waits for user input from UI. Cards come from hand generated at start.
 */

import type { Player, BattleState, BattleAction, Card, PlayerStrategy } from '../types/core';
import { CardGenerator } from '../ai/CardGenerator';

export class HumanStrategy implements PlayerStrategy {
  private cardGenerator = new CardGenerator();

  getAvailableCards(player: Player, state: BattleState): Card[] {
    // Return current hand
    return player.hand;
  }

  /**
   * Generate initial deck of 15 cards for selection
   */
  generateInitialDeck(player: Player, state: BattleState): Card[] {
    console.log('👤 Generating initial deck for human player (15 cards)');
    // Generate 15 balanced cards for human player to choose from
    const deck = this.cardGenerator.generateStrategicCards(
      state,
      player,
      'ADAPTIVE',
      15
    );
    return deck;
  }

  async selectAction(player: Player, state: BattleState): Promise<BattleAction> {
    // For human players, action selection happens via UI
    // This method won't be called directly - UI dispatches actions
    throw new Error('Human players select actions via UI, not programmatically');
  }

  onTurnStart(player: Player, state: BattleState): void {
    console.log(`👤 ${player.name}'s turn begins`);
    // Ensure hand is populated
    this.getAvailableCards(player, state);
  }

  onTurnEnd(player: Player, state: BattleState): void {
    console.log(`👤 ${player.name} ends turn`);
    // Any cleanup for human player
  }
}
