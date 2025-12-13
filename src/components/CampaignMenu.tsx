/**
 * Campaign Menu Component
 *
 * Displays campaign progression, battle selection, and lore.
 * Medieval parchment aesthetic matching the Tasern theme.
 */

import React, { useState } from 'react'
import { TASERN_COLORS, TASERN_TYPOGRAPHY, TASERN_SHADOWS, TASERN_ICONS } from '../styles/tasernTheme'
import { useCampaignStore } from '../state/campaignStore'
import { MAIN_CAMPAIGN, getCampaign } from '../data/campaignData'
import type { CampaignBattle } from '../types/campaign'

interface CampaignMenuProps {
  onStartBattle: (opponentKey: string, battleId: string) => void
  onBack: () => void
}

export const CampaignMenu: React.FC<CampaignMenuProps> = ({ onStartBattle, onBack }) => {
  const {
    activeCampaignId,
    progress,
    startCampaign,
    resumeCampaign,
    isBattleUnlocked,
    isBattleCompleted,
    getProgressPercentage,
    getTotalVictories,
    getTotalDefeats,
    setCurrentBattle,
  } = useCampaignStore()

  const [selectedBattleIndex, setSelectedBattleIndex] = useState<number | null>(null)

  // Get campaign data
  const campaign = activeCampaignId ? getCampaign(activeCampaignId) : MAIN_CAMPAIGN
  const battles = campaign?.battles ?? []

  // Check if we have existing progress
  const hasExistingProgress = activeCampaignId && progress && progress.completedBattles.length > 0

  // Handle starting/resuming campaign
  const handleStartCampaign = () => {
    if (hasExistingProgress) {
      resumeCampaign()
    } else {
      startCampaign(MAIN_CAMPAIGN.id)
    }
  }

  // Handle battle selection
  const handleSelectBattle = (index: number) => {
    if (isBattleUnlocked(index)) {
      setSelectedBattleIndex(index)
    }
  }

  // Handle starting the selected battle
  const handleStartBattle = () => {
    if (selectedBattleIndex === null) return

    const battle = battles[selectedBattleIndex]
    if (!battle) return

    // Set current battle for result tracking
    setCurrentBattle(battle.id)

    // Start the battle
    onStartBattle(battle.opponentKey, battle.id)
  }

  // If no active campaign, show start screen
  if (!activeCampaignId || !progress) {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.title}>{TASERN_ICONS.castle} Campaign Mode {TASERN_ICONS.castle}</h1>
            <button style={styles.closeButton} onClick={onBack}>
              Back
            </button>
          </div>

          <div style={styles.startContent}>
            <h2 style={styles.campaignTitle}>{MAIN_CAMPAIGN.name}</h2>
            <p style={styles.campaignDescription}>{MAIN_CAMPAIGN.description}</p>

            <div style={styles.campaignInfo}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Battles:</span>
                <span style={styles.infoValue}>{MAIN_CAMPAIGN.battles.length}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Difficulty:</span>
                <span style={styles.infoValue}>Progressive</span>
              </div>
            </div>

            {hasExistingProgress && (
              <div style={styles.existingProgress}>
                <p style={styles.progressText}>
                  {TASERN_ICONS.star} Existing progress found: {progress.completedBattles.length}/{battles.length} battles completed
                </p>
              </div>
            )}

            <div style={styles.buttonRow}>
              <button style={styles.primaryButton} onClick={handleStartCampaign}>
                {hasExistingProgress ? 'Continue Campaign' : 'Begin Campaign'}
              </button>
              {hasExistingProgress && (
                <button
                  style={styles.secondaryButton}
                  onClick={() => startCampaign(MAIN_CAMPAIGN.id)}
                >
                  Start New
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get selected battle info
  const selectedBattle: CampaignBattle | null =
    selectedBattleIndex !== null ? battles[selectedBattleIndex] : null

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>{TASERN_ICONS.castle} {campaign?.name} {TASERN_ICONS.castle}</h1>
          <button style={styles.closeButton} onClick={onBack}>
            Back
          </button>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressSection}>
          <div style={styles.progressBarContainer}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${getProgressPercentage()}%`,
              }}
            />
          </div>
          <div style={styles.progressStats}>
            <span>{TASERN_ICONS.victory} {getTotalVictories()} Victories</span>
            <span>{getProgressPercentage()}% Complete</span>
            <span>{TASERN_ICONS.defeat} {getTotalDefeats()} Defeats</span>
          </div>
        </div>

        <div style={styles.mainContent}>
          {/* Battle List */}
          <div style={styles.battleList}>
            {battles.map((battle, index) => {
              const unlocked = isBattleUnlocked(index)
              const completed = isBattleCompleted(battle.id)
              const isSelected = selectedBattleIndex === index
              const isCurrent = index === progress.currentBattleIndex && !completed

              return (
                <button
                  key={battle.id}
                  style={{
                    ...styles.battleItem,
                    ...(isSelected ? styles.battleItemSelected : {}),
                    ...(completed ? styles.battleItemCompleted : {}),
                    ...(!unlocked ? styles.battleItemLocked : {}),
                    ...(isCurrent ? styles.battleItemCurrent : {}),
                  }}
                  onClick={() => handleSelectBattle(index)}
                  disabled={!unlocked}
                >
                  <div style={styles.battleNumber}>
                    {completed ? TASERN_ICONS.victory : unlocked ? (index + 1) : '?'}
                  </div>
                  <div style={styles.battleInfo}>
                    <span style={styles.battleTitle}>
                      {unlocked ? battle.title : 'Locked'}
                    </span>
                    <span style={styles.battleDifficulty}>
                      {unlocked && `Difficulty: ${Math.round(battle.difficulty * 100)}%`}
                    </span>
                  </div>
                  {isCurrent && <span style={styles.currentBadge}>NEXT</span>}
                </button>
              )
            })}
          </div>

          {/* Battle Details */}
          <div style={styles.battleDetails}>
            {selectedBattle ? (
              <>
                <h2 style={styles.detailTitle}>{selectedBattle.title}</h2>
                <div style={styles.detailDifficulty}>
                  Difficulty: {getDifficultyStars(selectedBattle.difficulty)}
                </div>
                <div style={styles.introText}>{selectedBattle.introText}</div>
                <button style={styles.startBattleButton} onClick={handleStartBattle}>
                  {TASERN_ICONS.attack} Enter Battle {TASERN_ICONS.attack}
                </button>
              </>
            ) : (
              <div style={styles.selectPrompt}>
                <p>Select a battle from the list to view details and begin your challenge.</p>
                <p style={styles.tipText}>
                  Tip: Complete battles in order to unlock the next opponent.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Convert difficulty (0-1) to star display
 */
function getDifficultyStars(difficulty: number): string {
  const stars = Math.ceil(difficulty * 5)
  return TASERN_ICONS.star.repeat(stars) + ''.repeat(5 - stars)
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
    zIndex: 2000,
    padding: '1rem',
  },
  container: {
    background: 'linear-gradient(135deg, rgba(139, 105, 20, 0.3) 0%, rgba(26, 20, 16, 0.95) 100%)',
    border: `4px solid ${TASERN_COLORS.gold}`,
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '1000px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: TASERN_SHADOWS.glowGold,
    backdropFilter: 'blur(10px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    borderBottom: `2px solid ${TASERN_COLORS.bronze}`,
    paddingBottom: '1rem',
  },
  title: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleMedium,
    color: TASERN_COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textShadow: TASERN_SHADOWS.textGold,
    margin: 0,
  },
  closeButton: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '8px',
    color: TASERN_COLORS.parchment,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
  },
  // Start screen styles
  startContent: {
    textAlign: 'center',
    padding: '2rem',
  },
  campaignTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleLarge,
    color: TASERN_COLORS.gold,
    marginBottom: '1rem',
    textShadow: TASERN_SHADOWS.textGold,
  },
  campaignDescription: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    marginBottom: '2rem',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto 2rem',
  },
  campaignInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: '3rem',
    marginBottom: '2rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  infoLabel: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.bronze,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.gold,
  },
  existingProgress: {
    background: 'rgba(212, 175, 55, 0.1)',
    border: `1px solid ${TASERN_COLORS.gold}`,
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '2rem',
  },
  progressText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.gold,
    margin: 0,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '1rem',
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
  // Progress section
  progressSection: {
    marginBottom: '1.5rem',
  },
  progressBarContainer: {
    height: '12px',
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '6px',
    border: `1px solid ${TASERN_COLORS.bronze}`,
    overflow: 'hidden',
    marginBottom: '0.5rem',
  },
  progressBarFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.gold} 100%)`,
    borderRadius: '6px',
    transition: 'width 0.5s ease',
  },
  progressStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.parchment,
  },
  // Main content layout
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '2rem',
    minHeight: '400px',
  },
  // Battle list
  battleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  battleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(0, 0, 0, 0.3)',
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  battleItemSelected: {
    borderColor: TASERN_COLORS.gold,
    background: 'rgba(212, 175, 55, 0.1)',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  battleItemCompleted: {
    borderColor: TASERN_COLORS.green,
    background: 'rgba(6, 95, 70, 0.1)',
  },
  battleItemLocked: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  battleItemCurrent: {
    borderColor: TASERN_COLORS.gold,
    animation: 'pulse 2s infinite',
  },
  battleNumber: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${TASERN_COLORS.bronze} 0%, ${TASERN_COLORS.leather} 100%)`,
    borderRadius: '50%',
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.headingLarge,
    color: TASERN_COLORS.parchment,
  },
  battleInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  battleTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.parchment,
  },
  battleDifficulty: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.bronze,
  },
  currentBadge: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    padding: '0.25rem 0.5rem',
    background: TASERN_COLORS.gold,
    color: TASERN_COLORS.black,
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  // Battle details
  battleDetails: {
    background: 'rgba(0, 0, 0, 0.3)',
    border: `2px solid ${TASERN_COLORS.bronze}`,
    borderRadius: '8px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  detailTitle: {
    fontFamily: TASERN_TYPOGRAPHY.heading,
    fontSize: TASERN_TYPOGRAPHY.titleSmall,
    color: TASERN_COLORS.gold,
    marginBottom: '0.5rem',
    textShadow: TASERN_SHADOWS.textGold,
  },
  detailDifficulty: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyMedium,
    color: TASERN_COLORS.bronze,
    marginBottom: '1.5rem',
  },
  introText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    lineHeight: '1.8',
    flex: 1,
    whiteSpace: 'pre-line',
  },
  startBattleButton: {
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
    marginTop: '1.5rem',
    alignSelf: 'center',
    boxShadow: TASERN_SHADOWS.glowGold,
  },
  selectPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodyLarge,
    color: TASERN_COLORS.parchment,
    lineHeight: '1.6',
  },
  tipText: {
    fontFamily: TASERN_TYPOGRAPHY.body,
    fontSize: TASERN_TYPOGRAPHY.bodySmall,
    color: TASERN_COLORS.bronze,
    fontStyle: 'italic',
    marginTop: '1rem',
  },
}

// Add responsive styles
const mediaQuery = '@media (max-width: 768px)'
