/**
 * Universal Impact Asset Scanner
 *
 * Production-ready system for discovering DDD/axlREGEN impact asset holdings
 * attached to NFTs through associated contracts and proxy patterns.
 *
 * Features:
 * - Works with any wallet address and NFT collection
 * - Detects EIP-1167 minimal proxy patterns
 * - Discovers DDD, axlREGEN, and UNI-V2 LP token holdings
 * - Provides enhanced stat multipliers for gameplay
 */

import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';
import { TransactionScanner } from './transactionScanner';

// Impact asset configuration
export const IMPACT_ASSETS = {
  DDD: {
    address: '0x4bf82cf0d6b2afc87367052b793097153c859d38',
    symbol: 'DDD',
    decimals: 18,
    description: 'Impact Assets Token - Core regenerative finance asset'
  },
  axlREGEN: {
    address: '0xdfffe0c33b4011c4218acd61e68a62a32eaf9a8b',
    symbol: 'axlREGEN',
    decimals: 18,
    description: 'Regenerative finance asset on Polygon'
  },
  LP_TOKEN: {
    address: '0x520a3b3faca7ddc8dc8cd3380c8475b67f3c7b8d',
    symbol: 'UNI-V2',
    decimals: 18,
    description: 'DDD/axlREGEN Uniswap V2 LP token'
  }
} as const;

export interface ImpactAssetHoldings {
  dddBalance: number;
  axlRegenBalance: number;
  lpBalance: number;
  totalValue: number;
  discoveryMethod: 'direct' | 'proxy' | 'implementation' | 'none';
  implementationAddress?: string;
}

export interface EnhancedNFTData {
  contractAddress: string;
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  tokenType?: string;
  impactAssets: ImpactAssetHoldings;
  contractInfo: {
    hasCode: boolean;
    isProxy: boolean;
    name: string;
    symbol: string;
  };
  enhancementLevel: number; // 0-5 star rating based on LP holdings
  statMultipliers: {
    attack: number;
    health: number;
    defense: number;
  };
  copyIndex?: number; // For duplicate NFTs (ERC1155), index of this copy
  totalCopies?: number; // Total number of copies of this NFT
}

export interface ScanProgress {
  current: number;
  total: number;
  message: string;
  percentage: number;
}

export type ProgressCallback = (progress: ScanProgress) => void;
export type LogCallback = (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;

export class UniversalImpactScanner {
  private provider: any;
  private transactionScanner: TransactionScanner;

  constructor(rpcUrl?: string) {
    const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY || 'demo';
    const url = rpcUrl || `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;

    this.provider = createPublicClient({
      chain: polygon,
      transport: http(url)
    });

    this.transactionScanner = new TransactionScanner();
  }

  /**
   * Scan a wallet for all NFTs and their impact asset holdings
   */
  async scanWalletForImpactAssets(
    walletAddress: string,
    progressCallback?: ProgressCallback,
    logCallback?: LogCallback
  ): Promise<EnhancedNFTData[]> {
    const log = logCallback || (() => {});
    const updateProgress = progressCallback || (() => {});

    log(`Starting universal impact asset scan for ${walletAddress}`, 'info');

    try {
      // Step 1: Load NFTs from wallet
      updateProgress({ current: 0, total: 100, message: 'Loading NFTs...', percentage: 0 });
      const nfts = await this.loadNFTsFromWallet(walletAddress, log);

      if (nfts.length === 0) {
        log('No NFTs found in wallet', 'warning');
        return [];
      }

      log(`Found ${nfts.length} unique NFTs, analyzing for impact assets...`, 'info');

      // Step 2: Analyze each NFT for impact asset holdings
      const enhancedNFTs: EnhancedNFTData[] = [];

      for (let i = 0; i < nfts.length; i++) {
        const nft = nfts[i];
        const progress = {
          current: i + 1,
          total: nfts.length,
          message: `Analyzing ${nft.name || 'NFT'} (${i + 1}/${nfts.length})`,
          percentage: ((i + 1) / nfts.length) * 100
        };
        updateProgress(progress);

        try {
          // Check if this is an ERC1155 token with multiple copies
          const balance = parseInt(nft.balance || '1', 10);

          if (balance > 1) {
            log(`Found ${balance} copies of ${nft.name}, dividing LP holdings...`, 'info');
          }

          // Get the base enhanced NFT data with full LP holdings
          const baseEnhancedNFT = await this.analyzeNFTForImpactAssets(nft, walletAddress, log);

          // Create separate entries for each copy, dividing LP holdings equally
          for (let copyIndex = 0; copyIndex < balance; copyIndex++) {
            // Clone the enhanced NFT and adjust holdings for this copy
            const enhancedNFTCopy: EnhancedNFTData = {
              ...baseEnhancedNFT,
              // Divide impact assets by number of copies
              impactAssets: {
                dddBalance: baseEnhancedNFT.impactAssets.dddBalance / balance,
                axlRegenBalance: baseEnhancedNFT.impactAssets.axlRegenBalance / balance,
                lpBalance: baseEnhancedNFT.impactAssets.lpBalance / balance,
                totalValue: baseEnhancedNFT.impactAssets.totalValue / balance,
                discoveryMethod: baseEnhancedNFT.impactAssets.discoveryMethod,
                implementationAddress: baseEnhancedNFT.impactAssets.implementationAddress
              },
              // Store copy information for unique card ID generation
              copyIndex,
              totalCopies: balance
            };

            // Recalculate enhancement level and stat multipliers for divided holdings
            enhancedNFTCopy.enhancementLevel = this.calculateEnhancementLevel(enhancedNFTCopy.impactAssets.totalValue);
            enhancedNFTCopy.statMultipliers = this.calculateStatMultipliers(enhancedNFTCopy.impactAssets);

            enhancedNFTs.push(enhancedNFTCopy);
          }

          if (baseEnhancedNFT.impactAssets.totalValue > 0) {
            const perCopyValue = baseEnhancedNFT.impactAssets.totalValue / balance;
            log(`✅ ${nft.name}: Found ${baseEnhancedNFT.impactAssets.totalValue.toFixed(6)} total impact assets (${perCopyValue.toFixed(6)} per copy, ${balance} copies)`, 'success');
          }
        } catch (error) {
          log(`Error analyzing ${nft.name}: ${error}`, 'error');
          // Add NFT with no impact assets on error
          enhancedNFTs.push(this.createEmptyEnhancedNFT(nft));
        }
      }

      const enhancedCount = enhancedNFTs.filter(nft => nft.impactAssets.totalValue > 0).length;
      log(`Scan complete: ${enhancedCount}/${enhancedNFTs.length} cards have impact asset holdings`, 'success');

      return enhancedNFTs;

    } catch (error) {
      log(`Scan failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Analyze a single NFT for impact asset holdings
   */
  private async analyzeNFTForImpactAssets(
    nft: any,
    walletAddress: string,
    log: LogCallback
  ): Promise<EnhancedNFTData> {
    const contractAddress = nft.contractAddress || nft.contract?.address;
    const tokenId = nft.tokenId || nft.id?.tokenId || '1';

    if (!contractAddress) {
      log(`No contract address for NFT: ${nft.name}`, 'warning');
      return this.createEmptyEnhancedNFT(nft);
    }

    // Get contract information
    const contractInfo = await this.getContractInfo(contractAddress);

    // Method 1: Check NFT contract directly for impact assets (legacy)
    const directHoldings = await this.checkDirectImpactAssetHoldings(contractAddress);

    // Method 2: Check via proxy pattern (legacy)
    const proxyHoldings = contractInfo.isProxy ?
      await this.checkProxyImpactAssetHoldings(contractAddress) :
      this.createEmptyHoldings();

    // Method 3: NEW - Use TransactionScanner to find associated contracts (Zapper-style)
    const transactionHoldings = await this.checkTransactionAssociatedHoldings(
      walletAddress,
      contractAddress,
      tokenId,
      log
    );

    // Combine all holdings from all methods
    const combinedHoldings = this.combineMultipleHoldings([
      directHoldings,
      proxyHoldings,
      transactionHoldings
    ]);

    // Calculate enhancement level and stat multipliers
    const enhancementLevel = this.calculateEnhancementLevel(combinedHoldings.totalValue);
    const statMultipliers = this.calculateStatMultipliers(combinedHoldings);

    return {
      contractAddress,
      tokenId,
      name: nft.name || nft.title || 'Unknown NFT',
      description: nft.description || '',
      image: nft.image?.thumbnailUrl || nft.image?.originalUrl || nft.image || '',
      tokenType: nft.tokenType || 'ERC721',
      impactAssets: combinedHoldings,
      contractInfo,
      enhancementLevel,
      statMultipliers
    };
  }

  /**
   * Load NFTs from a wallet using Alchemy API with fallback
   * FILTERS to only Tasern Universe NFTs using hybrid verification
   */
  private async loadNFTsFromWallet(walletAddress: string, log: LogCallback): Promise<any[]> {
    try {
      // Import Tasern verification utilities
      const { isTasernNFT, TASERN_HUB_ADDRESS } = await import('./nftScanner');

      // Try Alchemy API first
      const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY || 'demo';
      const alchemyUrl = `https://polygon-mainnet.g.alchemy.com/nft/v3/${alchemyApiKey}/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=100`;

      const response = await fetch(alchemyUrl);
      const data = await response.json();

      if (data.ownedNfts && data.ownedNfts.length > 0) {
        log(`Loaded ${data.ownedNfts.length} total NFTs from Alchemy API`, 'info');

        // Filter to only Tasern Universe NFTs using hybrid verification
        const tasernNFTs: any[] = [];
        const uniqueContracts = new Set<string>();

        for (const nft of data.ownedNfts) {
          const contractAddress = (nft.contractAddress || nft.contract?.address || '').toLowerCase();

          if (!contractAddress) continue;

          // Check if this contract is Tasern (uses whitelist + API verification)
          const isTasern = await isTasernNFT(contractAddress);

          if (isTasern) {
            tasernNFTs.push(nft);
            uniqueContracts.add(contractAddress);
          }
        }

        if (tasernNFTs.length === 0) {
          log(`No Tasern Universe NFTs found (checked ${data.ownedNfts.length} NFTs)`, 'warning');
          log(`Tasern Hub: ${TASERN_HUB_ADDRESS}`, 'info');
          return [];
        }

        log(`✅ Found ${tasernNFTs.length} Tasern NFTs from ${uniqueContracts.size} collection(s)`, 'success');
        return tasernNFTs;
      }

      // No NFTs found - return empty array (production mode)
      log('No NFTs found in wallet', 'info');
      return [];

    } catch (error) {
      log(`NFT loading failed: ${error}`, 'error');
      return [];
    }
  }

  /**
   * Check for direct impact asset holdings in contract
   */
  private async checkDirectImpactAssetHoldings(contractAddress: string): Promise<ImpactAssetHoldings> {
    const holdings = this.createEmptyHoldings();

    try {
      // Check each impact asset
      holdings.dddBalance = await this.getTokenBalance(contractAddress, IMPACT_ASSETS.DDD.address);
      holdings.axlRegenBalance = await this.getTokenBalance(contractAddress, IMPACT_ASSETS.axlREGEN.address);
      holdings.lpBalance = await this.getTokenBalance(contractAddress, IMPACT_ASSETS.LP_TOKEN.address);

      holdings.totalValue = holdings.dddBalance + holdings.axlRegenBalance + (holdings.lpBalance * 10); // LP tokens worth 10x
      holdings.discoveryMethod = holdings.totalValue > 0 ? 'direct' : 'none';

    } catch (error) {
      console.error(`Error checking direct holdings for ${contractAddress}:`, error);
    }

    return holdings;
  }

  /**
   * Check for impact asset holdings via proxy implementation
   */
  private async checkProxyImpactAssetHoldings(contractAddress: string): Promise<ImpactAssetHoldings> {
    const holdings = this.createEmptyHoldings();

    try {
      const implementation = await this.extractProxyImplementation(contractAddress);

      if (implementation && implementation !== contractAddress) {
        holdings.implementationAddress = implementation;

        // Check implementation for impact assets
        holdings.dddBalance = await this.getTokenBalance(implementation, IMPACT_ASSETS.DDD.address);
        holdings.axlRegenBalance = await this.getTokenBalance(implementation, IMPACT_ASSETS.axlREGEN.address);
        holdings.lpBalance = await this.getTokenBalance(implementation, IMPACT_ASSETS.LP_TOKEN.address);

        holdings.totalValue = holdings.dddBalance + holdings.axlRegenBalance + (holdings.lpBalance * 10);
        holdings.discoveryMethod = holdings.totalValue > 0 ? 'implementation' : 'proxy';
      }

    } catch (error) {
      console.error(`Error checking proxy holdings for ${contractAddress}:`, error);
    }

    return holdings;
  }

  /**
   * Check for impact asset holdings via transaction-discovered associated contracts (Zapper-style)
   */
  private async checkTransactionAssociatedHoldings(
    walletAddress: string,
    nftContract: string,
    tokenId: string,
    log: LogCallback
  ): Promise<ImpactAssetHoldings> {
    const holdings = this.createEmptyHoldings();

    try {
      log(`Scanning transactions for associated contracts...`, 'info');

      // Use TransactionScanner to find associated contracts
      const enhancements = await this.transactionScanner.getNFTEnhancements(
        walletAddress,
        nftContract,
        tokenId
      );

      if (enhancements.associations.length > 0) {
        log(`Found ${enhancements.associations.length} associated contract(s)`, 'success');

        // Check each associated contract for DDD/axlREGEN/LP holdings
        for (const association of enhancements.associations) {
          const contractAddress = association.contract;

          // Check for DDD
          const dddBalance = await this.getTokenBalance(contractAddress, IMPACT_ASSETS.DDD.address);
          holdings.dddBalance += dddBalance;

          // Check for axlREGEN
          const axlRegenBalance = await this.getTokenBalance(contractAddress, IMPACT_ASSETS.axlREGEN.address);
          holdings.axlRegenBalance += axlRegenBalance;

          // Check for LP tokens
          const lpBalance = await this.getTokenBalance(contractAddress, IMPACT_ASSETS.LP_TOKEN.address);
          holdings.lpBalance += lpBalance;

          if (dddBalance > 0 || axlRegenBalance > 0 || lpBalance > 0) {
            log(`✅ Found assets at ${contractAddress}: DDD=${dddBalance.toFixed(4)}, axlREGEN=${axlRegenBalance.toFixed(4)}, LP=${lpBalance.toFixed(4)}`, 'success');
          }
        }

        holdings.totalValue = holdings.dddBalance + holdings.axlRegenBalance + (holdings.lpBalance * 10);
        holdings.discoveryMethod = holdings.totalValue > 0 ? 'direct' : 'none';
      }

    } catch (error) {
      console.error(`Error checking transaction-associated holdings:`, error);
      log(`Error scanning transactions: ${error}`, 'warning');
    }

    return holdings;
  }

  /**
   * Get contract information including proxy detection
   */
  private async getContractInfo(contractAddress: string): Promise<any> {
    const info = {
      hasCode: false,
      isProxy: false,
      name: 'Unknown',
      symbol: 'Unknown'
    };

    try {
      const code = await this.provider.getBytecode({ address: contractAddress as `0x${string}` });
      info.hasCode = code !== undefined && code !== '0x';

      if (info.hasCode) {
        // Check for EIP-1167 minimal proxy pattern
        info.isProxy = code.includes('363d3d373d3d3d363d73');

        // Try to get name and symbol
        try {
          const nameData = '0x06fdde03'; // name()
          const symbolData = '0x95d89b41'; // symbol()

          const nameResult = await this.provider.call({
            to: contractAddress as `0x${string}`,
            data: nameData as `0x${string}`
          });
          const symbolResult = await this.provider.call({
            to: contractAddress as `0x${string}`,
            data: symbolData as `0x${string}`
          });

          if (nameResult && nameResult.data !== '0x') {
            info.name = this.hexToString(nameResult.data);
          }
          if (symbolResult && symbolResult.data !== '0x') {
            info.symbol = this.hexToString(symbolResult.data);
          }
        } catch (e) {
          // Name/symbol calls failed, keep defaults
        }
      }

    } catch (error) {
      console.error(`Error getting contract info for ${contractAddress}:`, error);
    }

    return info;
  }

  /**
   * Extract implementation address from proxy bytecode
   */
  private async extractProxyImplementation(contractAddress: string): Promise<string | null> {
    try {
      const bytecode = await this.provider.getBytecode({ address: contractAddress as `0x${string}` });

      if (!bytecode) return null;

      // Check for EIP-1167 minimal proxy pattern
      if (bytecode.includes('363d3d373d3d3d363d73')) {
        const patternIndex = bytecode.indexOf('363d3d373d3d3d363d73');
        if (patternIndex !== -1) {
          const implStart = patternIndex + 20;
          const implHex = bytecode.slice(implStart, implStart + 40);
          return '0x' + implHex;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error extracting proxy implementation for ${contractAddress}:`, error);
      return null;
    }
  }

  /**
   * Get token balance for an address
   */
  private async getTokenBalance(address: string, tokenAddress: string): Promise<number> {
    try {
      const balanceOf = '0x70a08231' + address.slice(2).padStart(64, '0');
      const result = await this.provider.call({
        to: tokenAddress as `0x${string}`,
        data: balanceOf as `0x${string}`
      });

      if (result && result.data && result.data !== '0x') {
        // Parse the hex result to a number
        const balance = BigInt(result.data);
        // Convert from wei to ether (18 decimals)
        return Number(balance) / 1e18;
      }
      return 0;
    } catch (error) {
      console.error(`Error getting token balance for ${address}:`, error);
      return 0;
    }
  }

  /**
   * Helper methods
   */
  private createEmptyHoldings(): ImpactAssetHoldings {
    return {
      dddBalance: 0,
      axlRegenBalance: 0,
      lpBalance: 0,
      totalValue: 0,
      discoveryMethod: 'none'
    };
  }

  private createEmptyEnhancedNFT(nft: any): EnhancedNFTData {
    return {
      contractAddress: nft.contractAddress || nft.contract?.address || '',
      tokenId: nft.tokenId || '1',
      name: nft.name || 'Unknown NFT',
      description: nft.description || '',
      image: nft.image || '',
      tokenType: nft.tokenType || 'ERC721',
      impactAssets: this.createEmptyHoldings(),
      contractInfo: {
        hasCode: false,
        isProxy: false,
        name: 'Unknown',
        symbol: 'Unknown'
      },
      enhancementLevel: 0,
      statMultipliers: { attack: 1, health: 1, defense: 1 }
    };
  }

  private combineHoldings(direct: ImpactAssetHoldings, proxy: ImpactAssetHoldings): ImpactAssetHoldings {
    const combined = this.createEmptyHoldings();
    combined.dddBalance = direct.dddBalance + proxy.dddBalance;
    combined.axlRegenBalance = direct.axlRegenBalance + proxy.axlRegenBalance;
    combined.lpBalance = direct.lpBalance + proxy.lpBalance;
    combined.totalValue = combined.dddBalance + combined.axlRegenBalance + (combined.lpBalance * 10);

    if (proxy.implementationAddress) {
      combined.implementationAddress = proxy.implementationAddress;
    }

    // Determine discovery method
    if (combined.totalValue > 0) {
      if (direct.totalValue > 0) {
        combined.discoveryMethod = 'direct';
      } else if (proxy.totalValue > 0) {
        combined.discoveryMethod = proxy.discoveryMethod;
      }
    }

    return combined;
  }

  private combineMultipleHoldings(holdingsArray: ImpactAssetHoldings[]): ImpactAssetHoldings {
    const combined = this.createEmptyHoldings();

    for (const holdings of holdingsArray) {
      combined.dddBalance += holdings.dddBalance;
      combined.axlRegenBalance += holdings.axlRegenBalance;
      combined.lpBalance += holdings.lpBalance;

      // Preserve implementation address if found
      if (holdings.implementationAddress && !combined.implementationAddress) {
        combined.implementationAddress = holdings.implementationAddress;
      }

      // Use first non-'none' discovery method
      if (holdings.discoveryMethod !== 'none' && combined.discoveryMethod === 'none') {
        combined.discoveryMethod = holdings.discoveryMethod;
      }
    }

    combined.totalValue = combined.dddBalance + combined.axlRegenBalance + (combined.lpBalance * 10);

    return combined;
  }

  private calculateEnhancementLevel(totalValue: number): number {
    if (totalValue >= 1.0) return 5;
    if (totalValue >= 0.5) return 4;
    if (totalValue >= 0.1) return 3;
    if (totalValue >= 0.01) return 2;
    if (totalValue > 0) return 1;
    return 0;
  }

  private calculateStatMultipliers(holdings: ImpactAssetHoldings): { attack: number; health: number; defense: number } {
    // Revolutionary formula: Each 0.01 LP = +5% to all stats
    const lpBonus = holdings.lpBalance * 100; // Convert to percentage points
    const bonusPercentage = lpBonus * 5; // 5% per 0.01 LP

    const multiplier = 1 + (bonusPercentage / 100);

    return {
      attack: Math.max(1, multiplier),
      health: Math.max(1, multiplier),
      defense: Math.max(1, multiplier)
    };
  }

  private hexToString(hex: string): string {
    try {
      const dataHex = hex.slice(130); // Skip offset and length
      let str = '';
      for (let i = 0; i < dataHex.length; i += 2) {
        const charCode = parseInt(dataHex.substr(i, 2), 16);
        if (charCode > 0) str += String.fromCharCode(charCode);
      }
      return str || 'Unknown';
    } catch (e) {
      return 'Unknown';
    }
  }
}

export default UniversalImpactScanner;
