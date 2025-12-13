/**
 * Campaign Data for Tasern Siegefront
 *
 * The main campaign takes players through all 5 AI personalities
 * in order of difficulty, with Tasern-themed lore for each encounter.
 *
 * This is NOT game logic - this is pure data that gives the campaign soul.
 */

import { Campaign, CampaignBattle } from '../types/campaign'

/**
 * The main campaign battles in difficulty order
 * Difficulty is based on AI personality's patience + adaptability
 */
export const MAIN_CAMPAIGN_BATTLES: CampaignBattle[] = [
  {
    id: 'battle-1-swiftblade',
    opponentKey: 'swiftblade',
    title: 'The Opening Skirmish',
    introText: `The border fortress of Ashenvale burns on the horizon. Lady Swiftblade, the Lightning Duelist, has claimed it as her own. Her blade moves faster than thought itself—she has never lost a single duel. But speed alone cannot triumph over cunning strategy. Face her at the burning gates, and prove your worth to the realm.`,
    difficulty: 0.35,
  },
  {
    id: 'battle-2-grok',
    opponentKey: 'grok',
    title: 'Chaos at the Crossroads',
    introText: `The Crossroads of Fate lie ahead, where ancient ley lines converge and reality itself grows thin. Grok the Unpredictable has made this place of power his domain. His tactics follow no pattern, no logic—only the whims of madness and chaos. Even seers cannot predict his next move. Prepare for anything, strategist.`,
    difficulty: 0.45,
  },
  {
    id: 'battle-3-stumbleheart',
    opponentKey: 'stumbleheart',
    title: 'The Noble Challenge',
    introText: `Sir Stumbleheart awaits in the Tournament Grounds of Goldhollow, where the greatest knights of Tasern have tested their mettle for centuries. A knight of impeccable honor but questionable competence, he has never won a formal duel—yet he has never stopped trying. His creativity in battle is legendary, for necessity breeds invention. Do not underestimate the Noble Blunderer.`,
    difficulty: 0.55,
  },
  {
    id: 'battle-4-nethys',
    opponentKey: 'nethys',
    title: 'Arcane Trials',
    introText: `The Spire of Nethys pierces the clouds above the Shattered Coast, a monument to magical ambition. Within its crystalline walls, Archmagus Nethys conducts experiments that bend the very laws of magic itself. His arcane constructs and experimental tactics have defeated entire armies. Only the most adaptable warriors survive his trials. Steel your mind.`,
    difficulty: 0.70,
  },
  {
    id: 'battle-5-thornwick',
    opponentKey: 'thornwick',
    title: 'The Final Strategy',
    introText: `At last, the Obsidian Citadel rises before you. Thornwick the Tactician has commanded from these black walls for fifty years of warfare—and he has never lost a single battle. His patience is infinite, his adaptability unmatched. Every move you make, he has already anticipated. This is the ultimate test of strategic mastery. Victory here means legend. Defeat means oblivion.`,
    difficulty: 0.85,
  },
]

/**
 * The main campaign definition
 * Future: Can add SIDE_CAMPAIGN, CHALLENGE_CAMPAIGN, etc.
 */
export const MAIN_CAMPAIGN: Campaign = {
  id: 'main-campaign',
  name: 'The Siege of Tasern',
  description: 'Journey across the realm of Tasern, facing its greatest tacticians in battles that will determine the fate of nations.',
  battles: MAIN_CAMPAIGN_BATTLES,
}

/**
 * All available campaigns
 * Future: Add more campaigns here
 */
export const CAMPAIGNS: Record<string, Campaign> = {
  [MAIN_CAMPAIGN.id]: MAIN_CAMPAIGN,
}

/**
 * Get a campaign by ID
 */
export function getCampaign(campaignId: string): Campaign | undefined {
  return CAMPAIGNS[campaignId]
}

/**
 * Get a specific battle from a campaign
 */
export function getCampaignBattle(campaignId: string, battleIndex: number): CampaignBattle | undefined {
  const campaign = getCampaign(campaignId)
  return campaign?.battles[battleIndex]
}

/**
 * Get total number of battles in a campaign
 */
export function getCampaignLength(campaignId: string): number {
  const campaign = getCampaign(campaignId)
  return campaign?.battles.length ?? 0
}
