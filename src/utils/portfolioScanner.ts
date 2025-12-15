/**
 * Portfolio Scanner Utility
 *
 * Aggregates NFT scans across multiple wallet addresses in a portfolio.
 * Supports parallel scanning with progress tracking.
 */

import { UniversalImpactScanner, type EnhancedNFTData, type ScanProgress, type ProgressCallback, type LogCallback } from './universalImpactScanner';
import { useWalletPortfolioStore } from '../state/walletPortfolioStore';

// Extended NFT data with owner information
export interface PortfolioNFTData extends EnhancedNFTData {
  ownerAddress: string;
  ownerLabel: string;
  isVerifiedOwner: boolean;
}

export interface PortfolioScanProgress {
  currentAddress: string;
  addressIndex: number;
  totalAddresses: number;
  nftProgress: ScanProgress | null;
  overallPercentage: number;
}

export type PortfolioProgressCallback = (progress: PortfolioScanProgress) => void;

/**
 * Scan all addresses in the portfolio and aggregate NFTs
 */
export async function scanPortfolio(
  progressCallback?: PortfolioProgressCallback,
  logCallback?: LogCallback
): Promise<PortfolioNFTData[]> {
  const log = logCallback || (() => {});
  const updateProgress = progressCallback || (() => {});

  const store = useWalletPortfolioStore.getState();
  const addresses = store.linkedAddresses;

  if (addresses.length === 0) {
    log('No addresses in portfolio to scan', 'warning');
    return [];
  }

  log(`Starting portfolio scan for ${addresses.length} wallet(s)...`, 'info');

  const scanner = new UniversalImpactScanner();
  const allNFTs: PortfolioNFTData[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const addressInfo = addresses[i];
    const { address, label, verified } = addressInfo;

    log(`Scanning wallet ${i + 1}/${addresses.length}: ${label} (${address.slice(0, 6)}...)`, 'info');

    // Create NFT progress handler that updates overall progress
    const nftProgressHandler: ProgressCallback = (nftProgress) => {
      const addressProgress = (i / addresses.length) * 100;
      const nftContribution = (nftProgress.percentage / addresses.length);
      const overallPercentage = addressProgress + nftContribution;

      updateProgress({
        currentAddress: address,
        addressIndex: i,
        totalAddresses: addresses.length,
        nftProgress,
        overallPercentage,
      });
    };

    try {
      const nfts = await scanner.scanWalletForImpactAssets(
        address,
        nftProgressHandler,
        logCallback
      );

      // Add owner information to each NFT
      const portfolioNFTs: PortfolioNFTData[] = nfts.map(nft => ({
        ...nft,
        ownerAddress: address,
        ownerLabel: label,
        isVerifiedOwner: verified,
      }));

      allNFTs.push(...portfolioNFTs);

      // Update lastScanned timestamp
      store.updateLinkedAddress(address, { lastScanned: Date.now() });

      log(`Found ${nfts.length} NFTs in ${label}`, 'success');
    } catch (error) {
      log(`Error scanning ${label}: ${error}`, 'error');
      // Continue with other addresses
    }
  }

  log(`Portfolio scan complete: ${allNFTs.length} total NFTs from ${addresses.length} wallet(s)`, 'success');

  return allNFTs;
}

/**
 * Quick refresh LP balances for all portfolio NFTs
 */
export async function quickRefreshPortfolio(
  existingNFTs: PortfolioNFTData[],
  progressCallback?: PortfolioProgressCallback,
  logCallback?: LogCallback
): Promise<PortfolioNFTData[]> {
  const log = logCallback || (() => {});
  const updateProgress = progressCallback || (() => {});

  // Group NFTs by owner address
  const nftsByOwner = new Map<string, PortfolioNFTData[]>();
  for (const nft of existingNFTs) {
    if (!nftsByOwner.has(nft.ownerAddress)) {
      nftsByOwner.set(nft.ownerAddress, []);
    }
    nftsByOwner.get(nft.ownerAddress)!.push(nft);
  }

  const addresses = Array.from(nftsByOwner.keys());
  log(`Quick refreshing LP for ${addresses.length} wallet(s)...`, 'info');

  const scanner = new UniversalImpactScanner();
  const refreshedNFTs: PortfolioNFTData[] = [];

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const ownerNFTs = nftsByOwner.get(address)!;

    // Get owner info from first NFT
    const { ownerLabel, isVerifiedOwner } = ownerNFTs[0];

    log(`Refreshing ${ownerLabel} (${ownerNFTs.length} NFTs)...`, 'info');

    const nftProgressHandler: ProgressCallback = (nftProgress) => {
      const addressProgress = (i / addresses.length) * 100;
      const nftContribution = (nftProgress.percentage / addresses.length);

      updateProgress({
        currentAddress: address,
        addressIndex: i,
        totalAddresses: addresses.length,
        nftProgress,
        overallPercentage: addressProgress + nftContribution,
      });
    };

    try {
      // Convert PortfolioNFTData back to EnhancedNFTData for the scanner
      const enhancedNFTs: EnhancedNFTData[] = ownerNFTs.map(nft => ({
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        tokenType: nft.tokenType,
        impactAssets: nft.impactAssets,
        contractInfo: nft.contractInfo,
        enhancementLevel: nft.enhancementLevel,
        statMultipliers: nft.statMultipliers,
        copyIndex: nft.copyIndex,
        totalCopies: nft.totalCopies,
      }));

      const refreshed = await scanner.quickRefreshLPBalances(
        address,
        enhancedNFTs,
        nftProgressHandler,
        logCallback
      );

      // Re-add owner information
      const portfolioNFTs: PortfolioNFTData[] = refreshed.map(nft => ({
        ...nft,
        ownerAddress: address,
        ownerLabel,
        isVerifiedOwner,
      }));

      refreshedNFTs.push(...portfolioNFTs);
    } catch (error) {
      log(`Error refreshing ${ownerLabel}: ${error}`, 'error');
      // Keep original NFTs on error
      refreshedNFTs.push(...ownerNFTs);
    }
  }

  log(`Quick refresh complete!`, 'success');
  return refreshedNFTs;
}

/**
 * Scan a single address and add to portfolio results
 */
export async function scanSingleAddress(
  address: string,
  label: string,
  verified: boolean,
  progressCallback?: ProgressCallback,
  logCallback?: LogCallback
): Promise<PortfolioNFTData[]> {
  const log = logCallback || (() => {});

  log(`Scanning ${label} (${address.slice(0, 6)}...)...`, 'info');

  const scanner = new UniversalImpactScanner();

  try {
    const nfts = await scanner.scanWalletForImpactAssets(
      address,
      progressCallback,
      logCallback
    );

    const portfolioNFTs: PortfolioNFTData[] = nfts.map(nft => ({
      ...nft,
      ownerAddress: address,
      ownerLabel: label,
      isVerifiedOwner: verified,
    }));

    log(`Found ${nfts.length} NFTs in ${label}`, 'success');
    return portfolioNFTs;
  } catch (error) {
    log(`Error scanning ${label}: ${error}`, 'error');
    return [];
  }
}

/**
 * Calculate aggregated LP stats across portfolio
 */
export function calculatePortfolioStats(nfts: PortfolioNFTData[]) {
  const byOwner = new Map<string, { label: string; count: number; lpTotal: number }>();

  let totalNFTs = 0;
  let totalLP = 0;
  let enhancedCount = 0;

  for (const nft of nfts) {
    totalNFTs++;
    totalLP += nft.impactAssets.lpBalance + nft.impactAssets.lpRegenPr24Balance;

    if (nft.impactAssets.totalValue > 0) {
      enhancedCount++;
    }

    if (!byOwner.has(nft.ownerAddress)) {
      byOwner.set(nft.ownerAddress, {
        label: nft.ownerLabel,
        count: 0,
        lpTotal: 0,
      });
    }

    const owner = byOwner.get(nft.ownerAddress)!;
    owner.count++;
    owner.lpTotal += nft.impactAssets.lpBalance + nft.impactAssets.lpRegenPr24Balance;
  }

  return {
    totalNFTs,
    totalLP,
    enhancedCount,
    byOwner: Array.from(byOwner.entries()).map(([address, data]) => ({
      address,
      ...data,
    })),
  };
}
