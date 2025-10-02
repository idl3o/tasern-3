/**
 * Join Matchmaking Queue
 *
 * Add player to queue, auto-match if possible
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Add to queue
    const { data: queueEntry, error: queueError } = await supabase
      .from('match_queue')
      .insert({
        user_id: userId,
        status: 'waiting',
      })
      .select()
      .single();

    if (queueError) {
      console.error('Queue error:', queueError);
      return res.status(500).json({ error: 'Failed to join queue' });
    }

    // Check for waiting opponent
    const { data: waitingPlayers } = await supabase
      .from('match_queue')
      .select('*')
      .eq('status', 'waiting')
      .neq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (waitingPlayers && waitingPlayers.length > 0) {
      const opponent = waitingPlayers[0];

      // Create game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          player1_id: opponent.user_id,
          player2_id: userId,
          state: null, // Will be initialized by client
          status: 'active',
          winner_id: null,
        })
        .select()
        .single();

      if (gameError) {
        console.error('Game creation error:', gameError);
        return res.status(500).json({ error: 'Failed to create game' });
      }

      // Update queue entries
      await supabase
        .from('match_queue')
        .update({ status: 'matched' })
        .in('id', [queueEntry.id, opponent.id]);

      return res.status(200).json({
        matched: true,
        gameId: game.id,
        opponentId: opponent.user_id,
      });
    }

    // No match found, waiting
    return res.status(200).json({
      matched: false,
      queueId: queueEntry.id,
    });
  } catch (error) {
    console.error('Matchmaking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
