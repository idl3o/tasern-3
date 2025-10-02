/**
 * Realtime Game Hook
 *
 * Subscribe to game state changes via Supabase Realtime
 */

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { BattleState } from '../types/core';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeGame(gameId: string | null) {
  const [gameState, setGameState] = useState<BattleState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setIsLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    // Fetch initial state
    const fetchInitialState = async () => {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('state')
          .eq('id', gameId)
          .single();

        if (error) throw error;

        setGameState(data.state);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchInitialState();

    // Subscribe to realtime updates
    channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log('🔄 Game state updated:', payload);
          setGameState(payload.new.state);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [gameId]);

  return { gameState, isLoading, error };
}
