/**
 * NFT Gallery Component
 *
 * Display Tasern Universe NFTs as playable cards
 * Wallet-gated: connect wallet → scan NFTs → show as cards
 * Supports multi-wallet portfolio aggregation
 */

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { WalletConnect } from './WalletConnect';
import { CardDisplay } from './CardDisplay';
import { ManagePortfolio } from './ManagePortfolio';
import { enhancedNFTsToCards } from '../utils/nftToCard';
import { UniversalImpactScanner, type EnhancedNFTData, type ScanProgress } from '../utils/universalImpactScanner';
import { scanPortfolio, quickRefreshPortfolio, type PortfolioNFTData, type PortfolioScanProgress } from '../utils/portfolioScanner';
import { useNFTCardsStore } from '../state/nftCardsStore';
import { useWalletPortfolioStore } from '../state/walletPortfolioStore';
import { useLoyaltyStore } from '../state/loyaltyStore';
import { getTierForLevel, type LPTier } from '../utils/lpTiers';
import type { Card } from '../types/core';
import { TASERN_COLORS, TASERN_TYPOGRAPHY, TASERN_SHADOWS } from '../styles/tasernTheme';

interface NFTGalleryProps {
  onClose: () => void;
  onSelectCard?: (card: Card) => void;
}

export const NFTGallery: React.FC<NFTGalleryProps> = ({ onClose, onSelectCard }) => {
  const { address: account, isConnected } = useAccount();
  const { setNFTCards, setIsScanning: setGlobalScanning } = useNFTCardsStore();
  const {
    setPrimaryAddress,
    linkedAddresses,
    aggregateNFTs: shouldAggregate
  } = useWalletPortfolioStore();

  const { updateLoyaltySnapshot } = useLoyaltyStore();

  const [portfolioNFTs, setPortfolioNFTs] = useState<PortfolioNFTData[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [portfolioProgress, setPortfolioProgress] = useState<PortfolioScanProgress | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);
  const [rescanCooldown, setRescanCooldown] = useState<number>(0);
  const [showOnlyWithLP, setShowOnlyWithLP] = useState<boolean>(true);
  const [showManagePortfolio, setShowManagePortfolio] = useState(false);

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

  // Auto-remember accounts and trigger scan when wallet connects
  useEffect(() => {
    if (account !== previousAccount) {
      setPreviousAccount(account);

      if (isConnected && account) {
        // Register this address in portfolio (auto-remember pattern)
        setPrimaryAddress(account);
        console.log(`📋 Portfolio: Registered ${account.slice(0, 6)}... as primary`);

        // Check for cached cards
        const existingCards = useNFTCardsStore.getState().getNFTCards(account);

        if (existingCards.length === 0) {
          // No cached cards - scan portfolio
          console.log(`🔍 NFTGallery: Starting portfolio scan...`);
          scanAllPortfolio();
        } else {
          // Use cached cards for now
          console.log(`📦 NFTGallery: Using ${existingCards.length} cached NFT cards`);
          setCards(existingCards);
        }
      } else if (!account && previousAccount) {
        // Wallet disconnected - clear local state only
        console.log('🔌 NFTGallery: Wallet disconnected, clearing local state');
        setPortfolioNFTs([]);
        setCards([]);
        setScanProgress(null);
        setPortfolioProgress(null);
        setScanLogs([]);
      }
    }
  }, [isConnected, account, previousAccount]);

  // Quick refresh LP balances for portfolio
  const quickRefreshAll = async () => {
    if (portfolioNFTs.length === 0) {
      console.warn('No NFTs to refresh - run full scan first');
      return;
    }

    setIsScanning(true);
    setScanProgress(null);
    setPortfolioProgress(null);
    setScanLogs([]);

    try {
      console.log(`⚡ Quick refresh: Updating LP balances for ${portfolioNFTs.length} cards...`);

      const onProgress = (progress: PortfolioScanProgress) => {
        setPortfolioProgress(progress);
        if (progress.nftProgress) {
          setScanProgress(progress.nftProgress);
        }
      };

      const onLog = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        setScanLogs(prev => [...prev, `${emoji} ${message}`]);
      };

      const refreshedData = await quickRefreshPortfolio(portfolioNFTs, onProgress, onLog);

      console.log(`✅ Quick refresh complete! Updated ${refreshedData.length} cards`);
      setPortfolioNFTs(refreshedData);

      // Convert to cards (include owner info for badges)
      const playableCards = enhancedNFTsToCards(refreshedData);
      setCards(playableCards);

      // Save ALL wallets' cards to store (grouped by owner address)
      const nftsByOwner = new Map<string, PortfolioNFTData[]>();
      for (const nft of refreshedData) {
        const owner = nft.ownerAddress.toLowerCase();
        if (!nftsByOwner.has(owner)) {
          nftsByOwner.set(owner, []);
        }
        nftsByOwner.get(owner)!.push(nft);
      }

      for (const [ownerAddress, ownerNFTs] of nftsByOwner) {
        setNFTCards(ownerAddress, enhancedNFTsToCards(ownerNFTs));
      }

      // Update loyalty tracking for primary wallet
      if (account) {
        const totalLPBalance = refreshedData
          .filter(nft => nft.ownerAddress.toLowerCase() === account.toLowerCase())
          .reduce((sum, nft) => sum + (nft.impactAssets?.lpBalance || 0), 0);
        updateLoyaltySnapshot(account, totalLPBalance);
        console.log(`⭐ Loyalty updated: ${totalLPBalance.toFixed(4)} LP for ${account.slice(0, 6)}...`);
      }

      setLastScanTime(Date.now());
      setRescanCooldown(15);
    } catch (error) {
      console.error('Error during quick refresh:', error);
      setScanLogs(prev => [...prev, `❌ Quick refresh failed: ${error}`]);
    } finally {
      setIsScanning(false);
    }
  };

  // Scan all addresses in portfolio
  const scanAllPortfolio = async () => {
    setIsScanning(true);
    setGlobalScanning(true);
    setScanProgress(null);
    setPortfolioProgress(null);
    setScanLogs([]);

    try {
      const addressCount = linkedAddresses.length || 1;
      console.log(`🔍 Starting portfolio scan for ${addressCount} wallet(s)...`);

      const onProgress = (progress: PortfolioScanProgress) => {
        setPortfolioProgress(progress);
        if (progress.nftProgress) {
          setScanProgress(progress.nftProgress);
        }
      };

      const onLog = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
        const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
        setScanLogs(prev => [...prev, `${emoji} ${message}`]);
      };

      const portfolioData = await scanPortfolio(onProgress, onLog);

      if (!Array.isArray(portfolioData)) {
        console.error('Invalid scan response - expected array');
        setScanLogs(prev => [...prev, `❌ Invalid scan response`]);
        setPortfolioNFTs([]);
        setCards([]);
        return;
      }

      console.log(`✅ Portfolio scan complete! Found ${portfolioData.length} NFTs`);
      setPortfolioNFTs(portfolioData);

      // Convert to playable cards
      let playableCards: Card[] = [];
      try {
        playableCards = enhancedNFTsToCards(portfolioData);
      } catch (conversionError) {
        console.error('Error converting NFTs to cards:', conversionError);
        setScanLogs(prev => [...prev, `⚠️ Some cards failed to convert`]);
      }

      setCards(playableCards);

      // Save ALL wallets' cards to store (grouped by owner address)
      // This is critical for getPortfolioCards() to work in deck selection
      const nftsByOwner = new Map<string, PortfolioNFTData[]>();
      for (const nft of portfolioData) {
        const owner = nft.ownerAddress.toLowerCase();
        if (!nftsByOwner.has(owner)) {
          nftsByOwner.set(owner, []);
        }
        nftsByOwner.get(owner)!.push(nft);
      }

      // Store cards for each wallet address
      for (const [ownerAddress, ownerNFTs] of nftsByOwner) {
        const ownerCards = enhancedNFTsToCards(ownerNFTs);
        setNFTCards(ownerAddress, ownerCards);
        console.log(`💾 Saved ${ownerCards.length} cards for wallet ${ownerAddress.slice(0, 6)}...`);
      }
      console.log(`📦 Total: ${portfolioData.length} cards saved across ${nftsByOwner.size} wallet(s)`)

      const lpEnhancedCount = portfolioData.filter(nft => nft?.impactAssets?.totalValue > 0).length;
      console.log(`💎 ${lpEnhancedCount} NFTs have LP enhancements`);

      // Update loyalty tracking for primary wallet
      if (account) {
        const totalLPBalance = portfolioData
          .filter(nft => nft.ownerAddress.toLowerCase() === account.toLowerCase())
          .reduce((sum, nft) => sum + (nft.impactAssets?.lpBalance || 0), 0);
        updateLoyaltySnapshot(account, totalLPBalance);
        console.log(`⭐ Loyalty updated: ${totalLPBalance.toFixed(4)} LP for ${account.slice(0, 6)}...`);
      }

      setLastScanTime(Date.now());
      setRescanCooldown(30);
    } catch (error) {
      console.error('Error scanning portfolio:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setScanLogs(prev => [...prev, `❌ Scan failed: ${errorMessage}`]);
      setPortfolioNFTs([]);
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
            {isConnected && account && !isScanning && (
              <button
                style={styles.portfolioButton}
                onClick={() => setShowManagePortfolio(true)}
                title="Manage portfolio wallets"
              >
                📋 Portfolio ({linkedAddresses.length})
              </button>
            )}
            {isConnected && account && !isScanning && portfolioNFTs.length > 0 && (
              <button
                style={{
                  ...styles.quickRefreshButton,
                  ...(rescanCooldown > 0 ? styles.rescanButtonDisabled : {})
                }}
                onClick={() => rescanCooldown === 0 && quickRefreshAll()}
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
                onClick={() => rescanCooldown === 0 && scanAllPortfolio()}
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

        {/* Portfolio Summary with Filter Toggle */}
        {isConnected && !isScanning && portfolioNFTs.length > 0 && (
          <div style={styles.bonusSection}>
            <span style={styles.bonusText}>
              💎 {portfolioNFTs.filter(n => n.impactAssets.lpBalance > 0).length} NFT{portfolioNFTs.filter(n => n.impactAssets.lpBalance > 0).length !== 1 ? 's' : ''} with LP enhancements
              {linkedAddresses.length > 1 && ` • ${linkedAddresses.length} wallets`}
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
              // Get portfolio NFT data for this card
              const portfolioNFT = portfolioNFTs[index] as PortfolioNFTData | undefined;

              // Filter: Skip cards without LP if filter is active
              if (showOnlyWithLP && (!portfolioNFT || portfolioNFT.impactAssets.lpBalance <= 0)) {
                return null;
              }

              // Check if from a different wallet than primary
              const isFromLinkedWallet = portfolioNFT && account &&
                portfolioNFT.ownerAddress !== account.toLowerCase();

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
                    imageUrl={portfolioNFT?.image}
                  />
                  <div style={styles.nftBadge}>NFT</div>

                  {/* Owner Badge - show for linked wallets */}
                  {isFromLinkedWallet && portfolioNFT && (
                    <div
                      style={{
                        ...styles.ownerBadge,
                        ...(portfolioNFT.isVerifiedOwner ? styles.ownerBadgeVerified : styles.ownerBadgeReadOnly)
                      }}
                      title={`Owner: ${portfolioNFT.ownerLabel}\n${portfolioNFT.ownerAddress.slice(0, 6)}...${portfolioNFT.ownerAddress.slice(-4)}${!portfolioNFT.isVerifiedOwner ? '\n(Read-only)' : ''}`}
                    >
                      {portfolioNFT.isVerifiedOwner ? '✓' : '👁'} {portfolioNFT.ownerLabel.slice(0, 8)}
                    </div>
                  )}

                  {/* LP Tier Badge - shows tier name with color coding */}
                  {portfolioNFT && portfolioNFT.impactAssets.lpBalance > 0 && (() => {
                    const tier = getTierForLevel(portfolioNFT.enhancementLevel);
                    return (
                      <div
                        style={{
                          ...styles.lpBadge,
                          background: tier.bgGradient,
                          borderColor: tier.borderColor,
                          color: portfolioNFT.enhancementLevel >= 3 ? '#1a1a1a' : '#F4E4C1',
                        }}
                        title={`${tier.icon} ${tier.name} Tier\nLP Holdings: ${portfolioNFT.impactAssets.lpBalance.toFixed(4)} LP\nStat Multiplier: ${portfolioNFT.statMultipliers.attack.toFixed(2)}x\n${tier.description}`}
                      >
                        {tier.icon} {tier.name}
                      </div>
                    );
                  })()}
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
              {cards.length} NFT Card{cards.length !== 1 ? 's' : ''} • {portfolioNFTs.filter(n => n.impactAssets.totalValue > 0).length} LP Enhanced
              {linkedAddresses.length > 1 && ` • ${linkedAddresses.length} Wallets`}
            </p>
          </div>
        )}

        {/* Manage Portfolio Modal */}
        <ManagePortfolio
          isOpen={showManagePortfolio}
          onClose={() => setShowManagePortfolio(false)}
          onScanAll={scanAllPortfolio}
        />
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
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    textTransform: 'uppercase',
    border: '2px solid',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    letterSpacing: '0.5px',
  },
  portfolioButton: {
    background: `linear-gradient(135deg, ${TASERN_COLORS.purple} 0%, #7C3AED 100%)`,
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
  ownerBadge: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    padding: '3px 6px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: 'bold',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    textTransform: 'uppercase',
    maxWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  ownerBadgeVerified: {
    background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
    color: TASERN_COLORS.parchment,
    border: '1px solid #10B981',
  },
  ownerBadgeReadOnly: {
    background: 'linear-gradient(135deg, #4B5563 0%, #6B7280 100%)',
    color: TASERN_COLORS.parchment,
    border: '1px solid #9CA3AF',
  },
};
