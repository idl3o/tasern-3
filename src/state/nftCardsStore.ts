/**
 * NFT Cards Store
 *
 * Wallet-specific NFT cards storage for PVP support
 * Each wallet address has its own NFT card collection
 * Supports portfolio aggregation across multiple wallets
 * Includes cache eviction for stale data
 */

import { create } from 'zustand';
import type { Card } from '../types/core';
import { useWalletPortfolioStore } from './walletPortfolioStore';

// Cache settings
const CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours - data older than this is stale
const CACHE_WARN_AGE_MS = 1 * 60 * 60 * 1000; // 1 hour - warn about potentially stale data

interface CachedCards {
  cards: Card[];
  cachedAt: number;
}

interface NFTCardsState {
  // Map of wallet address -> cached NFT cards with timestamp
  nftCardsByWallet: Record<string, CachedCards>;
  isScanning: boolean;

  // Set NFT cards for a specific wallet (updates timestamp)
  setNFTCards: (walletAddress: string, cards: Card[]) => void;

  // Get NFT cards for a specific wallet (returns empty if stale and forceRefresh=true)
  getNFTCards: (walletAddress: string | undefined) => Card[];

  // Get ALL NFT cards from portfolio (aggregated across all linked wallets)
  getPortfolioCards: () => Card[];

  // Check if wallet cache is stale
  isCacheStale: (walletAddress: string) => boolean;

  // Get cache age in milliseconds
  getCacheAge: (walletAddress: string) => number | null;

  // Clear stale caches across all wallets
  evictStaleCaches: () => number;

  setIsScanning: (scanning: boolean) => void;

  // Clear all NFT cards (or for specific wallet)
  clearNFTCards: (walletAddress?: string) => void;
}

export const useNFTCardsStore = create<NFTCardsState>((set, get) => ({
  nftCardsByWallet: {},
  isScanning: false,

  setNFTCards: (walletAddress, cards) => set((state) => ({
    nftCardsByWallet: {
      ...state.nftCardsByWallet,
      [walletAddress.toLowerCase()]: {
        cards,
        cachedAt: Date.now()
      }
    }
  })),

  getNFTCards: (walletAddress) => {
    if (!walletAddress) return [];
    const cached = get().nftCardsByWallet[walletAddress.toLowerCase()];
    if (!cached) return [];

    // Warn if cache is getting old (but still return it)
    const age = Date.now() - cached.cachedAt;
    if (age > CACHE_WARN_AGE_MS) {
      console.warn(`⚠️ NFT cache for ${walletAddress.slice(0, 6)}... is ${Math.floor(age / 60000)}min old - consider rescanning`);
    }

    return cached.cards;
  },

  getPortfolioCards: () => {
    const portfolioStore = useWalletPortfolioStore.getState();
    const addresses = portfolioStore.getAllPortfolioAddresses();
    const nftCardsByWallet = get().nftCardsByWallet;

    // Aggregate cards from all portfolio addresses
    const allCards: Card[] = [];
    const seenIds = new Set<string>();
    let staleCount = 0;

    for (const address of addresses) {
      const cached = nftCardsByWallet[address.toLowerCase()];
      if (!cached) continue;

      // Track stale caches
      if (Date.now() - cached.cachedAt > CACHE_MAX_AGE_MS) {
        staleCount++;
      }

      for (const card of cached.cards) {
        // Avoid duplicates (same card ID)
        if (!seenIds.has(card.id)) {
          seenIds.add(card.id);
          allCards.push(card);
        }
      }
    }

    if (staleCount > 0) {
      console.warn(`⚠️ ${staleCount} wallet cache(s) are stale (>2h old) - consider rescanning`);
    }

    console.log(`📦 Portfolio cards: ${allCards.length} total from ${addresses.length} wallet(s)`);
    return allCards;
  },

  isCacheStale: (walletAddress) => {
    const cached = get().nftCardsByWallet[walletAddress.toLowerCase()];
    if (!cached) return true; // No cache = stale
    return Date.now() - cached.cachedAt > CACHE_MAX_AGE_MS;
  },

  getCacheAge: (walletAddress) => {
    const cached = get().nftCardsByWallet[walletAddress.toLowerCase()];
    if (!cached) return null;
    return Date.now() - cached.cachedAt;
  },

  evictStaleCaches: () => {
    const state = get();
    const now = Date.now();
    let evictedCount = 0;

    const updated: Record<string, CachedCards> = {};

    for (const [address, cached] of Object.entries(state.nftCardsByWallet)) {
      if (now - cached.cachedAt <= CACHE_MAX_AGE_MS) {
        // Keep fresh caches
        updated[address] = cached;
      } else {
        // Evict stale cache
        evictedCount++;
        console.log(`🗑️ Evicted stale NFT cache for ${address.slice(0, 6)}... (${Math.floor((now - cached.cachedAt) / 60000)}min old)`);
      }
    }

    if (evictedCount > 0) {
      set({ nftCardsByWallet: updated });
    }

    return evictedCount;
  },

  setIsScanning: (scanning) => set({ isScanning: scanning }),

  clearNFTCards: (walletAddress) => set((state) => {
    if (!walletAddress) {
      // Clear all
      return { nftCardsByWallet: {} };
    }
    // Clear specific wallet
    const updated = { ...state.nftCardsByWallet };
    delete updated[walletAddress.toLowerCase()];
    return { nftCardsByWallet: updated };
  }),
}));

// Export cache constants for external use
export { CACHE_MAX_AGE_MS, CACHE_WARN_AGE_MS };
