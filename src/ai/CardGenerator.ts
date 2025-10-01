// @ts-nocheck
/**
 * Dynamic Card Generator
 *
 * Generates cards on-demand based on:
 * - Current battle state
 * - AI personality
 * - Strategic mode
 * - Available mana
 *
 * Philosophy: AI doesn't pretend to have a deck. It manifests responses.
 *
 * Now enhanced with the full Tales of Tasern lore system!
 */

import type { Card, BattleState, Player, AIMode, AIPersonality, CardRarity, CardAbility } from '../types/core';
import {
  generateLoreName,
  generateLoreDescription,
  randomChoice,
  TASERN_LORE,
} from '../data/tasernLore';

export class CardGenerator {
  private cardIdCounter = 0;

  /**
   * Generate cards for current strategic situation
   */
  generateStrategicCards(
    state: BattleState,
    player: Player,
    mode: AIMode,
    count: number = 3
  ): Card[] {
    const cards: Card[] = [];
    const personality = player.aiPersonality;

    for (let i = 0; i < count; i++) {
      const card = this.generateCard(player, mode, personality);
      cards.push(card);
    }

    return cards;
  }

  /**
   * Generate a single card based on mode and personality
   */
  private generateCard(player: Player, mode: AIMode, personality?: AIPersonality): Card {
    // Determine mana cost (3-7 range typically)
    const manaCost = this.determineManaCost(player, mode);

    // Determine rarity
    const rarity = this.determineRarity(mode, personality);

    // Generate stats based on personality and mode
    const stats = this.generateStats(manaCost, mode, personality);

    // Determine combat type based on stats
    const combatType = this.determineCombatType(stats, mode);

    // Generate lore-rich name and description based on mode
    const name = this.generateNameWithLore(mode, rarity);
    const description = this.generateDescriptionWithLore(mode);

    // Generate abilities based on stats and mode
    const abilities = this.generateAbilities(stats, mode, rarity);

    const card: Card = {
      id: `generated-${this.cardIdCounter++}-${Date.now()}`,
      name,
      attack: stats.attack,
      defense: stats.defense,
      hp: stats.hp,
      maxHp: stats.hp,
      speed: stats.speed,
      manaCost,
      rarity,
      combatType,
      abilities,
      imageUrl: undefined,
    };

    return card;
  }

  /**
   * Determine combat type based on stats and mode
   * High attack + low speed = melee
   * High speed = ranged
   * Balanced = hybrid
   */
  private determineCombatType(
    stats: { attack: number; hp: number; defense: number; speed: number },
    mode: AIMode
  ): 'melee' | 'ranged' | 'hybrid' {
    const speedToAttackRatio = stats.speed / Math.max(1, stats.attack);

    if (mode === 'AGGRESSIVE' || mode === 'DESPERATE') {
      // Aggressive tends toward melee
      return speedToAttackRatio > 1.2 ? 'ranged' : 'melee';
    }

    if (mode === 'DEFENSIVE') {
      // Defensive prefers ranged
      return speedToAttackRatio > 0.8 ? 'ranged' : 'hybrid';
    }

    // Adaptive/Experimental: balanced distribution
    if (speedToAttackRatio > 1.5) return 'ranged';
    if (speedToAttackRatio < 0.7) return 'melee';
    return 'hybrid';
  }

  /**
   * Determine appropriate mana cost for situation
   */
  private determineManaCost(player: Player, mode: AIMode): number {
    const availableMana = player.mana;

    if (mode === 'DESPERATE') {
      // Desperate: use all mana!
      return Math.min(availableMana, 8);
    }

    if (mode === 'AGGRESSIVE') {
      // Aggressive: mid-to-high cost
      return Math.min(Math.floor(Math.random() * 3) + 5, availableMana);
    }

    if (mode === 'DEFENSIVE') {
      // Defensive: lower cost for multiple units
      return Math.min(Math.floor(Math.random() * 2) + 3, availableMana);
    }

    // Adaptive/Experimental: varied
    return Math.min(Math.floor(Math.random() * 4) + 4, availableMana);
  }

  /**
   * Determine card rarity
   */
  private determineRarity(mode: AIMode, personality?: AIPersonality): CardRarity {
    const creativity = personality?.creativity || 0.5;
    const random = Math.random();

    if (mode === 'EXPERIMENTAL' || creativity > 0.8) {
      // More likely to generate rare cards
      if (random < 0.05) return 'legendary';
      if (random < 0.15) return 'epic';
      if (random < 0.35) return 'rare';
      if (random < 0.60) return 'uncommon';
      return 'common';
    }

    // Normal distribution
    if (random < 0.02) return 'legendary';
    if (random < 0.08) return 'epic';
    if (random < 0.20) return 'rare';
    if (random < 0.40) return 'uncommon';
    return 'common';
  }

  /**
   * Generate stats based on mana cost and personality
   */
  private generateStats(
    manaCost: number,
    mode: AIMode,
    personality?: AIPersonality
  ): {
    attack: number;
    defense: number;
    hp: number;
    speed: number;
  } {
    const baseStats = manaCost * 2; // Total stat budget
    const aggression = personality?.aggression || 0.5;

    let attack: number;
    let hp: number;
    let defense: number;
    let speed: number;

    if (mode === 'AGGRESSIVE') {
      // High attack, lower HP
      attack = Math.floor(baseStats * (0.6 + aggression * 0.2));
      hp = Math.floor(baseStats * (0.9 - aggression * 0.3));
      defense = Math.floor(manaCost * 0.5);
      speed = Math.floor(manaCost * 0.8);
    } else if (mode === 'DEFENSIVE') {
      // High HP/defense, lower attack
      attack = Math.floor(baseStats * (0.4 + aggression * 0.1));
      hp = Math.floor(baseStats * (1.2 - aggression * 0.2));
      defense = Math.floor(manaCost * 1.2);
      speed = Math.floor(manaCost * 0.5);
    } else if (mode === 'DESPERATE') {
      // Glass cannon - high attack, low HP
      attack = Math.floor(baseStats * (0.8 + aggression * 0.2));
      hp = Math.floor(baseStats * 0.6);
      defense = Math.floor(manaCost * 0.3);
      speed = Math.floor(manaCost * 1.0);
    } else {
      // Balanced
      attack = Math.floor(baseStats * (0.5 + aggression * 0.2));
      hp = Math.floor(baseStats * (1.0 - aggression * 0.2));
      defense = Math.floor(manaCost * 0.7);
      speed = Math.floor(manaCost * 0.7);
    }

    // Ensure minimums
    attack = Math.max(1, attack);
    hp = Math.max(1, hp);
    defense = Math.max(0, defense);
    speed = Math.max(1, speed);

    return { attack, defense, hp, speed };
  }

  /**
   * Generate lore-rich name using Tales of Tasern database
   */
  private generateNameWithLore(mode: AIMode, rarity: CardRarity): string {
    // Map AI modes to lore template keys
    const templateKey = mode.toLowerCase();

    // Generate base name from lore
    let name = generateLoreName(templateKey);

    // Enhance legendary/epic names with regions
    if (rarity === 'legendary') {
      const region = randomChoice(TASERN_LORE.regions);
      name = `${name} of ${region}`;
    } else if (rarity === 'epic') {
      const element = randomChoice(TASERN_LORE.elements);
      name = `${element} ${name}`;
    }

    return name;
  }

  /**
   * Generate lore-rich description
   */
  private generateDescriptionWithLore(mode: AIMode): string {
    const templateKey = mode.toLowerCase();
    return generateLoreDescription(templateKey);
  }

  /**
   * Generate abilities based on stats and mode
   * Now includes functional abilities: Guardian Aura, Regeneration, Thorns, Rally
   */
  private generateAbilities(
    stats: { attack: number; hp: number; defense: number; speed: number },
    mode: AIMode,
    rarity: CardRarity
  ): CardAbility[] {
    const abilities: CardAbility[] = [];

    // Functional passive abilities based on stats
    if (stats.defense >= 5 && Math.random() < 0.3) {
      abilities.push({
        id: `ability-guardian-${Date.now()}`,
        name: 'Guardian Aura',
        description: '+5 defense to adjacent allies',
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        effect: { type: 'buff', stat: 'defense', amount: 5, duration: 0 },
      });
    }

    if (stats.hp >= 10 && Math.random() < 0.3) {
      abilities.push({
        id: `ability-regen-${Date.now()}`,
        name: 'Regeneration',
        description: 'Heal 2 HP at start of turn',
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        effect: { type: 'heal', amount: 2, target: 'self' },
      });
    }

    if (stats.defense >= 6 && Math.random() < 0.25) {
      abilities.push({
        id: `ability-thorns-${Date.now()}`,
        name: 'Thorns',
        description: 'Reflect 30% of damage taken',
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        effect: { type: 'damage', amount: 0.3, target: 'single' },
      });
    }

    if (stats.attack >= 7 && Math.random() < 0.3) {
      abilities.push({
        id: `ability-rally-${Date.now()}`,
        name: 'Rally',
        description: '+5 attack to adjacent allies',
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        effect: { type: 'buff', stat: 'attack', amount: 5, duration: 0 },
      });
    }

    // Mode-specific abilities
    if (mode === 'AGGRESSIVE' && Math.random() < 0.4) {
      abilities.push({
        id: `ability-berserker-${Date.now()}`,
        name: 'Berserker Rage',
        description: '+2 attack, -1 defense',
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        effect: { type: 'buff', stat: 'attack', amount: 2, duration: 0 },
      });
    } else if (mode === 'DEFENSIVE' && Math.random() < 0.4) {
      abilities.push({
        id: `ability-iron-${Date.now()}`,
        name: 'Iron Will',
        description: '+3 defense',
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        effect: { type: 'buff', stat: 'defense', amount: 3, duration: 0 },
      });
    }

    // Rarity-based abilities
    if (rarity === 'legendary' && Math.random() < 0.5) {
      abilities.push({
        id: `ability-legendary-${Date.now()}`,
        name: 'Legendary Presence',
        description: '+10% to all stats',
        manaCost: 0,
        cooldown: 0,
        currentCooldown: 0,
        effect: { type: 'buff', stat: 'attack', amount: 10, duration: 0 },
      });
    }

    return abilities;
  }

  /**
   * Generate a specific card for a situation
   * (Future: generate counters to specific threats)
   */
  generateCounterCard(
    player: Player,
    threatCard: Card,
    mode: AIMode
  ): Card {
    // Generate a card specifically designed to counter the threat
    const manaCost = Math.min(player.mana, threatCard.manaCost + 2);

    const stats = {
      attack: Math.floor(threatCard.hp * 1.2), // Enough to kill threat
      hp: Math.floor(threatCard.attack * 0.8), // Survive one hit
      defense: Math.floor(manaCost * 0.8),
      speed: Math.floor(manaCost * 0.9),
    };

    return {
      id: `counter-${this.cardIdCounter++}-${Date.now()}`,
      name: `${threatCard.name} Slayer`,
      ...stats,
      maxHp: stats.hp,
      manaCost,
      rarity: 'uncommon',
      combatType: 'hybrid',
      abilities: [] as CardAbility[],
    };
  }
}
