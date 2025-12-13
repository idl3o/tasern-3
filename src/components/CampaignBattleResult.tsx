/**
 * Campaign Battle Result Modal
 *
 * Displays victory/defeat after a campaign battle with stats
 * and options to continue or retry.
 */

import React from 'react'
import { TASERN_COLORS, TASERN_TYPOGRAPHY, TASERN_SHADOWS, TASERN_ICONS } from '../styles/tasernTheme'
import { useCampaignStore } from '../state/campaignStore'
import { getCampaign, getCampaignLength } from '../data/campaignData'

interface CampaignBattleResultProps {
  victory: boolean
  turns: number
  playerCastleHp: number
  opponentCastleHp: number
  opponentName: string
  onContinue: () => void
  onRetry: () => void
  onBackToMenu: () => void
}

export const CampaignBattleResult: React.FC<CampaignBattleResultProps> = ({
  victory,
  turns,
  playerCastleHp,
  opponentCastleHp,
  opponentName,
  onContinue,
  onRetry,
  onBackToMenu,
}) => {
  const { activeCampaignId, progress, getProgressPercentage } = useCampaignStore()

  // Get campaign info
  const campaign = activeCampaignId ? getCampaign(activeCampaignId) : null
  const campaignLength = activeCampaignId ? getCampaignLength(activeCampaignId) : 0
  const completedCount = progress?.completedBattles.length ?? 0
  const isCampaignComplete = completedCount >= campaignLength

  return (
    <div style={styles.overlay}>
      <div style={{
        ...styles.container,
        borderColor: victory ? TASERN_COLORS.gold : TASERN_COLORS.red,
      }}>
        {/* Victory/Defeat Header */}
        <div style={styles.header}>
          <div style={{
            ...styles.resultIcon,
            background: victory
              ? `linear-gradient(135deg, ${TASERN_COLORS.gold} 0%, ${TASERN_COLORS.bronze} 100%)`
              : `linear-gradient(135deg, ${TASERN_COLORS.red} 0%, #4a0000 100%)`,
          }}>
            {victory ? TASERN_ICONS.victory : TASERN_ICONS.defeat}
          </div>
          <h1 style={{
            ...styles.title,
            color: victory ? TASERN_COLORS.gold : TASERN_COLORS.red,
            textShadow: victory ? TASERN_SHADOWS.glowGold : TASERN_SHADOWS.glowRed,
          }}>
            {victory ? 'VICTORY!' : 'DEFEAT'}
          </h1>
          <p style={styles.subtitle}>
            {victory
              ? `You have defeated ${opponentName}!`
              : `${opponentName} has bested you in battle.`}
          </p>
        </div>

        {/* Battle Stats */}
        <div style={styles.statsSection}>
          <h3 style={styles.statsTitle}>Battle Statistics</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Turns</span>
              <span style={styles.statValue}>{turns}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Your Castle</span>
              <span style={{
                ...styles.statValue,
                color: playerCastleHp > 0 ? TASERN_COLORS.green : TASERN_COLORS.red,
              }}>
                {TASERN_ICONS.hp} {playerCastleHp}
              </span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Enemy Castle</span>
              <span style={{
                ...styles.statValue,
                color: opponentCastleHp <= 0 ? TASERN_COLORS.green : TASERN_COLORS.red,
              }}>
                {TASERN_ICONS.castle} {opponentCastleHp}
              </span>
            </div>
          </div>
        </div>

        {/* Campaign Progress */}
        <div style={styles.progressSection}>
          <h3 style={styles.progressTitle}>Campaign Progress</h3>
          <div style={styles.progressBarContainer}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${getProgressPercentage()}%`,
              }}
            />
          </div>
          <p style={styles.progressText}>
            {isCampaignComplete
              ? `${TASERN_ICONS.victory} Campaign Complete! All ${campaignLength} battles won!`
              : `${completedCount} of ${campaignLength} battles completed`}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonSection}>
          {victory ? (
            isCampaignComplete ? (
              <>
                <button style={styles.primaryButton} onClick={onBackToMenu}>
                  {TASERN_ICONS.castle} Return to Menu
                </button>
              </>
            ) : (
              <>
                <button style={styles.primaryButton} onClick={onContinue}>
                  {TASERN_ICONS.attack} Next Battle
                </button>
                <button style={styles.secondaryButton} onClick={onBackToMenu}>
                  Campaign Menu
                </button>
              </>
            )
          ) : (
            <>
              <button style={styles.primaryButton} onClick={onRetry}>
                {TASERN_ICONS.attack} Retry Battle
              </button>
              <button style={styles.secondaryButton} onClick={onBackToMenu}>
                Campaign Menu
              </button>
            </>
          )}
        </div>

        {/* Motivational Text */}
        {victory && !isCampaignComplete && (
          <p style={styles.motivationalText}>
            Your legend grows. Press onward, champion of Tasern!
          </p>
        )}
        {!victory && (
          <p style={styles.motivationalText}>
            Even the greatest warriors face defeat. Rise again, and let your courage guide you.
          </p>
        )}
        {isCampaignComplete && (
          <p style={styles.motivationalText}>
            You have conquered all challengers! Your name shall echo through the ages in the Tales of Tasern!
          </p>
        )}
      </div>
    </div>
  )
}

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
    zIndex: 3000,
    padding: '1rem',
  },
  container: {
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.3) 0%, rgba(26, 20, 16, 0.95) 100%)',
    border: `4px solid ${TASERN_COLORS.gold}`,
    borderRadius: '16px',
    padding: '2.5rem',
    maxWidth: '500px',
    width: '100%',
    boxShadow: TASERN_SHADOWS.glowGold,
    backdropFilter: 'blur(10px)',
    textAlign: 'center',
  },
  header: {
    marginBottom: '2rem',
  },
  resultIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    margin: '0 auto 1rem',
    border: `3px solid ${TASERN_COLORS.parchment}`,
  },
  title: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    margin: 0,
  },
  statsSection: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: `1px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  statsTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingMedium,
    color: TASERN_COLORS.gold,
    margin: '0 0 1rem 0',
    textTransform: 'uppercase',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  statLabel: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.bronze,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.parchment,
  },
  progressSection: {
    marginBottom: '2rem',
  },
  progressTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingSmall,
    color: TASERN_COLORS.bronze,
    margin: '0 0 0.75rem 0',
    textTransform: 'uppercase',
  },
  progressBarContainer: {
    height: '16px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '8px',
    border: `1px solid ${TASERN_COLORS.bronze}`,
    overflow: 'hidden',
    marginBottom: '0.5rem',
  },
  progressBarFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.gold} 100%)`,
    borderRadius: '8px',
    transition: 'width 0.5s ease',
  },
  progressText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
    margin: 0,
  },
  buttonSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  primaryButton: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    padding: '1rem 2rem',
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    border: `3px solid ${TASERN_COLORS.gold}`,
    borderRadius: '8px',
    color: TASERN_COLORS.parchment,
    cursor: 'pointer',
    transition: 'all 0.3s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  secondaryButton: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '8px',
    color: TASERN_COLORS.bronze,
    cursor: 'pointer',
    transition: 'all 0.3s',
    textTransform: 'uppercase',
  },
  motivationalText: {
    fontFamily: TASERN_TYPOGRAPHY.accent,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.bronze,
    fontStyle: 'italic',
    margin: 0,
    lineHeight: '1.6',
  },
}
