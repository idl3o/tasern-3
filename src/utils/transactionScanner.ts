/**
 * Transaction Scanner (REFACTORED)
 *
 * Uses Alchemy's Token API to directly query token balances
 * Much faster and more efficient than block scanning
 */

import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
  error?: string;
}

interface AlchemyTokenBalancesResponse {
  address: string;
  tokenBalances: TokenBalance[];
}

interface ImpactAssetValue {
  contract: string;
  balance: bigint;
  symbol?: string;
  decimals?: number;
}

// Use Alchemy for Token API
const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY || 'demo';
const alchemyUrl = `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(alchemyUrl)
}) as any; // Type assertion for simplified client usage

export class TransactionScanner {
  private cache: Map<string, TokenBalance[]> = new Map();

  /**
   * Get token balances for a specific address using Alchemy Token API
   * This is MUCH faster than scanning blocks
   */
  async getTokenBalancesForAddress(
    address: string,
    tokenContracts: string[]
  ): Promise<TokenBalance[]> {
    const cacheKey = `${address}-${tokenContracts.join(',')}`;

    if (this.cache.has(cacheKey)) {
      console.log(`Returning cached token balances for ${address}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`Fetching token balances for ${address} via Alchemy Token API...`);

    try {
      // Use Alchemy's alchemy_getTokenBalances method
      const response = await fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenBalances',
          params: [address, tokenContracts]
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error('Alchemy API error:', data.error);
        return [];
      }

      const tokenBalances: TokenBalance[] = data.result.tokenBalances || [];

      // Filter out zero balances and errors
      const nonZeroBalances = tokenBalances.filter(
        tb => tb.tokenBalance && tb.tokenBalance !== '0x0' && !tb.error
      );

      console.log(`Found ${nonZeroBalances.length} non-zero token balances for ${address}`);

      this.cache.set(cacheKey, nonZeroBalances);
      return nonZeroBalances;

    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  }

  private async parseTransactionForAssociation(tx: any, transferLog: any): Promise<AssociatedContract | null> {
    // Check if transaction data contains additional parameters
    // This would depend on the specific implementation of the NFT contracts

    // Method 1: Check if input data is longer than standard transfer
    if (tx.input && tx.input.length > 138) { // Standard transfer is ~138 chars
      // Attempt to decode additional parameters
      // This is where we'd look for patterns indicating associated contracts

      // Example: Last 20 bytes might be an address
      const potentialAddress = '0x' + tx.input.slice(-40);
      if (this.isValidAddress(potentialAddress)) {
        return {
          nftContract: transferLog.address,
          tokenId: transferLog.topics[3], // TokenId is usually the 3rd indexed param
          associatedContract: potentialAddress,
          blockNumber: transferLog.blockNumber,
          transactionHash: transferLog.transactionHash
        };
      }
    }

    return null;
  }

  private parseLogsForAssociations(logs: any[], transferLog: any): AssociatedContract[] {
    const associations: AssociatedContract[] = [];

    // Look for custom events that might indicate associations
    for (const log of logs) {
      // Skip the transfer event itself
      if (log.logIndex === transferLog.logIndex) continue;

      // Check for events that might indicate value deposits or associations
      // Common patterns:
      // - ValueDeposited events
      // - AssociationCreated events
      // - Custom registry events

      try {
        // Attempt to decode as a potential association event
        // This is speculative - we'd need to know the actual event signatures
        if (log.topics.length >= 3) {
          // If this log references the same tokenId and has an address parameter
          const potentialTokenId = log.topics[2];
          const potentialContract = log.topics[1];

          if (potentialTokenId === transferLog.topics[3] && this.isValidAddress(potentialContract)) {
            associations.push({
              nftContract: transferLog.address,
              tokenId: potentialTokenId,
              associatedContract: potentialContract,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash
            });
          }
        }
      } catch (e) {
        // Silent fail for logs we can't decode
      }
    }

    return associations;
  }

  async readAssociatedContractValues(
    associatedContract: string,
    walletAddress: string
  ): Promise<ImpactAssetValue[]> {
    const values: ImpactAssetValue[] = [];

    try {
      // Try common patterns for reading values

      // Pattern 1: ERC20-like balance
      try {
        const balance = await publicClient.readContract({
          address: associatedContract as `0x${string}`,
          abi: [
            {
              name: 'balanceOf',
              type: 'function',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: 'balance', type: 'uint256' }],
              stateMutability: 'view'
            }
          ],
          functionName: 'balanceOf',
          args: [walletAddress]
        });

        if (balance && balance > BigInt(0)) {
          values.push({
            contract: associatedContract,
            balance: balance as bigint
          });
        }
      } catch (e) {
        // Not an ERC20-like contract
      }

      // Pattern 2: Generic value getter
      try {
        const value = await publicClient.readContract({
          address: associatedContract as `0x${string}`,
          abi: [
            {
              name: 'getValue',
              type: 'function',
              inputs: [{ name: 'account', type: 'address' }],
              outputs: [{ name: 'value', type: 'uint256' }],
              stateMutability: 'view'
            }
          ],
          functionName: 'getValue',
          args: [walletAddress]
        });

        if (value && value > BigInt(0)) {
          values.push({
            contract: associatedContract,
            balance: value as bigint
          });
        }
      } catch (e) {
        // No getValue function
      }

      // Pattern 3: Holdings mapping
      try {
        const holdings = await publicClient.readContract({
          address: associatedContract as `0x${string}`,
          abi: [
            {
              name: 'holdings',
              type: 'function',
              inputs: [{ name: '', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view'
            }
          ],
          functionName: 'holdings',
          args: [walletAddress]
        });

        if (holdings && holdings > BigInt(0)) {
          values.push({
            contract: associatedContract,
            balance: holdings as bigint
          });
        }
      } catch (e) {
        // No holdings mapping
      }

    } catch (error) {
      console.error(`Error reading from associated contract ${associatedContract}:`, error);
    }

    return values;
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get NFT enhancements by directly checking NFT contract for token balances
   * Uses Alchemy Token API - much faster than block scanning
   */
  async getNFTEnhancements(
    walletAddress: string,
    nftContract: string,
    tokenId: string
  ): Promise<{ totalValue: bigint; associations: any[] }> {
    console.log(`Checking NFT contract ${nftContract} for impact asset holdings...`);

    // Known impact asset contracts on Polygon
    const IMPACT_ASSETS = [
      '0x4bf82cf0d6b2afc87367052b793097153c859d38', // DDD
      '0xdfffe0c33b4011c4218acd61e68a62a32eaf9a8b', // axlREGEN
      '0x520a3b3faca7ddc8dc8cd3380c8475b67f3c7b8d'  // DDD/axlREGEN LP
    ];

    // Query the NFT contract address directly for token balances
    const tokenBalances = await this.getTokenBalancesForAddress(
      nftContract,
      IMPACT_ASSETS
    );

    const enhancementDetails = [];
    let totalValue = BigInt(0);

    for (const balance of tokenBalances) {
      const value = BigInt(balance.tokenBalance);
      totalValue += value;

      enhancementDetails.push({
        contract: balance.contractAddress,
        value,
        tokenBalance: balance.tokenBalance
      });

      console.log(`✅ Found ${balance.tokenBalance} of token ${balance.contractAddress} at NFT contract`);
    }

    return {
      totalValue,
      associations: enhancementDetails
    };
  }
}

export const transactionScanner = new TransactionScanner();
