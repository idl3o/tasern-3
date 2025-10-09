/**
 * NFT Cards Store
 *
 * Wallet-specific NFT cards storage for PVP support
 * Each wallet address has its own NFT card collection
 */

import { create } from 'zustand';
import type { Card } from '../types/core';

interface NFTCardsState {
  // Map of wallet address -> NFT cards
  nftCardsByWallet: Record<string, Card[]>;
  isScanning: boolean;

  // Set NFT cards for a specific wallet
  setNFTCards: (walletAddress: string, cards: Card[]) => void;

  // Get NFT cards for a specific wallet
  getNFTCards: (walletAddress: string | undefined) => Card[];

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
      [walletAddress.toLowerCase()]: cards
    }
  })),

  getNFTCards: (walletAddress) => {
    if (!walletAddress) return [];
    return get().nftCardsByWallet[walletAddress.toLowerCase()] || [];
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
