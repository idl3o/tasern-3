/**
 * Network Status Hook
 *
 * Detects online/offline status and provides reactive updates.
 * Useful for showing offline banners and disabling network-dependent features.
 */

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  /** Whether the browser reports being online */
  isOnline: boolean;
  /** Whether we've confirmed connectivity to our APIs */
  isConnected: boolean;
  /** Time since last successful network request */
  lastOnline: Date | null;
  /** Number of consecutive failed requests */
  failedRequests: number;
}

const CONNECTIVITY_CHECK_URL = 'https://polygon-rpc.com';
const CONNECTIVITY_CHECK_INTERVAL = 30000; // 30 seconds

/**
 * Hook to monitor network status
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnected: true,
    lastOnline: new Date(),
    failedRequests: 0,
  });

  // Check actual connectivity to our APIs
  const checkConnectivity = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(CONNECTIVITY_CHECK_URL, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus(prev => ({
          ...prev,
          isConnected: true,
          lastOnline: new Date(),
          failedRequests: 0,
        }));
        return true;
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        failedRequests: prev.failedRequests + 1,
      }));
    }
    return false;
  }, []);

  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Browser reports: Online');
      setStatus(prev => ({
        ...prev,
        isOnline: true,
      }));
      // Verify actual connectivity
      checkConnectivity();
    };

    const handleOffline = () => {
      console.log('📴 Browser reports: Offline');
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnected: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connectivity check
    checkConnectivity();

    // Periodic connectivity checks
    const intervalId = setInterval(checkConnectivity, CONNECTIVITY_CHECK_INTERVAL);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkConnectivity]);

  return status;
}

/**
 * Hook to show an offline banner when disconnected
 */
export function useOfflineBanner(): {
  showBanner: boolean;
  dismiss: () => void;
} {
  const { isOnline, isConnected } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when we come back online
  useEffect(() => {
    if (isOnline && isConnected) {
      setDismissed(false);
    }
  }, [isOnline, isConnected]);

  return {
    showBanner: !dismissed && (!isOnline || !isConnected),
    dismiss: () => setDismissed(true),
  };
}

/**
 * Record a failed network request (for tracking connectivity)
 */
export function recordFailedRequest(): void {
  // This could be expanded to update a global store
  console.warn('📡 Network request failed');
}

/**
 * Record a successful network request
 */
export function recordSuccessfulRequest(): void {
  // This could be expanded to update a global store
  // Currently just a no-op for symmetry
}

export default useNetworkStatus;
