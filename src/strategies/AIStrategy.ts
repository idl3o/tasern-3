/**
 * AI Player Strategy
 *
 * Uses ConsciousnessAI to make decisions. Cards are generated dynamically.
 * This is just the strategy interface adapter - the real magic is in ConsciousnessAI.
 */

import type { Player, BattleState, BattleAction, Card, PlayerStrategy } from '../types/core';
import { ConsciousnessAI } from '../ai/ConsciousnessAI';

export class AIStrategy implements PlayerStrategy {
  private consciousness: ConsciousnessAI;

  constructor() {
    this.consciousness = new ConsciousnessAI();
  }

  getAvailableCards(player: Player, state: BattleState): Card[] {
    // AI players generate cards dynamically, they don't have a hand
    // This method is here for interface compatibility
    return [];
  }

  async selectAction(player: Player, state: BattleState): Promise<BattleAction> {
    // Delegate to ConsciousnessAI for the real decision-making
    return this.consciousness.selectAction(player, state);
  }

  onTurnStart(player: Player, state: BattleState): void {
    console.log(`🤖 ${player.name} (AI) begins turn`);
    this.consciousness.onTurnStart(player, state);
  }

  onTurnEnd(player: Player, state: BattleState): void {
    console.log(`🤖 ${player.name} (AI) ends turn`);
    this.consciousness.onTurnEnd(player, state);
  }
}
