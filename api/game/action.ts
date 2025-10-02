/**
 * Execute Game Action
 *
 * Server-authoritative game logic (prevents cheating)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';
import { BattleEngine } from '../../src/core/BattleEngine';
import type { BattleAction, BattleState } from '../../src/types/core';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameId, playerId, action } = req.body as {
      gameId: string;
      playerId: string;
      action: BattleAction;
    };

    if (!gameId || !playerId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch current game state
    const { data: game, error: fetchError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (fetchError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    const currentState = game.state as BattleState;

    // Validate it's player's turn
    if (currentState.activePlayerId !== playerId) {
      return res.status(403).json({ error: 'Not your turn' });
    }

    // Execute action using BattleEngine
    const battleEngine = new BattleEngine();
    const newState = battleEngine.executeAction(currentState, action);

    // Check for victory
    const winner = battleEngine.checkVictoryConditions(newState);
    const isGameOver = winner !== null;

    // Update game in database
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({
        state: newState,
        status: isGameOver ? 'completed' : 'active',
        winner_id: winner,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update game' });
    }

    // Broadcast state change via Supabase Realtime
    // (clients subscribe to `games:id=eq.${gameId}`)

    return res.status(200).json({
      state: newState,
      isGameOver,
      winner,
    });
  } catch (error) {
    console.error('Action execution error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
