/**
 * Create New Game
 *
 * Initialize game state with two players
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { BattleEngine } from '../../src/core/BattleEngine';
import { PlayerFactory } from '../../src/core/PlayerFactory';
import type { BattleState } from '../../src/types/core';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { player1Id, player2Id, player1Deck, player2Deck } = req.body;

    if (!player1Id || !player2Id || !player1Deck || !player2Deck) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch player data
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', [player1Id, player2Id]);

    if (!users || users.length !== 2) {
      return res.status(404).json({ error: 'Players not found' });
    }

    const [user1, user2] = users;

    // Create players with decks
    const player1 = PlayerFactory.createHuman(user1.username);
    player1.id = user1.id;
    player1.hand = player1Deck.slice(0, 5);
    player1.deck = player1Deck.slice(5);
    player1.lpBonus = user1.lp_balance * 0.05; // 0.01 LP = +5%

    const player2 = PlayerFactory.createHuman(user2.username);
    player2.id = user2.id;
    player2.hand = player2Deck.slice(0, 5);
    player2.deck = player2Deck.slice(5);
    player2.lpBonus = user2.lp_balance * 0.05;

    // Initialize battle
    const battleEngine = new BattleEngine();
    const initialState = battleEngine.initializeBattle(player1, player2);

    // Create game in database
    const { data: game, error: createError } = await supabase
      .from('games')
      .insert({
        player1_id: player1Id,
        player2_id: player2Id,
        state: initialState,
        status: 'active',
        winner_id: null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Game creation error:', createError);
      return res.status(500).json({ error: 'Failed to create game' });
    }

    return res.status(200).json({ game });
  } catch (error) {
    console.error('Create game error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
