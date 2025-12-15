/**
 * Wallet Portfolio Store
 *
 * Manages multi-address portfolio for NFT/LP aggregation.
 * Supports verified (connected) and read-only (manually added) addresses.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LinkedAddress {
  address: string;
  label: string;
  verified: boolean;      // Was this address ever connected & signed?
  addedAt: number;
  lastScanned: number | null;
}

interface WalletPortfolioState {
  // The currently connected (signature-verified) address
  primaryAddress: string | null;

  // Additional addresses in portfolio (includes previously connected)
  linkedAddresses: LinkedAddress[];

  // Aggregation settings
  aggregateNFTs: boolean;
  aggregateLP: boolean;

  // Actions
  setPrimaryAddress: (address: string | null) => void;
  addLinkedAddress: (address: string, label?: string, verified?: boolean) => void;
  removeLinkedAddress: (address: string) => void;
  updateLinkedAddress: (address: string, updates: Partial<LinkedAddress>) => void;
  setAggregateNFTs: (value: boolean) => void;
  setAggregateLP: (value: boolean) => void;

  // Computed helpers
  getAllPortfolioAddresses: () => string[];
  getVerifiedAddresses: () => string[];
  isAddressInPortfolio: (address: string) => boolean;

  // Clear on full disconnect
  clearPortfolio: () => void;
}

export const useWalletPortfolioStore = create<WalletPortfolioState>()(
  persist(
    (set, get) => ({
      primaryAddress: null,
      linkedAddresses: [],
      aggregateNFTs: true,
      aggregateLP: true,

      setPrimaryAddress: (address) => {
        const normalized = address?.toLowerCase() || null;

        set({ primaryAddress: normalized });

        // Auto-add to linked addresses if new and not already present
        if (normalized && !get().isAddressInPortfolio(normalized)) {
          get().addLinkedAddress(normalized, 'Primary Wallet', true);
        } else if (normalized) {
          // Mark as verified if reconnecting
          get().updateLinkedAddress(normalized, { verified: true });
        }
      },

      addLinkedAddress: (address, label = 'Linked Wallet', verified = false) => {
        const normalized = address.toLowerCase();

        // Don't add duplicates
        if (get().isAddressInPortfolio(normalized)) {
          console.log('📋 Address already in portfolio:', normalized.slice(0, 8));
          return;
        }

        const newAddress: LinkedAddress = {
          address: normalized,
          label,
          verified,
          addedAt: Date.now(),
          lastScanned: null,
        };

        set((state) => ({
          linkedAddresses: [...state.linkedAddresses, newAddress]
        }));

        console.log(`✅ Added ${verified ? 'verified' : 'read-only'} address to portfolio:`, normalized.slice(0, 8));
      },

      removeLinkedAddress: (address) => {
        const normalized = address.toLowerCase();

        set((state) => ({
          linkedAddresses: state.linkedAddresses.filter(
            (a) => a.address !== normalized
          ),
          // Clear primary if removing it
          primaryAddress: state.primaryAddress === normalized ? null : state.primaryAddress
        }));

        console.log('🗑️ Removed address from portfolio:', normalized.slice(0, 8));
      },

      updateLinkedAddress: (address, updates) => {
        const normalized = address.toLowerCase();

        set((state) => ({
          linkedAddresses: state.linkedAddresses.map((a) =>
            a.address === normalized ? { ...a, ...updates } : a
          )
        }));
      },

      setAggregateNFTs: (value) => set({ aggregateNFTs: value }),
      setAggregateLP: (value) => set({ aggregateLP: value }),

      getAllPortfolioAddresses: () => {
        return get().linkedAddresses.map((a) => a.address);
      },

      getVerifiedAddresses: () => {
        return get().linkedAddresses
          .filter((a) => a.verified)
          .map((a) => a.address);
      },

      isAddressInPortfolio: (address) => {
        const normalized = address.toLowerCase();
        return get().linkedAddresses.some((a) => a.address === normalized);
      },

      clearPortfolio: () => {
        set({
          primaryAddress: null,
          linkedAddresses: [],
        });
        console.log('🧹 Portfolio cleared');
      },
    }),
    {
      name: 'tasern-wallet-portfolio',
      // Only persist these fields
      partialize: (state) => ({
        linkedAddresses: state.linkedAddresses,
        aggregateNFTs: state.aggregateNFTs,
        aggregateLP: state.aggregateLP,
      }),
    }
  )
);

// Selector hooks for common patterns
export const usePortfolioAddresses = () =>
  useWalletPortfolioStore((state) => state.getAllPortfolioAddresses());

export const useAggregationSettings = () =>
  useWalletPortfolioStore((state) => ({
    aggregateNFTs: state.aggregateNFTs,
    aggregateLP: state.aggregateLP,
  }));
