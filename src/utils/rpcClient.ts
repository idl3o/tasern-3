/**
 * Multi-Endpoint RPC Client
 *
 * Provides a resilient RPC client that automatically fails over
 * to backup endpoints when the primary fails.
 */

import { createPublicClient, http, Chain } from 'viem';
import { polygon } from 'viem/chains';
import { resilientJsonRpc } from './resilientFetch';

// Get Alchemy API key from environment
const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY || 'demo';

/**
 * Ordered list of Polygon RPC endpoints (primary to fallback)
 */
export const POLYGON_RPC_ENDPOINTS = [
  // Primary: Alchemy (fastest, has API key)
  `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  // Fallback 1: DRPC (free, reliable)
  'https://polygon.drpc.org',
  // Fallback 2: Ankr (free tier)
  'https://rpc.ankr.com/polygon',
  // Fallback 3: Official Polygon RPC
  'https://polygon-rpc.com',
  // Fallback 4: 1RPC (privacy-focused)
  'https://1rpc.io/matic',
];

/**
 * Alchemy NFT API endpoint
 */
export function getAlchemyNftApiUrl(): string {
  return `https://polygon-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;
}

/**
 * Alchemy JSON-RPC endpoint
 */
export function getAlchemyRpcUrl(): string {
  return `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
}

// Track the currently working endpoint
let currentEndpointIndex = 0;
let lastFailureTime: number | null = null;
const ENDPOINT_RECOVERY_TIME = 60000; // Try primary again after 1 minute

/**
 * Get the current best RPC endpoint
 */
export function getCurrentEndpoint(): string {
  // If we're on a fallback and enough time has passed, try primary again
  if (currentEndpointIndex > 0 && lastFailureTime) {
    if (Date.now() - lastFailureTime > ENDPOINT_RECOVERY_TIME) {
      console.log('🔄 Attempting to recover primary RPC endpoint...');
      currentEndpointIndex = 0;
      lastFailureTime = null;
    }
  }

  return POLYGON_RPC_ENDPOINTS[currentEndpointIndex];
}

/**
 * Mark the current endpoint as failed and switch to next
 */
export function failoverToNextEndpoint(): string | null {
  lastFailureTime = Date.now();

  if (currentEndpointIndex < POLYGON_RPC_ENDPOINTS.length - 1) {
    currentEndpointIndex++;
    const newEndpoint = POLYGON_RPC_ENDPOINTS[currentEndpointIndex];
    console.warn(`⚠️ RPC failover: Switching to ${newEndpoint}`);
    return newEndpoint;
  }

  console.error('❌ All RPC endpoints exhausted');
  return null;
}

/**
 * Reset to primary endpoint
 */
export function resetTorimaryEndpoint(): void {
  currentEndpointIndex = 0;
  lastFailureTime = null;
}

/**
 * Create a viem public client with the current best endpoint
 */
export function createResilientClient(chain: Chain = polygon) {
  return createPublicClient({
    chain,
    transport: http(getCurrentEndpoint()),
  });
}

// Singleton client instance (will be recreated on failover)
let clientInstance: ReturnType<typeof createResilientClient> | null = null;

/**
 * Get or create the singleton RPC client
 */
export function getRpcClient() {
  if (!clientInstance) {
    clientInstance = createResilientClient();
  }
  return clientInstance;
}

/**
 * Recreate client with next endpoint (after failure)
 */
export function recreateClient() {
  const nextEndpoint = failoverToNextEndpoint();
  if (!nextEndpoint) {
    return null;
  }

  clientInstance = createResilientClient();
  return clientInstance;
}

/**
 * Execute an RPC call with automatic failover
 */
export async function resilientRpcCall<T>(
  method: string,
  params: any[]
): Promise<{ data: T | null; error: Error | null }> {
  let attemptsRemaining = POLYGON_RPC_ENDPOINTS.length;

  while (attemptsRemaining > 0) {
    const endpoint = getCurrentEndpoint();

    const result = await resilientJsonRpc<T>(endpoint, method, params, {
      maxRetries: 2, // Fewer retries per endpoint since we have failover
      timeout: 15000,
    });

    if (!result.error) {
      return { data: result.data, error: null };
    }

    // Check if we should failover
    const isConnectionError =
      result.error.message.includes('fetch') ||
      result.error.message.includes('network') ||
      result.error.message.includes('timeout') ||
      result.status === 429 ||
      (result.status !== null && result.status >= 500);

    if (isConnectionError) {
      const nextEndpoint = failoverToNextEndpoint();
      if (!nextEndpoint) {
        return { data: null, error: result.error };
      }
      attemptsRemaining--;
    } else {
      // Non-connection error, don't failover
      return { data: null, error: result.error };
    }
  }

  return { data: null, error: new Error('All RPC endpoints failed') };
}

/**
 * Get token balance using resilient RPC
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<bigint> {
  const balanceOfSelector = '0x70a08231';
  const paddedAddress = walletAddress.slice(2).padStart(64, '0');
  const data = `${balanceOfSelector}${paddedAddress}`;

  const result = await resilientRpcCall<string>('eth_call', [
    { to: tokenAddress, data },
    'latest',
  ]);

  if (result.error || !result.data) {
    console.error(`Failed to get balance for ${tokenAddress}:`, result.error);
    return BigInt(0);
  }

  try {
    return BigInt(result.data);
  } catch {
    return BigInt(0);
  }
}

/**
 * Get contract bytecode using resilient RPC
 */
export async function getContractCode(address: string): Promise<string | null> {
  const result = await resilientRpcCall<string>('eth_getCode', [address, 'latest']);

  if (result.error) {
    console.error(`Failed to get code for ${address}:`, result.error);
    return null;
  }

  return result.data;
}

export default {
  getCurrentEndpoint,
  failoverToNextEndpoint,
  resetTorimaryEndpoint,
  getRpcClient,
  recreateClient,
  resilientRpcCall,
  getTokenBalance,
  getContractCode,
  getAlchemyNftApiUrl,
  getAlchemyRpcUrl,
  POLYGON_RPC_ENDPOINTS,
};
