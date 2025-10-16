/**
 * NFT Scanner Utility
 *
 * Scan wallet for Tasern Universe NFTs on Polygon
 */

import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

const polygonRpcUrl = process.env.REACT_APP_POLYGON_RPC_URL || 'https://polygon-rpc.com';

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(polygonRpcUrl),
});

// ERC721 ABI for NFT queries
const ERC721_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'tokenURI',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;

export interface TasernNFT {
  contract: string;
  tokenId: string;
  name: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  metadata?: any;
}

/**
 * Tasern Hub address (talesoftasern.eth)
 * All legitimate Tasern NFTs originate from or interact with this hub
 */
export const TASERN_HUB_ADDRESS = '0x0780b1456d5e60cf26c8cd6541b85e805c8c05f2';

/**
 * Known Tasern Universe NFT contracts on Polygon (whitelist for fast verification)
 * Add discovered contracts here to skip API verification
 */
export const TASERN_NFT_CONTRACTS = [
  '0x0780b1456d5e60cf26c8cd6541b85e805c8c05f2', // TOT Hub - Tales of Tasern
];

/**
 * Check if contract is ERC721 enumerable
 */
async function isERC721Enumerable(contractAddress: string): Promise<boolean> {
  try {
    // Try to call balanceOf - if it exists, likely ERC721
    await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: ['0x0000000000000000000000000000000000000000' as `0x${string}`],
    } as any);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch NFT metadata from tokenURI
 */
async function fetchNFTMetadata(tokenURI: string): Promise<any> {
  try {
    // Handle IPFS URLs
    let url = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch metadata from ${url}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

/**
 * Scan a single NFT contract for owned tokens
 */
export async function scanNFTContract(
  contractAddress: string,
  walletAddress: string
): Promise<TasernNFT[]> {
  const nfts: TasernNFT[] = [];

  try {
    // Get balance
    const balance = (await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    } as any)) as bigint;

    console.log(`Found ${balance} NFTs in contract ${contractAddress}`);

    if (balance === BigInt(0)) {
      return [];
    }

    // Get contract name
    let contractName = 'Unknown Collection';
    try {
      contractName = (await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'name',
      } as any)) as string;
    } catch {
      console.warn('Could not fetch contract name');
    }

    // Fetch each token
    for (let i = 0; i < Number(balance); i++) {
      try {
        // Get token ID by index
        const tokenId = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'tokenOfOwnerByIndex',
          args: [walletAddress as `0x${string}`, BigInt(i)],
        } as any)) as bigint;

        // Get token URI
        const tokenURI = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'tokenURI',
          args: [tokenId],
        } as any)) as string;

        // Fetch metadata
        const metadata = await fetchNFTMetadata(tokenURI);

        nfts.push({
          contract: contractAddress,
          tokenId: tokenId.toString(),
          name: metadata?.name || `${contractName} #${tokenId}`,
          description: metadata?.description,
          image: metadata?.image,
          attributes: metadata?.attributes,
          metadata,
        });
      } catch (error) {
        console.error(`Error fetching token ${i} from ${contractAddress}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error scanning contract ${contractAddress}:`, error);
  }

  return nfts;
}

/**
 * Verify if an NFT contract is associated with Tasern Hub using Alchemy getAssetTransfers
 * Checks for any historical interaction (minting, transfers, etc.) with Tasern Hub
 */
export async function verifyTasernHubAssociation(
  contractAddress: string
): Promise<boolean> {
  try {
    const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY || 'demo';
    const alchemyUrl = `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;

    // Check interactions in both directions (contract -> hub, hub -> contract)
    const requests = [
      // Check if hub sent NFTs from this contract
      fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromAddress: TASERN_HUB_ADDRESS,
            contractAddresses: [contractAddress],
            category: ['erc721', 'erc1155'],
            maxCount: '0x1', // Only need to find 1 interaction
            excludeZeroValue: false
          }]
        })
      }),
      // Check if this contract sent to hub
      fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'alchemy_getAssetTransfers',
          params: [{
            toAddress: TASERN_HUB_ADDRESS,
            contractAddresses: [contractAddress],
            category: ['erc721', 'erc1155'],
            maxCount: '0x1',
            excludeZeroValue: false
          }]
        })
      })
    ];

    const responses = await Promise.all(requests);
    const results = await Promise.all(responses.map(r => r.json()));

    // If either direction has transfers, it's a Tasern NFT
    const hasInteraction = results.some(result =>
      result.result?.transfers && result.result.transfers.length > 0
    );

    if (hasInteraction) {
      console.log(`✅ Verified ${contractAddress} is associated with Tasern Hub`);
    }

    return hasInteraction;
  } catch (error) {
    console.error(`Error verifying Tasern Hub association for ${contractAddress}:`, error);
    return false;
  }
}

/**
 * Check if contract is a Tasern NFT (hybrid approach)
 * 1. Fast check against whitelist
 * 2. If not whitelisted, verify via Alchemy API
 */
export async function isTasernNFT(contractAddress: string): Promise<boolean> {
  const normalized = contractAddress.toLowerCase();

  // Fast path: check whitelist
  if (TASERN_NFT_CONTRACTS.some(addr => addr.toLowerCase() === normalized)) {
    return true;
  }

  // Slow path: verify via Alchemy API
  return await verifyTasernHubAssociation(contractAddress);
}

/**
 * Scan wallet for all Tasern NFTs
 */
export async function scanWalletForTasernNFTs(
  walletAddress: string
): Promise<TasernNFT[]> {
  console.log(`🔍 Scanning wallet ${walletAddress} for Tasern NFTs...`);

  const allNFTs: TasernNFT[] = [];

  // Scan known Tasern contracts
  for (const contract of TASERN_NFT_CONTRACTS) {
    const nfts = await scanNFTContract(contract, walletAddress);
    allNFTs.push(...nfts);
  }

  console.log(`✅ Found ${allNFTs.length} Tasern NFTs`);
  return allNFTs;
}

