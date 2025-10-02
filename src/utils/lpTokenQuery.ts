/**
 * LP Token Query Utility
 *
 * Query LP token balances from Polygon via public RPC
 * Used for stat bonuses: 0.01 LP = +5% to all card stats
 */

import { ethers } from 'ethers';

const polygonRpcUrl = process.env.REACT_APP_POLYGON_RPC_URL || 'https://polygon-rpc.com';

const provider = new ethers.providers.JsonRpcProvider(polygonRpcUrl);

// Minimal ERC20 ABI for balance queries
const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export interface LPBalance {
  contract: string;
  balance: string;
  decimals: number;
  symbol: string;
  normalizedBalance: number; // Balance in human-readable format
}

/**
 * Query LP token balance for a wallet address
 */
export async function queryLPBalance(
  lpTokenAddress: string,
  walletAddress: string
): Promise<LPBalance | null> {
  try {
    const contract = new ethers.Contract(lpTokenAddress, ERC20_ABI, provider);

    // Get balance
    const balance = await contract.balanceOf(walletAddress);

    // If no balance, return null
    if (balance.isZero()) {
      return null;
    }

    // Get decimals
    const decimals = await contract.decimals();

    // Get symbol
    const symbol = await contract.symbol();

    // Normalize balance (convert from wei to human-readable)
    const normalizedBalance = parseFloat(ethers.utils.formatUnits(balance, decimals));

    return {
      contract: lpTokenAddress,
      balance: balance.toString(),
      decimals,
      symbol,
      normalizedBalance,
    };
  } catch (error) {
    console.error(`Error querying LP balance for ${lpTokenAddress}:`, error);
    return null;
  }
}

/**
 * Calculate stat bonus from LP holdings
 * Formula: Each 0.01 LP = +5% to all stats
 */
export function calculateLPBonus(lpBalance: number): number {
  return lpBalance * 5; // 0.01 LP = 0.01 * 5 = 0.05 = 5%
}

/**
 * Scan wallet for known LP token contracts
 * Returns total LP bonus multiplier
 */
export async function scanWalletForLPBonus(
  walletAddress: string,
  lpTokenContracts: string[]
): Promise<{
  totalBonus: number;
  holdings: LPBalance[];
}> {
  const holdings: LPBalance[] = [];

  for (const contract of lpTokenContracts) {
    const balance = await queryLPBalance(contract, walletAddress);
    if (balance && balance.normalizedBalance > 0) {
      holdings.push(balance);
    }
  }

  // Calculate total bonus
  const totalLP = holdings.reduce((sum, h) => sum + h.normalizedBalance, 0);
  const totalBonus = calculateLPBonus(totalLP);

  return {
    totalBonus,
    holdings,
  };
}

/**
 * Known LP token contracts on Polygon
 * Add more as discovered
 */
export const KNOWN_LP_CONTRACTS = [
  // Add known LP token addresses here
  // Example: '0x...'
];
