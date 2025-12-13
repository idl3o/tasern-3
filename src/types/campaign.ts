/**
 * Campaign Types for Tasern Siegefront
 *
 * Defines the structure for campaign progression, battle tracking,
 * and extensible story/rewards system.
 */

/**
 * A single battle in the campaign
 */
export interface CampaignBattle {
  /** Unique identifier for this battle */
  id: string
  /** Key to look up AI personality ('swiftblade', 'grok', etc.) */
  opponentKey: string
  /** Display title for the battle */
  title: string
  /** Lore paragraph shown before battle */
  introText: string
  /** Difficulty rating (0-1) based on AI personality */
  difficulty: number
  /** Optional specific map preset for this battle */
  mapPreset?: string
  /** Optional rewards for future expansion */
  rewards?: CampaignReward[]
}

/**
 * Reward for completing a campaign battle (future expansion)
 */
export interface CampaignReward {
  type: 'card' | 'cosmetic' | 'achievement' | 'bonus'
  id: string
  name: string
  description?: string
}

/**
 * Result of a single campaign battle
 */
export interface CampaignBattleResult {
  /** Which battle was fought */
  battleId: string
  /** Did the player win? */
  victory: boolean
  /** How many turns the battle lasted */
  turns: number
  /** Player's castle HP at end of battle */
  playerCastleHp: number
  /** Opponent's castle HP at end of battle */
  opponentCastleHp: number
  /** When the battle was completed */
  timestamp: number
}

/**
 * Tracks player's progress through a campaign
 */
export interface CampaignProgress {
  /** Which battle the player is currently on (0-indexed) */
  currentBattleIndex: number
  /** IDs of battles that have been completed (won) */
  completedBattles: string[]
  /** Full results of all battles fought (including losses) */
  battleResults: CampaignBattleResult[]
  /** When the campaign was started */
  startedAt: number
  /** When the player last played */
  lastPlayedAt: number
}

/**
 * Campaign definition - can have multiple campaigns
 */
export interface Campaign {
  /** Unique identifier for this campaign */
  id: string
  /** Display name */
  name: string
  /** Campaign description */
  description: string
  /** Ordered list of battles */
  battles: CampaignBattle[]
}

/**
 * State shape for campaign store
 */
export interface CampaignState {
  /** Is a campaign currently active? */
  isActive: boolean
  /** ID of the active campaign */
  activeCampaignId: string | null
  /** Progress in the active campaign */
  progress: CampaignProgress | null
  /** ID of battle currently being fought (for result tracking) */
  currentBattleId: string | null
}

/**
 * Campaign store actions
 */
export interface CampaignActions {
  /** Start a new campaign (resets progress) */
  startCampaign: (campaignId: string) => void
  /** Resume an existing campaign */
  resumeCampaign: () => void
  /** Record the result of a battle */
  recordBattleResult: (result: Omit<CampaignBattleResult, 'timestamp'>) => void
  /** Set which battle is currently being fought */
  setCurrentBattle: (battleId: string | null) => void
  /** Reset campaign progress */
  resetCampaign: () => void
  /** Check if a specific battle is unlocked */
  isBattleUnlocked: (battleIndex: number) => boolean
  /** Check if a specific battle is completed */
  isBattleCompleted: (battleId: string) => boolean
  /** Get the current battle info */
  getCurrentBattle: () => CampaignBattle | null
  /** Get completion percentage */
  getProgressPercentage: () => number
}

export type CampaignStore = CampaignState & CampaignActions
