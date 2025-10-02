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
 * Known Tasern Universe NFT contracts on Polygon
 * Add discovered contracts here
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
    });
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
    })) as bigint;

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
      })) as string;
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
        })) as bigint;

        // Get token URI
        const tokenURI = (await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC721_ABI,
          functionName: 'tokenURI',
          args: [tokenId],
        })) as string;

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

