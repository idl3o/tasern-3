/**
 * Matchmaking Hook
 *
 * Join queue and poll for match
 */

import { useState, useEffect } from 'react';

interface MatchmakingResult {
  matched: boolean;
  gameId?: string;
  opponentId?: string;
  queueId?: string;
}

export function useMatchmaking(userId: string | null, isSearching: boolean) {
  const [result, setResult] = useState<MatchmakingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !isSearching) {
      return;
    }

    let pollInterval: NodeJS.Timeout;
    let queueId: string | null = null;

    const joinQueue = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/matchmaking/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to join queue');
        }

        if (data.matched) {
          // Match found immediately
          setResult(data);
          setIsLoading(false);
        } else {
          // Start polling
          queueId = data.queueId;
          pollInterval = setInterval(pollForMatch, 2000);
        }
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    const pollForMatch = async () => {
      try {
        const response = await fetch('/api/matchmaking/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queueId }),
        });

        const data = await response.json();

        if (data.matched) {
          setResult(data);
          setIsLoading(false);
          clearInterval(pollInterval);
        }
      } catch (err: any) {
        console.error('Poll error:', err);
      }
    };

    joinQueue();

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [userId, isSearching]);

  return { result, isLoading, error };
}
