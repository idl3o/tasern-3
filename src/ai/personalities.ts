/**
 * AI Personalities from the Tales of Tasern Universe
 *
 * Five distinct opponents, each with unique traits and playstyles.
 * Created by Dungeon Master James McGee (@JamesMageeCCC)
 */

import type { AIPersonality } from '../types/core';

/**
 * Sir Stumbleheart - "The Noble Blunderer"
 *
 * A well-meaning knight whose honor sometimes clouds his judgment.
 * Makes creative but not always optimal plays. Beloved for his personality,
 * not his tactical prowess.
 *
 * Playstyle: Unpredictable, creative, but often sub-optimal
 */
export const SIR_STUMBLEHEART: AIPersonality = {
  name: 'Sir Stumbleheart',
  title: 'The Noble Blunderer',
  aggression: 0.3,
  creativity: 0.8,
  riskTolerance: 0.4,
  patience: 0.6,
  adaptability: 0.5,
  flavorText:
    '"By the honor of my forefathers, I shall... wait, where did my knight go? Oh dear."',
};

/**
 * Lady Swiftblade - "The Lightning Duelist"
 *
 * A master swordswoman who strikes before you can blink.
 * Aggressive, fast-paced, always on the attack.
 * High risk, high reward playstyle.
 *
 * Playstyle: Aggressive rushdown, minimal defense
 */
export const LADY_SWIFTBLADE: AIPersonality = {
  name: 'Lady Swiftblade',
  title: 'The Lightning Duelist',
  aggression: 0.8,
  creativity: 0.6,
  riskTolerance: 0.7,
  patience: 0.2,
  adaptability: 0.5,
  flavorText: '"You\'ll be defeated before you even draw your sword. Speed is everything."',
};

/**
 * Thornwick the Tactician - "The Chess Master"
 *
 * A brilliant strategist who sees five moves ahead.
 * Patient, adaptive, makes optimal plays more often than not.
 * The "hardest" difficulty opponent.
 *
 * Playstyle: Calculated, defensive, optimal decision-making
 */
export const THORNWICK_THE_TACTICIAN: AIPersonality = {
  name: 'Thornwick',
  title: 'The Chess Master',
  aggression: 0.5,
  creativity: 0.5,
  riskTolerance: 0.3,
  patience: 0.8,
  adaptability: 0.9,
  flavorText: '"Every move is a calculation. Every piece serves a purpose. Checkmate."',
};

/**
 * Grok the Unpredictable - "The Chaos Warrior"
 *
 * An orc warlord who doesn't believe in plans.
 * Extremely creative, high risk tolerance, makes wild plays.
 * Sometimes brilliant, sometimes suicidal.
 *
 * Playstyle: Chaotic, experimental, completely unpredictable
 */
export const GROK_THE_UNPREDICTABLE: AIPersonality = {
  name: 'Grok',
  title: 'The Chaos Warrior',
  aggression: 0.7,
  creativity: 0.9,
  riskTolerance: 0.8,
  patience: 0.3,
  adaptability: 0.6,
  flavorText: '"Plan? Grok no need plan! Grok SMASH! Then... maybe SMASH more?"',
};

/**
 * Archmagus Nethys - "Master of the Arcane"
 *
 * An ancient wizard who treats battle as an experiment.
 * High creativity, patient, willing to try unusual strategies.
 * Balanced but unpredictable.
 *
 * Playstyle: Experimental, balanced, arcane-themed strategies
 */
export const ARCHMAGUS_NETHYS: AIPersonality = {
  name: 'Archmagus Nethys',
  title: 'Master of the Arcane',
  aggression: 0.4,
  creativity: 0.9,
  riskTolerance: 0.5,
  patience: 0.7,
  adaptability: 0.7,
  flavorText: '"Fascinating... let us see what happens when I apply THIS spell configuration..."',
};

/**
 * All personalities for easy access
 */
export const ALL_PERSONALITIES: AIPersonality[] = [
  SIR_STUMBLEHEART,
  LADY_SWIFTBLADE,
  THORNWICK_THE_TACTICIAN,
  GROK_THE_UNPREDICTABLE,
  ARCHMAGUS_NETHYS,
];

/**
 * Get a random personality
 */
export function getRandomPersonality(): AIPersonality {
  return ALL_PERSONALITIES[Math.floor(Math.random() * ALL_PERSONALITIES.length)];
}

/**
 * Get personality by name
 */
export function getPersonalityByName(name: string): AIPersonality | undefined {
  return ALL_PERSONALITIES.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get personality difficulty rating (0-1, 1 being hardest)
 */
export function getPersonalityDifficulty(personality: AIPersonality): number {
  // Difficulty is based on patience and adaptability
  return (personality.patience * 0.5 + personality.adaptability * 0.5);
}

/**
 * Get recommended personality for player skill level
 */
export function getRecommendedPersonality(skillLevel: 'beginner' | 'intermediate' | 'advanced'): AIPersonality {
  switch (skillLevel) {
    case 'beginner':
      return SIR_STUMBLEHEART; // Creative but makes mistakes
    case 'intermediate':
      return Math.random() < 0.5 ? LADY_SWIFTBLADE : GROK_THE_UNPREDICTABLE;
    case 'advanced':
      return THORNWICK_THE_TACTICIAN; // The chess master
    default:
      return getRandomPersonality();
  }
}
