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
import { enhancedNFTsToCards } from '../utils/nftToCard';
import { UniversalImpactScanner, type EnhancedNFTData, type ScanProgress } from '../utils/universalImpactScanner';
import { useNFTCardsStore } from '../state/nftCardsStore';
import type { Card } from '../types/core';
import { TASERN_COLORS, TASERN_TYPOGRAPHY, TASERN_SHADOWS } from '../styles/tasernTheme';

interface NFTGalleryProps {
  onClose: () => void;
  onSelectCard?: (card: Card) => void;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ onClose, onSelectCard }) => {
  const { address: account, isConnected } = useAccount();
  const { setNFTCards, setIsScanning: setGlobalScanning } = useNFTCardsStore();
  const [enhancedNFTs, setEnhancedNFTs] = useState<EnhancedNFTData[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [rescanCooldown, setRescanCooldown] = useState<number>(0);
  const [showOnlyWithLP, setShowOnlyWithLP] = useState<boolean>(false);

  // Cooldown timer countdown
  useEffect(() => {
    if (rescanCooldown > 0) {
      const timer = setTimeout(() => {
        setRescanCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [rescanCooldown]);

  // Track previous account to detect genuine changes
  const [previousAccount, setPreviousAccount] = useState<string | undefined>(undefined);

  // Load cached cards or trigger scan when wallet connects
  // Only runs on genuine account changes, not re-renders
  useEffect(() => {
    // Only act if account actually changed
    if (account !== previousAccount) {
      setPreviousAccount(account);

      if (isConnected && account) {
        // Check if we already have NFT cards for this wallet in the store
        const existingCards = useNFTCardsStore.getState().getNFTCards(account);

        if (existingCards.length === 0) {
          // No cached cards - scan wallet
          console.log(`🔍 NFTGallery: Starting scan for ${account.slice(0, 6)}...${account.slice(-4)}`);
          scanWallet(account);
        } else {
          // Use cached cards
          console.log(`📦 NFTGallery: Using ${existingCards.length} cached NFT cards for ${account.slice(0, 6)}...${account.slice(-4)}`);
          setCards(existingCards);
        }
      } else if (!account && previousAccount) {
        // Wallet disconnected - clear local state only (don't clear store)
        console.log('🔌 NFTGallery: Wallet disconnected, clearing local state');
        setEnhancedNFTs([]);
        setCards([]);
        setScanProgress(null);
        setScanLogs([]);
      }
    }
  }, [isConnected, account, previousAccount]);

  const quickRefresh = async (walletAddress: string) => {
    if (enhancedNFTs.length === 0) {
      console.warn('No NFTs to refresh - run full scan first');
      return;
    }

    setIsScanning(true);
    setScanProgress(null);
    setScanLogs([]);

    try {
      console.log(`⚡ Quick refresh: Updating LP balances for ${enhancedNFTs.length} cards...`);

      // Initialize scanner
      const scanner = new UniversalImpactScanner();

      // Progress callback
      const onProgress = (progress: ScanProgress) => {
        setScanProgress(progress);
      };

      // Log callback
      const onLog = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        setScanLogs(prev => [...prev, `${emoji} ${message}`]);
      };

      // Quick refresh LP balances only
      const refreshedData = await scanner.quickRefreshLPBalances(
        walletAddress,
        enhancedNFTs,
        onProgress,
        onLog
      );

      console.log(`✅ Quick refresh complete! Updated ${refreshedData.length} cards`);

      setEnhancedNFTs(refreshedData);

      // Convert to cards
      const playableCards = enhancedNFTsToCards(refreshedData);
      setCards(playableCards);

      // Update store
      setNFTCards(walletAddress, playableCards);

      const lpEnhancedCount = refreshedData.filter(nft => nft.impactAssets.totalValue > 0).length;
      console.log(`💎 ${lpEnhancedCount} NFTs have LP enhancements`);

      // Set last scan time and start cooldown (15 seconds for quick refresh)
      setLastScanTime(Date.now());
      setRescanCooldown(15);
    } catch (error) {
      console.error('Error during quick refresh:', error);
      setScanLogs(prev => [...prev, `❌ Quick refresh failed: ${error}`]);
    } finally {
      setIsScanning(false);
    }
  };

  const scanWallet = async (walletAddress: string) => {
    // Validate wallet address before scanning
    if (!walletAddress || typeof walletAddress !== 'string' || !walletAddress.startsWith('0x')) {
      console.error('Invalid wallet address provided to scanWallet');
      setScanLogs(prev => [...prev, `❌ Invalid wallet address`]);
      return;
    }

    setIsScanning(true);
    setGlobalScanning(true);
    setScanProgress(null);
    setScanLogs([]);

    try {
      console.log(`🔍 Starting advanced impact asset scan for ${walletAddress}...`);

      // Initialize Universal Impact Scanner
      const scanner = new UniversalImpactScanner();

      // Progress callback
      const onProgress = (progress: ScanProgress) => {
        setScanProgress(progress);
      };

      // Log callback
      const onLog = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        setScanLogs(prev => [...prev, `${emoji} ${message}`]);
      };

      // Scan for NFTs with impact asset discovery
      const enhancedData = await scanner.scanWalletForImpactAssets(
        walletAddress,
        onProgress,
        onLog
      );

      // Validate response
      if (!Array.isArray(enhancedData)) {
        console.error('Invalid scan response - expected array');
        setScanLogs(prev => [...prev, `❌ Invalid scan response`]);
        setEnhancedNFTs([]);
        setCards([]);
        return;
      }

      console.log(`✅ Advanced scan complete! Found ${enhancedData.length} NFTs`);

      setEnhancedNFTs(enhancedData);

      // Convert enhanced NFTs to playable cards (with error handling)
      let playableCards: Card[] = [];
      try {
        playableCards = enhancedNFTsToCards(enhancedData);
      } catch (conversionError) {
        console.error('Error converting NFTs to cards:', conversionError);
        setScanLogs(prev => [...prev, `⚠️ Some cards failed to convert`]);
        // Continue with empty cards rather than crashing
      }

      setCards(playableCards);

      // Save to global store for deck selection (wallet-specific)
      setNFTCards(walletAddress, playableCards);
      console.log(`💾 Saved ${playableCards.length} NFT cards for wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);

      const lpEnhancedCount = enhancedData.filter(nft => nft?.impactAssets?.totalValue > 0).length;
      console.log(`💎 ${lpEnhancedCount} NFTs have LP enhancements`);

      // Set last scan time and start cooldown (30 seconds)
      setLastScanTime(Date.now());
      setRescanCooldown(30);
    } catch (error) {
      console.error('Error scanning wallet:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setScanLogs(prev => [...prev, `❌ Scan failed: ${errorMessage}`]);
      // Ensure we don't leave stale data
      setEnhancedNFTs([]);
      setCards([]);
    } finally {
      setIsScanning(false);
      setGlobalScanning(false);
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

  // Format time since last scan
  const getTimeSinceLastScan = (): string => {
    if (!lastScanTime) return '';
    const seconds = Math.floor((Date.now() - lastScanTime) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>🎴 NFT Card Gallery 🎴</h1>
          <div style={styles.headerButtons}>
            {isConnected && account && !isScanning && enhancedNFTs.length > 0 && (
              <button
                style={{
                  ...styles.quickRefreshButton,
                  ...(rescanCooldown > 0 ? styles.rescanButtonDisabled : {})
                }}
                onClick={() => rescanCooldown === 0 && quickRefresh(account)}
                disabled={rescanCooldown > 0}
                title={
                  rescanCooldown > 0
                    ? `Please wait ${rescanCooldown}s before refreshing`
                    : 'Quick refresh LP balances only (5-10x faster)'
                }
              >
                {rescanCooldown > 0 ? `⏳ ${rescanCooldown}s` : '⚡ Quick Refresh'}
              </button>
            )}
            {isConnected && account && !isScanning && (
              <button
                style={{
                  ...styles.rescanButton,
                  ...(rescanCooldown > 0 ? styles.rescanButtonDisabled : {})
                }}
                onClick={() => rescanCooldown === 0 && scanWallet(account)}
                disabled={rescanCooldown > 0}
                title={
                  rescanCooldown > 0
                    ? `Please wait ${rescanCooldown}s before rescanning`
                    : `Full rescan: Check for new NFTs + update LP${lastScanTime ? ` (Last: ${getTimeSinceLastScan()})` : ''}`
                }
              >
                {rescanCooldown > 0 ? `⏳ ${rescanCooldown}s` : `🔄 Full Scan${lastScanTime ? ` (${getTimeSinceLastScan()})` : ''}`}
              </button>
            )}
            <button style={styles.closeButton} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <p style={styles.subtitle}>
          View your powerful Tasern NFTs as playable cards, empowered by LP holdings!
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
            <p style={styles.scanningText}>
              {scanProgress ? scanProgress.message : 'Scanning for Tasern NFTs...'}
            </p>
            {scanProgress && (
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${scanProgress.percentage}%`
                  }}
                />
              </div>
            )}
            {scanLogs.length > 0 && (
              <div style={styles.scanLogContainer}>
                {scanLogs.slice(-5).map((log, i) => (
                  <div key={i} style={styles.scanLogEntry}>{log}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LP Enhancement Summary with Filter Toggle */}
        {isConnected && !isScanning && enhancedNFTs.length > 0 && (
          <div style={styles.bonusSection}>
            <span style={styles.bonusText}>
              💎 {enhancedNFTs.filter(n => n.impactAssets.totalValue > 0).length} NFT{enhancedNFTs.filter(n => n.impactAssets.totalValue > 0).length !== 1 ? 's' : ''} with LP enhancements
            </span>
            <button
              style={{
                ...styles.filterToggle,
                ...(showOnlyWithLP ? styles.filterToggleActive : {})
              }}
              onClick={() => setShowOnlyWithLP(!showOnlyWithLP)}
              title={showOnlyWithLP ? 'Show all NFTs' : 'Show only NFTs with LP holdings'}
            >
              {showOnlyWithLP ? '💎 LP Only' : '🎴 Show All'}
            </button>
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
            {cards.map((card, index) => {
              // Get enhanced NFT data for this card
              const enhancedNFT = enhancedNFTs[index];

              // Filter: Skip cards without LP if filter is active
              if (showOnlyWithLP && (!enhancedNFT || enhancedNFT.impactAssets.totalValue === 0)) {
                return null;
              }

              return (
                <div
                  key={card.id}
                  style={{
                    ...styles.cardWrapper,
                    ...(selectedCard?.id === card.id ? styles.cardWrapperSelected : {}),
                  }}
                  onClick={() => handleCardClick(card)}
                >
                  <CardDisplay
                    card={card}
                    imageUrl={enhancedNFT?.image}
                  />
                  <div style={styles.nftBadge}>NFT</div>

                  {/* LP Enhancement Badge - only show if actual LP holdings exist */}
                  {enhancedNFT && enhancedNFT.impactAssets.lpBalance > 0 && (
                    <div style={styles.lpBadge} title={`LP Holdings: ${enhancedNFT.impactAssets.lpBalance.toFixed(4)} LP\nStat Multiplier: ${enhancedNFT.statMultipliers.attack.toFixed(2)}x\nAdd more LP to increase stats!`}>
                      {'⭐'.repeat(enhancedNFT.enhancementLevel)} {enhancedNFT.impactAssets.lpBalance.toFixed(4)} LP
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
              {cards.length} NFT Card{cards.length !== 1 ? 's' : ''} • {enhancedNFTs.filter(n => n.impactAssets.totalValue > 0).length} LP Enhanced
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
  headerButtons: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  quickRefreshButton: {
    background: `linear-gradient(135deg, ${TASERN_COLORS.green} 0%, #047857 100%)`,
    border: `2px solid ${TASERN_COLORS.gold}`,
    borderRadius: '8px',
    padding: '8px 16px',
    color: TASERN_COLORS.parchment,
    fontSize: '14px',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  rescanButton: {
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    border: `2px solid ${TASERN_COLORS.gold}`,
    borderRadius: '8px',
    padding: '8px 16px',
    color: TASERN_COLORS.parchment,
    fontSize: '14px',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  rescanButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    background: `linear-gradient(135deg, ${TASERN_COLORS.stone} 0%, ${TASERN_COLORS.leather} 100%)`,
    border: `2px solid ${TASERN_COLORS.stone}`,
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  bonusText: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.gold,
  },
  filterToggle: {
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '6px',
    padding: '6px 12px',
    color: TASERN_COLORS.parchment,
    fontSize: '12px',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  filterToggleActive: {
    background: `linear-gradient(135deg, ${TASERN_COLORS.gold} 0%, #FFD700 100%)`,
    border: `2px solid ${TASERN_COLORS.gold}`,
    color: '#1a1a1a',
    boxShadow: TASERN_SHADOWS.glowGold,
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
  progressBar: {
    width: '100%',
    height: '20px',
    backgroundColor: 'rgba(92, 64, 51, 0.3)',
    borderRadius: '10px',
    marginTop: '1rem',
    overflow: 'hidden',
    border: `1px solid ${TASERN_COLORS.bronze}`,
  },
  progressFill: {
    height: '100%',
    backgroundColor: TASERN_COLORS.gold,
    transition: 'width 0.3s ease',
    boxShadow: `0 0 10px ${TASERN_COLORS.gold}`,
  },
  scanLogContainer: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    border: `1px solid ${TASERN_COLORS.bronze}`,
    maxHeight: '150px',
    overflowY: 'auto',
  },
  scanLogEntry: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: '0.85rem',
    color: TASERN_COLORS.parchment,
    marginBottom: '0.5rem',
    opacity: 0.9,
  },
  lpBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
    color: '#1a1a1a',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: 'bold',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    textTransform: 'uppercase',
    border: '1px solid #FFD700',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
};
