/**
 * Wagmi Configuration
 *
 * RainbowKit and Wagmi setup for Polygon network
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon } from 'wagmi/chains';
import {
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  metaMaskWallet,
} from '@rainbow-me/rainbowkit/wallets';

export const config = getDefaultConfig({
  appName: 'Tasern Siegefront',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [polygon],
  ssr: false,
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        walletConnectWallet,
        coinbaseWallet,
        rainbowWallet,
      ],
    },
  ],
});
