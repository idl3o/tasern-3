/**
 * Wallet Connect Component
 *
 * Wagmi and RainbowKit powered wallet connection with Tasern theming
 */

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const WalletConnect: React.FC = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} style={styles.connectButton}>
                    <span style={styles.buttonText}>⚔️ Connect Wallet</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} style={styles.wrongNetworkButton}>
                    <span style={styles.buttonText}>❌ Wrong Network</span>
                  </button>
                );
              }

              return (
                <div style={styles.connectedContainer}>
                  <button onClick={openAccountModal} style={styles.accountButton}>
                    <span style={styles.address}>
                      {account.displayName}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

const styles: Record<string, React.CSSProperties> = {
  connectButton: {
    backgroundColor: '#D4AF37', // Tasern gold
    color: '#1a1a1a',
    border: '2px solid #8B6914', // Bronze
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  wrongNetworkButton: {
    backgroundColor: '#8B0000', // Dark red
    color: '#F4E4C1', // Parchment
    border: '2px solid #5C0000',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Cinzel', serif",
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  connectedContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  accountButton: {
    backgroundColor: '#1E3A8A', // Deep blue
    color: '#F4E4C1', // Parchment
    border: '2px solid #1E40AF',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Crimson Text', serif",
  },
  address: {
    fontWeight: 'bold',
  },
  buttonText: {
    display: 'inline-block',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1a1410',
    border: '3px solid #D4AF37',
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '400px',
    width: '90%',
  },
  modalTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: '24px',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: '1.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  connectorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  connectorButton: {
    backgroundColor: '#5C4033',
    color: '#F4E4C1',
    border: '2px solid #8B6914',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: "'Crimson Text', serif",
  },
  closeButton: {
    backgroundColor: '#6B7280',
    color: '#F4E4C1',
    border: '2px solid #4B5563',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    width: '100%',
    fontFamily: "'Crimson Text', serif",
  },
};
