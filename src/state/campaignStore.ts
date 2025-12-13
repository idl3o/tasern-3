/**
 * Campaign Store
 *
 * Manages campaign progression with localStorage persistence.
 * Tracks which battles are completed, unlocked, and current progress.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CampaignState,
  CampaignProgress,
  CampaignBattleResult,
  CampaignBattle,
} from '../types/campaign'
import { getCampaign, getCampaignBattle, getCampaignLength } from '../data/campaignData'

interface CampaignStore extends CampaignState {
  // Actions
  startCampaign: (campaignId: string) => void
  resumeCampaign: () => void
  recordBattleResult: (result: Omit<CampaignBattleResult, 'timestamp'>) => void
  setCurrentBattle: (battleId: string | null) => void
  resetCampaign: () => void

  // Getters (computed from state)
  isBattleUnlocked: (battleIndex: number) => boolean
  isBattleCompleted: (battleId: string) => boolean
  getCurrentBattle: () => CampaignBattle | null
  getProgressPercentage: () => number
  getTotalVictories: () => number
  getTotalDefeats: () => number
}

const initialState: CampaignState = {
  isActive: false,
  activeCampaignId: null,
  progress: null,
  currentBattleId: null,
}

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Start a new campaign (resets any existing progress)
      startCampaign: (campaignId: string) => {
        const campaign = getCampaign(campaignId)
        if (!campaign) {
          console.error(`Campaign not found: ${campaignId}`)
          return
        }

        const now = Date.now()
        set({
          isActive: true,
          activeCampaignId: campaignId,
          progress: {
            currentBattleIndex: 0,
            completedBattles: [],
            battleResults: [],
            startedAt: now,
            lastPlayedAt: now,
          },
          currentBattleId: null,
        })
        console.log(`🏰 Campaign started: ${campaign.name}`)
      },

      // Resume the existing campaign (just marks it active)
      resumeCampaign: () => {
        const { progress, activeCampaignId } = get()
        if (!progress || !activeCampaignId) {
          console.warn('No campaign to resume')
          return
        }

        set({
          isActive: true,
          progress: {
            ...progress,
            lastPlayedAt: Date.now(),
          },
        })
        console.log('🏰 Campaign resumed')
      },

      // Record the result of a campaign battle
      recordBattleResult: (result) => {
        const { progress, activeCampaignId } = get()
        if (!progress || !activeCampaignId) {
          console.warn('No active campaign to record result')
          return
        }

        const fullResult: CampaignBattleResult = {
          ...result,
          timestamp: Date.now(),
        }

        const newCompletedBattles = result.victory
          ? [...new Set([...progress.completedBattles, result.battleId])]
          : progress.completedBattles

        // Advance to next battle if victory and not already at the end
        const currentBattleIndex = progress.currentBattleIndex
        const campaignLength = getCampaignLength(activeCampaignId)
        const shouldAdvance = result.victory && currentBattleIndex < campaignLength - 1
        const newBattleIndex = shouldAdvance ? currentBattleIndex + 1 : currentBattleIndex

        set({
          progress: {
            ...progress,
            completedBattles: newCompletedBattles,
            battleResults: [...progress.battleResults, fullResult],
            currentBattleIndex: newBattleIndex,
            lastPlayedAt: Date.now(),
          },
          currentBattleId: null, // Clear current battle after recording
        })

        if (result.victory) {
          console.log(`⚔️ Victory recorded! Battle: ${result.battleId}`)
          if (shouldAdvance) {
            console.log(`📈 Advanced to battle ${newBattleIndex + 1}`)
          } else if (currentBattleIndex === campaignLength - 1) {
            console.log('🏆 CAMPAIGN COMPLETE!')
          }
        } else {
          console.log(`💀 Defeat recorded. Battle: ${result.battleId}`)
        }
      },

      // Set which battle is currently being fought
      setCurrentBattle: (battleId: string | null) => {
        set({ currentBattleId: battleId })
      },

      // Reset all campaign progress
      resetCampaign: () => {
        set(initialState)
        console.log('🔄 Campaign reset')
      },

      // Check if a battle is unlocked (can be played)
      isBattleUnlocked: (battleIndex: number) => {
        const { progress } = get()
        if (!progress) return battleIndex === 0 // Only first battle unlocked if no progress

        // Battle is unlocked if:
        // 1. It's the current battle or earlier
        // 2. Or all previous battles are completed
        if (battleIndex <= progress.currentBattleIndex) return true

        // Check if previous battle is completed
        const { activeCampaignId } = get()
        if (!activeCampaignId) return false

        const prevBattle = getCampaignBattle(activeCampaignId, battleIndex - 1)
        return prevBattle ? progress.completedBattles.includes(prevBattle.id) : false
      },

      // Check if a specific battle is completed
      isBattleCompleted: (battleId: string) => {
        const { progress } = get()
        return progress?.completedBattles.includes(battleId) ?? false
      },

      // Get the current battle info
      getCurrentBattle: () => {
        const { activeCampaignId, progress } = get()
        if (!activeCampaignId || !progress) return null

        return getCampaignBattle(activeCampaignId, progress.currentBattleIndex) ?? null
      },

      // Get completion percentage
      getProgressPercentage: () => {
        const { activeCampaignId, progress } = get()
        if (!activeCampaignId || !progress) return 0

        const campaignLength = getCampaignLength(activeCampaignId)
        if (campaignLength === 0) return 0

        return Math.round((progress.completedBattles.length / campaignLength) * 100)
      },

      // Get total victories in current campaign
      getTotalVictories: () => {
        const { progress } = get()
        return progress?.battleResults.filter((r) => r.victory).length ?? 0
      },

      // Get total defeats in current campaign
      getTotalDefeats: () => {
        const { progress } = get()
        return progress?.battleResults.filter((r) => !r.victory).length ?? 0
      },
    }),
    {
      name: 'tasern-campaign-storage',
      // Only persist these fields
      partialize: (state) => ({
        activeCampaignId: state.activeCampaignId,
        progress: state.progress,
        // Don't persist isActive or currentBattleId (session-specific)
      }),
    }
  )
)

// Selectors for optimized subscriptions
export const selectIsActive = (state: CampaignStore) => state.isActive
export const selectProgress = (state: CampaignStore) => state.progress
export const selectActiveCampaignId = (state: CampaignStore) => state.activeCampaignId
export const selectCurrentBattleId = (state: CampaignStore) => state.currentBattleId
