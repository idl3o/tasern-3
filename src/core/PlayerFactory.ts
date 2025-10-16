/**
 * Player Factory
 *
 * Creates properly configured players with strategies.
 * Ensures the strategy pattern is always used correctly.
 */

import type { Player, AIPersonality } from '../types/core';
import { HumanStrategy } from '../strategies/HumanStrategy';
import { AIStrategy } from '../strategies/AIStrategy';
import { getRandomPersonality, getRecommendedPersonality } from '../ai/personalities';

let playerIdCounter = 0;

export class PlayerFactory {
  /**
   * Create a human player
   */
  static createHuman(name: string, options?: {
    castleHp?: number;
    maxMana?: number;
    lpBonus?: number;
  }): Player {
    const id = `human-${playerIdCounter++}`;

    return {
      id,
      name,
      type: 'human',
      castleHp: options?.castleHp ?? 50,
      maxCastleHp: options?.castleHp ?? 50,
      mana: options?.maxMana ?? 10,
      maxMana: options?.maxMana ?? 10,
      hand: [],
      deck: [],
      strategy: new HumanStrategy(),
      lpBonus: options?.lpBonus ?? 0,
    };
  }

  /**
   * Create an AI player with specific personality
   */
  static createAI(
    name: string,
    personality: AIPersonality,
    options?: {
      castleHp?: number;
      maxMana?: number;
      lpBonus?: number;
    }
  ): Player {
    const id = `ai-${playerIdCounter++}`;

    return {
      id,
      name,
      type: 'ai',
      castleHp: options?.castleHp ?? 50,
      maxCastleHp: options?.castleHp ?? 50,
      mana: options?.maxMana ?? 10,
      maxMana: options?.maxMana ?? 10,
      hand: [],
      deck: [],
      strategy: new AIStrategy(),
      lpBonus: options?.lpBonus ?? 0,
      aiPersonality: personality,
    };
  }

  /**
   * Create an AI player with random personality
   */
  static createRandomAI(name: string, options?: {
    castleHp?: number;
    maxMana?: number;
    lpBonus?: number;
  }): Player {
    const personality = getRandomPersonality();
    return this.createAI(name, personality, options);
  }

  /**
   * Create an AI player with difficulty-appropriate personality
   */
  static createAIForSkillLevel(
    skillLevel: 'beginner' | 'intermediate' | 'advanced',
    options?: {
      castleHp?: number;
      maxMana?: number;
      lpBonus?: number;
    }
  ): Player {
    const personality = getRecommendedPersonality(skillLevel);
    return this.createAI(personality.name, personality, options);
  }

  /**
   * Create a test player (AI with no personality, for testing)
   */
  static createTestAI(name: string): Player {
    const id = `test-${playerIdCounter++}`;

    return {
      id,
      name,
      type: 'ai',
      castleHp: 50,
      maxCastleHp: 50,
      mana: 10,
      maxMana: 10,
      hand: [],
      deck: [],
      strategy: new AIStrategy(),
      lpBonus: 0,
      aiPersonality: {
        name: 'Test AI',
        title: 'Testing Bot',
        aggression: 0.5,
        creativity: 0.5,
        riskTolerance: 0.5,
        patience: 0.5,
        adaptability: 0.5,
        flavorText: 'Beep boop. Running tests.',
      },
    };
  }
}
