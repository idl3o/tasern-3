/**
 * NFT Provenance Analyzer
 *
 * Track NFT origins and verify authenticity via blockchain history
 */

import { createPublicClient, http, type Log } from 'viem';
import { polygon } from 'viem/chains';
import type { TasernNFT } from './nftScanner';

const polygonRpcUrl = process.env.REACT_APP_POLYGON_RPC_URL || 'https://polygon-rpc.com';

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(polygonRpcUrl),
});

// James McGee's verified wallet address (creator of Tales of Tasern)
export const JAMES_MCGEE_WALLET = '0x0780b1456d5e60cf26c8cd6541b85e805c8c05f2';

// Known OpenSea contract addresses
const OPENSEA_CONTRACTS = [
  '0x00000000000000adc04c56bf30ac9d3c0aaf14dc', // OpenSea Seaport 1.5
  '0x00000000000001ad428e4906ae43d8f9852d0dd6', // OpenSea Seaport 1.4
  '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b', // OpenSea Wyvern v2.3
];

// ERC721 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export interface TransferEvent {
  from: string;
  to: string;
  blockNumber: bigint;
  transactionHash: string;
  timestamp?: number;
}

export interface ProvenanceInfo {
  isAuthentic: boolean;
  wasMintedByJames: boolean;
  wasOwnedByJames: boolean;
  wasDirectFromJames: boolean;
  wasViaOpenSea: boolean;
  minter: string | null;
  transferHistory: TransferEvent[];
  authenticityScore: number; // 0-100
  lastTransferFrom: string | null;
}

/**
 * Get NFT transfer history from blockchain
 */
export async function getNFTTransferHistory(
  contractAddress: string,
  tokenId: string
): Promise<TransferEvent[]> {
  try {
    // Query Transfer events for this specific token
    const logs = await publicClient.getLogs({
      address: contractAddress as `0x${string}`,
      event: {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { type: 'address', indexed: true, name: 'from' },
          { type: 'address', indexed: true, name: 'to' },
          { type: 'uint256', indexed: true, name: 'tokenId' },
        ],
      },
      args: {
        tokenId: BigInt(tokenId),
      },
      fromBlock: 'earliest',
      toBlock: 'latest',
    });

    // Convert logs to transfer events
    const transfers: TransferEvent[] = logs.map((log) => ({
      from: log.args.from || '0x0',
      to: log.args.to || '0x0',
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    }));

    // Sort by block number (oldest first)
    transfers.sort((a, b) => Number(a.blockNumber - b.blockNumber));

    return transfers;
  } catch (error) {
    console.error('Error fetching transfer history:', error);
    return [];
  }
}

/**
 * Get original minter of NFT (first Transfer from 0x0)
 */
export function getOriginalMinter(transfers: TransferEvent[]): string | null {
  if (transfers.length === 0) return null;

  const mintTransfer = transfers[0];

  // Mint event: Transfer from 0x0 address to first owner
  if (mintTransfer.from.toLowerCase() === '0x0000000000000000000000000000000000000000') {
    return mintTransfer.to;
  }

  return null;
}

/**
 * Check if NFT was ever owned by a specific address
 */
export function wasOwnedBy(transfers: TransferEvent[], address: string): boolean {
  const normalizedAddress = address.toLowerCase();

  return transfers.some(
    (transfer) =>
      transfer.to.toLowerCase() === normalizedAddress ||
      transfer.from.toLowerCase() === normalizedAddress
  );
}

/**
 * Check if NFT was directly transferred from specific address to current owner
 */
export function wasDirectTransferFrom(
  transfers: TransferEvent[],
  fromAddress: string,
  currentOwner: string
): boolean {
  const normalizedFrom = fromAddress.toLowerCase();
  const normalizedOwner = currentOwner.toLowerCase();

  return transfers.some(
    (transfer) =>
      transfer.from.toLowerCase() === normalizedFrom &&
      transfer.to.toLowerCase() === normalizedOwner
  );
}

/**
 * Check if any transfers went through OpenSea
 */
export async function wasViaOpenSea(transfers: TransferEvent[]): Promise<boolean> {
  try {
    // Check each transfer transaction for OpenSea interaction
    for (const transfer of transfers) {
      const tx = await publicClient.getTransaction({
        hash: transfer.transactionHash as `0x${string}`,
      });

      // Check if transaction was to/from OpenSea contract
      const toAddress = tx.to?.toLowerCase();
      if (toAddress && OPENSEA_CONTRACTS.some((os) => os.toLowerCase() === toAddress)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking OpenSea transactions:', error);
    return false;
  }
}

/**
 * Analyze NFT provenance and calculate authenticity score
 */
export async function analyzeProvenance(
  nft: TasernNFT,
  currentOwner: string
): Promise<ProvenanceInfo> {
  console.log(`🔍 Analyzing provenance for NFT ${nft.contract}:${nft.tokenId}...`);

  // Fetch transfer history
  const transferHistory = await getNFTTransferHistory(nft.contract, nft.tokenId);

  if (transferHistory.length === 0) {
    console.warn('⚠️ No transfer history found - might be invalid NFT');
    return {
      isAuthentic: false,
      wasMintedByJames: false,
      wasOwnedByJames: false,
      wasDirectFromJames: false,
      wasViaOpenSea: false,
      minter: null,
      transferHistory: [],
      authenticityScore: 0,
      lastTransferFrom: null,
    };
  }

  // Analyze provenance
  const minter = getOriginalMinter(transferHistory);
  const wasMintedByJames = minter?.toLowerCase() === JAMES_MCGEE_WALLET.toLowerCase();
  const wasOwnedByJames = wasOwnedBy(transferHistory, JAMES_MCGEE_WALLET);
  const wasDirectFromJames = wasDirectTransferFrom(
    transferHistory,
    JAMES_MCGEE_WALLET,
    currentOwner
  );
  const wasViaOpenSea = await wasViaOpenSea(transferHistory);

  // Calculate authenticity score
  let score = 0;
  if (wasMintedByJames) score += 50; // Highest weight - minted by creator
  if (wasOwnedByJames) score += 30; // High weight - was in creator's collection
  if (wasDirectFromJames) score += 20; // Medium weight - direct transfer from creator

  const isAuthentic = score >= 50; // Minimum score for "verified Tasern"

  // Get last transfer source
  const lastTransfer = transferHistory[transferHistory.length - 1];
  const lastTransferFrom = lastTransfer?.from || null;

  console.log(
    `✅ Provenance analysis complete: ${isAuthentic ? 'AUTHENTIC' : 'UNVERIFIED'} (score: ${score})`
  );

  return {
    isAuthentic,
    wasMintedByJames,
    wasOwnedByJames,
    wasDirectFromJames,
    wasViaOpenSea,
    minter,
    transferHistory,
    authenticityScore: score,
    lastTransferFrom,
  };
}

/**
 * Batch analyze provenance for multiple NFTs (with caching)
 */
export async function batchAnalyzeProvenance(
  nfts: TasernNFT[],
  currentOwner: string
): Promise<Map<string, ProvenanceInfo>> {
  const results = new Map<string, ProvenanceInfo>();

  // Analyze in parallel batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < nfts.length; i += batchSize) {
    const batch = nfts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((nft) => analyzeProvenance(nft, currentOwner))
    );

    batch.forEach((nft, index) => {
      const key = `${nft.contract}:${nft.tokenId}`;
      results.set(key, batchResults[index]);
    });
  }

  return results;
}
