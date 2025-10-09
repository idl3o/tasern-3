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
   * Generate initial deck for selection
   * NFT cards are added ON TOP of 15 generated cards
   * Total: All NFT cards + 15 generated = full selection pool
   */
  generateInitialDeck(player: Player, state: BattleState, nftCards: Card[] = []): Card[] {
    console.log(`👤 Generating deck for human player (${nftCards.length} NFT cards + 15 generated cards)`);

    // Start with all available NFT cards
    const deck: Card[] = [...nftCards];

    // Always generate 15 additional cards (regardless of NFT count)
    console.log(`🎲 Generating 15 additional cards`);
    const generatedCards = this.cardGenerator.generateStrategicCards(
      state,
      player,
      'ADAPTIVE',
      15
    );
    deck.push(...generatedCards);

    console.log(`✅ Deck ready: ${nftCards.length} NFT + 15 generated = ${deck.length} total cards to choose from`);
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
