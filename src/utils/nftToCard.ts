/**
 * NFT to Card Converter
 *
 * Transform Tasern NFT metadata into playable BattleCards
 * Integrates LP holdings for stat enhancement (0.01 LP = +5% to all stats)
 */

import type { Card } from '../types/core';
import type { TasernNFT } from './nftScanner';
import type { EnhancedNFTData } from './universalImpactScanner';

/**
 * Extract numeric trait from NFT attributes
 */
function getTraitValue(
  nft: TasernNFT,
  traitName: string,
  defaultValue: number = 0
): number {
  if (!nft.attributes) return defaultValue;

  const trait = nft.attributes.find(
    (attr) => attr.trait_type.toLowerCase() === traitName.toLowerCase()
  );

  if (!trait) return defaultValue;

  const value = typeof trait.value === 'number' ? trait.value : parseInt(trait.value);
  return isNaN(value) ? defaultValue : value;
}

/**
 * Extract string trait from NFT attributes
 */
function getTraitString(
  nft: TasernNFT,
  traitName: string,
  defaultValue: string = ''
): string {
  if (!nft.attributes) return defaultValue;

  const trait = nft.attributes.find(
    (attr) => attr.trait_type.toLowerCase() === traitName.toLowerCase()
  );

  return trait ? String(trait.value) : defaultValue;
}

/**
 * Determine combat type from NFT metadata
 */
function determineCombatType(nft: TasernNFT): 'melee' | 'ranged' | 'hybrid' {
  const typeStr = getTraitString(nft, 'type', 'melee').toLowerCase();
  const combatStr = getTraitString(nft, 'combat', 'melee').toLowerCase();

  if (typeStr.includes('archer') || typeStr.includes('mage') || combatStr.includes('ranged')) {
    return 'ranged';
  }
  if (typeStr.includes('hybrid') || combatStr.includes('hybrid')) {
    return 'hybrid';
  }

  return 'melee'; // Default
}

/**
 * Determine rarity from NFT metadata
 */
function determineRarity(nft: TasernNFT): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
  const rarityStr = getTraitString(nft, 'rarity', 'common').toLowerCase();

  if (rarityStr.includes('legendary')) return 'legendary';
  if (rarityStr.includes('epic')) return 'epic';
  if (rarityStr.includes('rare')) return 'rare';
  if (rarityStr.includes('uncommon')) return 'uncommon';

  return 'common';
}

/**
 * Generate ability based on NFT traits
 */
function generateAbility(nft: TasernNFT): import('../types/core').CardAbility | null {
  const abilityName = getTraitString(nft, 'ability', '');
  if (!abilityName) return null;

  // Map common abilities
  if (abilityName.toLowerCase().includes('heal')) {
    return {
      id: `ability-${nft.contract}-${nft.tokenId}-heal`,
      name: 'Healing Aura',
      description: 'Restore HP to adjacent allies',
      manaCost: 2,
      cooldown: 3,
      currentCooldown: 0,
      effect: { type: 'heal', amount: 3, target: 'ally' },
    };
  }

  if (abilityName.toLowerCase().includes('buff') || abilityName.toLowerCase().includes('boost')) {
    return {
      id: `ability-${nft.contract}-${nft.tokenId}-buff`,
      name: 'Rally',
      description: 'Boost attack of nearby allies',
      manaCost: 2,
      cooldown: 3,
      currentCooldown: 0,
      effect: { type: 'buff', stat: 'attack', amount: 2, duration: 2 },
    };
  }

  if (abilityName.toLowerCase().includes('strike') || abilityName.toLowerCase().includes('attack')) {
    return {
      id: `ability-${nft.contract}-${nft.tokenId}-strike`,
      name: 'Power Strike',
      description: 'Deal extra damage to target',
      manaCost: 3,
      cooldown: 2,
      currentCooldown: 0,
      effect: { type: 'damage', amount: 5, target: 'single' },
    };
  }

  // Generic ability
  return {
    id: `ability-${nft.contract}-${nft.tokenId}-generic`,
    name: abilityName,
    description: 'Special ability from NFT',
    manaCost: 2,
    cooldown: 3,
    currentCooldown: 0,
    effect: { type: 'damage', amount: 3, target: 'single' },
  };
}

/**
 * Convert Tasern NFT to playable BattleCard with LP enhancement
 *
 * Stat mapping strategies:
 * 1. Use NFT attributes if present (attack, defense, hp, speed, etc.)
 * 2. Fall back to balanced defaults based on rarity
 * 3. Apply LP bonus multiplier (0.01 LP = +5% to all stats)
 * 4. Add NFT-specific flavor
 */
export function nftToCard(nft: TasernNFT, lpBonus: number = 0): Card {
  // Extract stats from NFT metadata
  let attack = getTraitValue(nft, 'attack', 0);
  let hp = getTraitValue(nft, 'hp', 0) || getTraitValue(nft, 'health', 0);
  let defense = getTraitValue(nft, 'defense', 0);
  let speed = getTraitValue(nft, 'speed', 0);
  const manaCost = getTraitValue(nft, 'cost', 0) || getTraitValue(nft, 'mana', 0);

  // If no stats in metadata, generate balanced defaults
  if (attack === 0 && hp === 0) {
    const rarity = getTraitString(nft, 'rarity', 'common').toLowerCase();
    const basePower = rarity === 'legendary' ? 8 :
                      rarity === 'epic' ? 6 :
                      rarity === 'rare' ? 5 :
                      rarity === 'uncommon' ? 4 : 3;

    attack = basePower;
    hp = basePower * 2;
    defense = Math.floor(basePower * 0.5);
    speed = basePower;
  }

  // Apply LP bonus
  const lpMultiplier = 1 + (lpBonus / 100);
  attack = Math.floor(attack * lpMultiplier);
  hp = Math.floor(hp * lpMultiplier);
  defense = Math.floor(defense * lpMultiplier);
  speed = Math.floor(speed * lpMultiplier);

  // Ensure minimum stats after all calculations
  attack = Math.max(1, attack);
  hp = Math.max(1, hp);
  defense = Math.max(0, defense);
  speed = Math.max(1, speed);

  // Determine combat type and rarity
  const combatType = determineCombatType(nft);
  const rarity = determineRarity(nft);

  // Generate ability
  const ability = generateAbility(nft);

  // Create card
  const card: Card = {
    id: `nft-${nft.contract}-${nft.tokenId}`,
    name: nft.name,
    attack,
    hp,
    maxHp: hp,
    defense,
    speed,
    manaCost: manaCost || Math.ceil((attack + hp) / 4),
    rarity,
    combatType,
    abilities: ability ? [ability] : [],
    imageUrl: nft.image,
    description: nft.description || 'A powerful NFT from the Tales of Tasern universe',
    isNFT: true,
    nftContract: nft.contract,
    nftTokenId: nft.tokenId,
  };

  return card;
}

/**
 * Convert multiple NFTs to cards
 */
export function nftsToCards(nfts: TasernNFT[], lpBonus: number = 0): Card[] {
  return nfts.map((nft) => nftToCard(nft, lpBonus));
}

/**
 * Filter playable cards from NFT collection
 * Excludes NFTs that don't have minimum stats or are invalid
 */
export function getPlayableNFTCards(nfts: TasernNFT[], lpBonus: number = 0): Card[] {
  const cards = nftsToCards(nfts, lpBonus);

  return cards.filter((card) => {
    // Ensure minimum viable stats
    return card.attack > 0 && card.hp > 0;
  });
}

/**
 * Convert Enhanced NFT (with impact asset data) to playable card
 * Uses actual LP holdings discovered via UniversalImpactScanner
 */
export function enhancedNFTToCard(enhancedNFT: EnhancedNFTData): Card {
  // Convert enhanced NFT to standard NFT format
  const standardNFT: TasernNFT = {
    contract: enhancedNFT.contractAddress,
    tokenId: enhancedNFT.tokenId,
    name: enhancedNFT.name,
    description: enhancedNFT.description,
    image: enhancedNFT.image,
    attributes: []
  };

  // Calculate LP bonus percentage from stat multipliers
  // multiplier = 1 + (bonus%), so bonus% = (multiplier - 1) * 100
  const lpBonusPercentage = (enhancedNFT.statMultipliers.attack - 1) * 100;

  // Convert to card with LP enhancement
  const card = nftToCard(standardNFT, lpBonusPercentage);

  // If this is a duplicate NFT (ERC1155 with multiple copies), append copy index to make ID unique
  if (enhancedNFT.copyIndex !== undefined && enhancedNFT.totalCopies !== undefined && enhancedNFT.totalCopies > 1) {
    card.id = `${card.id}-copy${enhancedNFT.copyIndex}`;
    // Update name to show copy number
    card.name = `${card.name} #${enhancedNFT.copyIndex + 1}`;
  }

  return card;
}

/**
 * Convert multiple enhanced NFTs to cards
 */
export function enhancedNFTsToCards(enhancedNFTs: EnhancedNFTData[]): Card[] {
  return enhancedNFTs.map(enhancedNFTToCard);
}
