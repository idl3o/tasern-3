/**
 * Tales of Tasern Visual Theme
 *
 * Medieval D&D fantasy aesthetic constants.
 * Based on the proven D&D theme from tasern 2.
 *
 * Philosophy: Every color, every shadow, every glow honors
 * the Tales of Tasern universe created by James McGee.
 */

export const TASERN_COLORS = {
  // D&D Official Colors
  dndRed: '#7A200D',
  dndParchment: '#FDF1DC',
  dndBronze: '#CD7F32',
  dndGold: '#FFD700',
  dndCrimson: '#DC143C',
  dndForest: '#228B22',
  dndMidnight: '#191970',
  dndArcane: '#9932CC',

  // Bronze/Gold Palette (Primary)
  bronze: '#8B6914',
  gold: '#D4AF37',
  parchment: '#F4E4C1',
  leather: '#5C4033',
  stone: '#6B7280',

  // Accent Colors
  red: '#8B0000', // Damage, fire
  blue: '#1E3A8A', // Mana, water
  green: '#065F46', // Nature, healing
  purple: '#5B21B6', // Magic, legendary
  white: '#F9FAFB',
  black: '#111827',

  // Metal Textures
  goldShine: '#DAA520',
  bronzeShine: '#B8860B',
  silverShine: '#C0C0C0',
  platinumShine: '#E5E4E2',

  // Enhancement Tiers
  standard: '#808080',
  bronzeTier: '#CD7F32',
  silverTier: '#C0C0C0',
  goldTier: '#FFD700',
  platinumTier: '#E5E4E2',
  diamondTier: '#B9F2FF',
} as const;

export const TASERN_GRADIENTS = {
  parchmentTexture: 'linear-gradient(45deg, #FDF1DC 25%, #F5E6CC 25%, #F5E6CC 50%, #FDF1DC 50%, #FDF1DC 75%, #F5E6CC 75%)',
  metalTexture: 'linear-gradient(135deg, #CD7F32 0%, #DAA520 25%, #B8860B 50%, #CD7F32 75%, #8B4513 100%)',
  woodTexture: 'linear-gradient(90deg, #8B4513 0%, #A0522D 25%, #CD853F 50%, #DEB887 75%, #D2691E 100%)',

  // Card backgrounds
  cardBackground: 'linear-gradient(135deg, #3a2a1a 0%, #1a1410 100%)',
  enhancedCardBg: 'linear-gradient(45deg, transparent 30%, rgba(255, 215, 0, 0.1) 50%, transparent 70%)',
  legendaryCardBg: 'linear-gradient(45deg, transparent 30%, rgba(153, 50, 204, 0.1) 50%, transparent 70%)',

  // Enhancement tiers
  bronzeGradient: 'linear-gradient(135deg, #CD7F32, #DAA520)',
  silverGradient: 'linear-gradient(135deg, #C0C0C0, #E6E6FA)',
  goldGradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
  platinumGradient: 'linear-gradient(135deg, #E5E4E2, #FFFFFF)',
  diamondGradient: 'linear-gradient(135deg, #B9F2FF, #E0FFFF)',
} as const;

export const TASERN_SHADOWS = {
  soft: '0 2px 8px rgba(0, 0, 0, 0.15)',
  medium: '0 4px 16px rgba(0, 0, 0, 0.25)',
  strong: '0 8px 32px rgba(0, 0, 0, 0.4)',
  glowGold: '0 0 20px rgba(255, 215, 0, 0.6)',
  glowArcane: '0 0 20px rgba(153, 50, 204, 0.6)',
  glowRed: '0 0 20px rgba(220, 20, 60, 0.6)',
  glowBlue: '0 0 20px rgba(30, 58, 138, 0.6)',
  textGold: '0 0 10px rgba(212, 175, 55, 0.8)',
} as const;

export const TASERN_TYPOGRAPHY = {
  // Font families
  heading: "'Cinzel', serif",
  body: "'Crimson Text', serif",
  accent: "'Uncial Antiqua', cursive",
  monospace: "'Courier New', monospace",

  // Font sizes
  titleLarge: '2.5rem',
  titleMedium: '2rem',
  titleSmall: '1.5rem',
  headingLarge: '1.25rem',
  headingMedium: '1.125rem',
  headingSmall: '1rem',
  bodyLarge: '1rem',
  bodyMedium: '0.875rem',
  bodySmall: '0.75rem',

  // Font weights
  weightLight: '400',
  weightMedium: '600',
  weightBold: '700',

  // Letter spacing
  spacingTight: '-0.025em',
  spacingNormal: '0',
  spacingWide: '0.05em',
  spacingExtraWide: '0.1em',
} as const;

export const TASERN_SPACING = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
} as const;

export const TASERN_BORDERS = {
  radiusSmall: '4px',
  radiusMedium: '8px',
  radiusLarge: '12px',
  radiusRound: '50%',

  widthThin: '1px',
  widthMedium: '2px',
  widthThick: '3px',
} as const;

/**
 * Get color by card rarity
 */
export function getRarityColor(rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'): string {
  switch (rarity) {
    case 'common':
      return TASERN_COLORS.stone;
    case 'uncommon':
      return TASERN_COLORS.green;
    case 'rare':
      return TASERN_COLORS.blue;
    case 'epic':
      return TASERN_COLORS.purple;
    case 'legendary':
      return TASERN_COLORS.gold;
    default:
      return TASERN_COLORS.stone;
  }
}

/**
 * Get border for card rarity
 */
export function getRarityBorder(rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'): string {
  const color = getRarityColor(rarity);
  return `${TASERN_BORDERS.widthThick} solid ${color}`;
}

/**
 * Get glow effect for rarity
 */
export function getRarityGlow(rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'): string {
  switch (rarity) {
    case 'legendary':
      return TASERN_SHADOWS.glowGold;
    case 'epic':
      return TASERN_SHADOWS.glowArcane;
    case 'rare':
      return TASERN_SHADOWS.glowBlue;
    default:
      return 'none';
  }
}

/**
 * CSS-in-JS helper: Convert theme values to CSS custom properties
 */
export function generateCSSVariables(): Record<string, string> {
  return {
    // Colors
    '--tasern-bronze': TASERN_COLORS.bronze,
    '--tasern-gold': TASERN_COLORS.gold,
    '--tasern-parchment': TASERN_COLORS.parchment,
    '--tasern-leather': TASERN_COLORS.leather,
    '--tasern-stone': TASERN_COLORS.stone,

    // Typography
    '--tasern-font-heading': TASERN_TYPOGRAPHY.heading,
    '--tasern-font-body': TASERN_TYPOGRAPHY.body,
    '--tasern-font-accent': TASERN_TYPOGRAPHY.accent,

    // Shadows
    '--tasern-shadow-soft': TASERN_SHADOWS.soft,
    '--tasern-shadow-medium': TASERN_SHADOWS.medium,
    '--tasern-shadow-strong': TASERN_SHADOWS.strong,
    '--tasern-glow-gold': TASERN_SHADOWS.glowGold,

    // Gradients
    '--tasern-bg-card': TASERN_GRADIENTS.cardBackground,
    '--tasern-texture-parchment': TASERN_GRADIENTS.parchmentTexture,
  };
}

/**
 * Animation durations (in milliseconds)
 */
export const TASERN_ANIMATIONS = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,

  // Specific animations
  cardDeploy: 500,
  cardAttack: 600,
  cardDestroy: 800,
  damageNumber: 1000,
  turnTransition: 400,
} as const;

/**
 * Icon mappings for game elements
 */
export const TASERN_ICONS = {
  // Stats
  attack: '⚔️',
  defense: '🛡️',
  hp: '❤️',
  mana: '💎',
  speed: '⚡',

  // Weather
  weatherClear: '☀️',
  weatherRain: '🌧️',
  weatherStorm: '⛈️',
  weatherFog: '🌫️',
  weatherSnow: '❄️',

  // Formations
  formationVanguard: '⚔️',
  formationPhalanx: '🛡️',
  formationArcher: '🏹',
  formationFlanking: '🦅',
  formationSiege: '🏰',
  formationSkirmish: '⚡',

  // Status
  victory: '🏆',
  defeat: '💀',
  turn: '🔄',
  castle: '🏰',
  star: '⭐',

  // Effects
  fire: '🔥',
  water: '💧',
  earth: '🌍',
  wind: '💨',
  lightning: '⚡',
  ice: '❄️',
  poison: '☠️',
  heal: '✨',
  buff: '↑',
  debuff: '↓',
} as const;
