/**
 * NFT Gallery Component
 *
 * Display Tasern Universe NFTs as playable cards
 * Wallet-gated: connect wallet → scan NFTs → show as cards
 */

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { WalletConnect } from './WalletConnect';
import { CardDisplay } from './CardDisplay';
import { scanWalletForTasernNFTs, type TasernNFT } from '../utils/nftScanner';
import { getPlayableNFTCards } from '../utils/nftToCard';
import { scanWalletForLPBonus, KNOWN_LP_CONTRACTS } from '../utils/lpTokenQuery';
import { batchAnalyzeProvenance, type ProvenanceInfo } from '../utils/nftProvenance';
import type { Card } from '../types/core';
import { TASERN_COLORS, TASERN_TYPOGRAPHY, TASERN_SHADOWS } from '../styles/tasernTheme';

interface NFTGalleryProps {
  onClose: () => void;
  onSelectCard?: (card: Card) => void;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ onClose, onSelectCard }) => {
  const { address: account, isConnected } = useAccount();
  const [nfts, setNfts] = useState<TasernNFT[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lpBonus, setLpBonus] = useState(0);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [provenance, setProvenance] = useState<Map<string, ProvenanceInfo>>(new Map());

  // Scan for NFTs when wallet connects
  useEffect(() => {
    if (isConnected && account) {
      scanWallet(account);
    } else {
      setNfts([]);
      setCards([]);
      setLpBonus(0);
    }
  }, [isConnected, account]);

  const scanWallet = async (walletAddress: string) => {
    setIsScanning(true);

    try {
      console.log(`🔍 Starting wallet scan for ${walletAddress}...`);

      // Scan for LP bonus and NFTs in parallel
      const [lpData, foundNFTs] = await Promise.all([
        scanWalletForLPBonus(walletAddress, KNOWN_LP_CONTRACTS),
        scanWalletForTasernNFTs(walletAddress),
      ]);

      console.log(`✅ Scan complete! LP: ${lpData.totalBonus}%, NFTs: ${foundNFTs.length}`);

      setLpBonus(lpData.totalBonus);
      setNfts(foundNFTs);

      console.log(`💎 LP Bonus: ${lpData.totalBonus}%`);
      console.log(`🔍 Found ${foundNFTs.length} NFTs, analyzing provenance...`);

      // Analyze provenance for authenticity
      const provenanceResults = await batchAnalyzeProvenance(foundNFTs, walletAddress);
      setProvenance(provenanceResults);

      // Convert ALL NFTs to cards (no filtering)
      const allCards = foundNFTs.map(nft => {
        const card = getPlayableNFTCards([nft], lpData.totalBonus)[0];
        return card;
      }).filter(card => card !== undefined);

      setCards(allCards);

      console.log(`🎴 Showing ${allCards.length} NFTs as cards`);
      console.log(
        `✨ ${Array.from(provenanceResults.values()).filter((p) => p.isAuthentic).length} verified as authentic Tasern NFTs`
      );
    } catch (error) {
      console.error('Error scanning wallet:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
  };

  const handleUseCard = () => {
    if (selectedCard && onSelectCard) {
      onSelectCard(selectedCard);
      onClose();
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🎴 NFT Card Gallery 🎴</h1>
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <p style={styles.subtitle}>
          Select an NFT to use as a playable card in battle
        </p>

        {/* Wallet Connection */}
        {!isConnected && (
          <div style={styles.walletSection}>
            <p style={styles.walletPrompt}>Connect your wallet to view your NFT cards</p>
            <WalletConnect />
          </div>
        )}

        {/* Scanning State */}
        {isConnected && isScanning && (
          <div style={styles.scanningSection}>
            <div style={styles.spinner}>⚔️</div>
            <p style={styles.scanningText}>Scanning for Tasern NFTs...</p>
          </div>
        )}

        {/* LP Bonus Display */}
        {isConnected && !isScanning && lpBonus > 0 && (
          <div style={styles.bonusSection}>
            <span style={styles.bonusText}>
              💎 LP Bonus: +{lpBonus.toFixed(1)}% to all stats
            </span>
          </div>
        )}

        {/* Empty State */}
        {isConnected && !isScanning && cards.length === 0 && (
          <div style={styles.emptySection}>
            <p style={styles.emptyText}>No NFTs found in this wallet</p>
            <p style={styles.emptySubtext}>
              Connect a wallet with NFTs to view them as playable cards
            </p>
          </div>
        )}

        {/* Card Grid */}
        {isConnected && !isScanning && cards.length > 0 && (
          <div style={styles.cardGrid}>
            {cards.map((card) => {
              // Get provenance info for this card
              const nft = nfts.find(
                (n) => `nft-${n.contract}-${n.tokenId}` === card.id
              );
              const provenanceKey = nft ? `${nft.contract}:${nft.tokenId}` : '';
              const provenanceInfo = provenance.get(provenanceKey);

              return (
                <div
                  key={card.id}
                  style={{
                    ...styles.cardWrapper,
                    ...(selectedCard?.id === card.id ? styles.cardWrapperSelected : {}),
                  }}
                  onClick={() => handleCardClick(card)}
                >
                  <CardDisplay card={card} />
                  <div style={styles.nftBadge}>NFT</div>

                  {/* Provenance Badges */}
                  {provenanceInfo?.isAuthentic && (
                    <div style={styles.authenticBadge} title={`Authenticity Score: ${provenanceInfo.authenticityScore}`}>
                      ✨ Verified Tasern
                    </div>
                  )}
                  {provenanceInfo?.wasMintedByJames && (
                    <div style={styles.jamesBadge} title="Minted by James McGee">
                      👑 From James
                    </div>
                  )}
                  {provenanceInfo?.wasDirectFromJames && !provenanceInfo.wasMintedByJames && (
                    <div style={styles.directBadge} title="Direct transfer from James McGee">
                      🎁 Gift from James
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Card Actions */}
        {selectedCard && onSelectCard && (
          <div style={styles.actionsSection}>
            <button style={styles.useButton} onClick={handleUseCard}>
              ⚔️ Play with {selectedCard.name}
            </button>
          </div>
        )}

        {/* Footer Stats */}
        {isConnected && !isScanning && cards.length > 0 && (
          <div style={styles.footer}>
            <p style={styles.footerText}>
              {cards.length} NFT Card{cards.length !== 1 ? 's' : ''} • {nfts.length} NFT
              {nfts.length !== 1 ? 's' : ''} Total
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem',
  },
  container: {
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.2) 0%, rgba(26, 20, 16, 0.95) 100%)',
    border: `3px solid ${TASERN_COLORS.gold}`,
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '1200px',
    maxHeight: '90vh',
    width: '100%',
    boxShadow: TASERN_SHADOWS.glowGold,
    backdropFilter: 'blur(10px)',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.glowGold,
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    color: TASERN_COLORS.gold,
    fontSize: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  subtitle: {
    fontFamily: TASERN_TYPOGRAPHY.accent,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.parchment,
    textAlign: 'center',
    marginBottom: '2rem',
    opacity: 0.9,
  },
  walletSection: {
    textAlign: 'center',
    padding: '3rem',
  },
  walletPrompt: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    marginBottom: '2rem',
  },
  scanningSection: {
    textAlign: 'center',
    padding: '4rem',
  },
  spinner: {
    fontSize: '48px',
    animation: 'spin 2s linear infinite',
  },
  scanningText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.gold,
    marginTop: '1rem',
  },
  bonusSection: {
    textAlign: 'center',
    padding: '1rem',
    marginBottom: '1rem',
    background: 'rgba(212, 175, 55, 0.1)',
    border: `1px solid ${TASERN_COLORS.gold}`,
    borderRadius: '8px',
  },
  bonusText: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.gold,
  },
  emptySection: {
    textAlign: 'center',
    padding: '4rem',
  },
  emptyText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    marginBottom: '1rem',
  },
  emptySubtext: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.bronze,
    opacity: 0.8,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  cardWrapper: {
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.3s',
    transform: 'scale(1)',
    border: '2px solid transparent',
    borderRadius: '8px',
  },
  cardWrapperSelected: {
    transform: 'scale(1.05)',
    border: `2px solid ${TASERN_COLORS.gold}`,
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  nftBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: TASERN_COLORS.purple,
    color: TASERN_COLORS.parchment,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    textTransform: 'uppercase',
  },
  authenticBadge: {
    position: 'absolute',
    top: '40px',
    left: '8px',
    right: '8px',
    background: 'rgba(212, 175, 55, 0.95)',
    color: '#1a1a1a',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    textTransform: 'uppercase',
    textAlign: 'center',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  jamesBadge: {
    position: 'absolute',
    top: '64px',
    left: '8px',
    right: '8px',
    background: 'rgba(139, 0, 0, 0.95)',
    color: TASERN_COLORS.gold,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    textTransform: 'uppercase',
    textAlign: 'center',
    border: `1px solid ${TASERN_COLORS.gold}`,
  },
  directBadge: {
    position: 'absolute',
    top: '64px',
    left: '8px',
    right: '8px',
    background: 'rgba(5, 95, 70, 0.95)',
    color: TASERN_COLORS.parchment,
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  actionsSection: {
    textAlign: 'center',
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: `1px solid ${TASERN_COLORS.bronze}`,
  },
  useButton: {
    backgroundColor: TASERN_COLORS.gold,
    color: '#1a1a1a',
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    fontWeight: 'bold',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${TASERN_COLORS.bronze}`,
  },
  footerText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.bronze,
    opacity: 0.8,
  },
};
