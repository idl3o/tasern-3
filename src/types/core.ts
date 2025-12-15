/**
 * Core type definitions for Tasern Siegefront
 * The foundational reality of our game universe
 */

// ============================================================================
// CARD TYPES
// ============================================================================

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type CombatType = 'melee' | 'ranged' | 'hybrid';

export interface Card {
  id: string;
  name: string;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  speed: number;
  manaCost: number;
  rarity: CardRarity;
  combatType: CombatType;
  abilities: CardAbility[];
  imageUrl?: string;
  description?: string;
  isNFT?: boolean;
  nftContract?: string;
  nftTokenId?: string;
}

export interface BattleCard extends Card {
  position: Position;
  ownerId: string;
  hasMoved: boolean;
  hasAttacked: boolean;
  statusEffects: StatusEffect[];
}

export interface CardAbility {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldown: number;
  currentCooldown: number;
  effect: AbilityEffect;
}

export type AbilityEffect =
  | { type: 'damage'; amount: number; target: 'single' | 'area' }
  | { type: 'heal'; amount: number; target: 'self' | 'ally' }
  | { type: 'buff'; stat: 'attack' | 'defense' | 'speed'; amount: number; duration: number }
  | { type: 'debuff'; stat: 'attack' | 'defense' | 'speed'; amount: number; duration: number };

export interface StatusEffect {
  id: string;
  type: 'buff' | 'debuff' | 'stun' | 'poison';
  stat?: 'attack' | 'defense' | 'speed';
  modifier: number;
  duration: number;
  source: string;
}

// ============================================================================
// POSITION & BATTLEFIELD
// ============================================================================

export interface Position {
  row: number; // 0-N (top to bottom)
  col: number; // 0-N (left to right - this is the depth/zone axis!)
}

export type Battlefield = (BattleCard | null)[][];

/**
 * Map Theme - Visual styling for battlefields
 */
export type MapTheme =
  | 'CLASSIC_STONE'
  | 'FOREST_GROVE'
  | 'MOUNTAIN_PASS'
  | 'DESERT_WASTES'
  | 'FROZEN_TUNDRA'
  | 'VOLCANIC_RIFT'
  | 'SWAMP_MARSH'
  | 'CASTLE_COURTYARD'
  | 'ETHEREAL_VOID';

export interface MapThemeData {
  name: string;
  backgroundColor: string;
  cellColor: string;
  borderColor: string;
  accentColor: string;
  icon: string;
  description: string;
}

export const MAP_THEMES: Record<MapTheme, MapThemeData> = {
  CLASSIC_STONE: {
    name: 'Stone Arena',
    backgroundColor: '#2C2C2C',
    cellColor: '#4A4A4A',
    borderColor: '#6B7280',
    accentColor: '#8B6914',
    icon: '🏛️',
    description: 'Classic medieval stone battlefield',
  },
  FOREST_GROVE: {
    name: 'Forest Grove',
    backgroundColor: '#1A3A1A',
    cellColor: '#2D5016',
    borderColor: '#228B22',
    accentColor: '#065F46',
    icon: '🌲',
    description: 'Dense forest with natural cover',
  },
  MOUNTAIN_PASS: {
    name: 'Mountain Pass',
    backgroundColor: '#3C3C3C',
    cellColor: '#5C5C5C',
    borderColor: '#808080',
    accentColor: '#A9A9A9',
    icon: '⛰️',
    description: 'Rocky mountain terrain with elevation',
  },
  DESERT_WASTES: {
    name: 'Desert Wastes',
    backgroundColor: '#C19A6B',
    cellColor: '#D2B48C',
    borderColor: '#DEB887',
    accentColor: '#F4A460',
    icon: '🏜️',
    description: 'Scorching sands and harsh sun',
  },
  FROZEN_TUNDRA: {
    name: 'Frozen Tundra',
    backgroundColor: '#B0E0E6',
    cellColor: '#E0FFFF',
    borderColor: '#87CEEB',
    accentColor: '#4682B4',
    icon: '❄️',
    description: 'Ice and snow slow movement',
  },
  VOLCANIC_RIFT: {
    name: 'Volcanic Rift',
    backgroundColor: '#2C1810',
    cellColor: '#4A2010',
    borderColor: '#8B0000',
    accentColor: '#FF4500',
    icon: '🌋',
    description: 'Lava flows and scorched earth',
  },
  SWAMP_MARSH: {
    name: 'Swamp Marsh',
    backgroundColor: '#2F4F2F',
    cellColor: '#3C5A3C',
    borderColor: '#556B2F',
    accentColor: '#6B8E23',
    icon: '🐊',
    description: 'Murky waters impede movement',
  },
  CASTLE_COURTYARD: {
    name: 'Castle Courtyard',
    backgroundColor: '#36454F',
    cellColor: '#4F5D75',
    borderColor: '#708090',
    accentColor: '#8B6914',
    icon: '🏰',
    description: 'Fortified castle interior',
  },
  ETHEREAL_VOID: {
    name: 'Ethereal Void',
    backgroundColor: '#1A0033',
    cellColor: '#2D004D',
    borderColor: '#5B21B6',
    accentColor: '#9932CC',
    icon: '✨',
    description: 'Mystical arcane dimension',
  },
};

/**
 * Map Layout - Defines shape and obstacles
 */
export interface MapLayout {
  rows: number;
  cols: number;
  name: string;
  description: string;
  // Array of blocked positions (obstacles, impassable terrain)
  blockedTiles: Position[];
  // Special tiles (high ground, etc.) - will have terrain effects
  specialTiles: { position: Position; type: string }[];
}

export type MapLayoutPreset =
  | 'CLASSIC_3X3'
  | 'LARGE_4X4'
  | 'WIDE_5X3'
  | 'NARROW_3X5'
  | 'COMPACT_2X4'
  | 'MASSIVE_5X5'
  | 'L_SHAPED'
  | 'T_SHAPED'
  | 'CROSS_SHAPED'
  | 'DIAMOND'
  | 'CASTLE_WALLS';

export const MAP_LAYOUTS: Record<MapLayoutPreset, MapLayout> = {
  CLASSIC_3X3: {
    rows: 3,
    cols: 3,
    name: 'Classic Arena',
    description: 'Traditional 3x3 battlefield',
    blockedTiles: [],
    specialTiles: [],
  },
  LARGE_4X4: {
    rows: 4,
    cols: 4,
    name: 'Grand Battlefield',
    description: '4x4 arena with center obstacle',
    blockedTiles: [
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
    specialTiles: [],
  },
  WIDE_5X3: {
    rows: 3,
    cols: 5,
    name: 'Wide Front',
    description: 'Horizontal battlefield',
    blockedTiles: [],
    specialTiles: [
      { position: { row: 1, col: 2 }, type: 'HIGH_GROUND' },
    ],
  },
  NARROW_3X5: {
    rows: 5,
    cols: 3,
    name: 'Deep Trenches',
    description: 'Vertical battlefield',
    blockedTiles: [],
    specialTiles: [],
  },
  COMPACT_2X4: {
    rows: 2,
    cols: 4,
    name: 'Skirmish Line',
    description: 'Fast-paced encounters',
    blockedTiles: [],
    specialTiles: [],
  },
  MASSIVE_5X5: {
    rows: 5,
    cols: 5,
    name: 'Epic Siege',
    description: 'Grand scale warfare',
    blockedTiles: [],
    specialTiles: [
      { position: { row: 2, col: 2 }, type: 'HIGH_GROUND' },
    ],
  },
  L_SHAPED: {
    rows: 4,
    cols: 4,
    name: 'L-Shaped Pass',
    description: 'Asymmetric L-shaped battlefield',
    blockedTiles: [
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 3 },
    ],
    specialTiles: [],
  },
  T_SHAPED: {
    rows: 4,
    cols: 5,
    name: 'T-Junction',
    description: 'Three-way tactical chokepoint',
    blockedTiles: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
    ],
    specialTiles: [],
  },
  CROSS_SHAPED: {
    rows: 5,
    cols: 5,
    name: 'Crossroads',
    description: 'Four-way intersection',
    blockedTiles: [
      { row: 0, col: 0 },
      { row: 0, col: 4 },
      { row: 4, col: 0 },
      { row: 4, col: 4 },
      { row: 1, col: 0 },
      { row: 1, col: 4 },
      { row: 3, col: 0 },
      { row: 3, col: 4 },
    ],
    specialTiles: [
      { position: { row: 2, col: 2 }, type: 'HIGH_GROUND' },
    ],
  },
  DIAMOND: {
    rows: 5,
    cols: 5,
    name: 'Diamond Arena',
    description: 'Diamond-shaped battlefield',
    blockedTiles: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 3 },
      { row: 0, col: 4 },
      { row: 1, col: 0 },
      { row: 1, col: 4 },
      { row: 3, col: 0 },
      { row: 3, col: 4 },
      { row: 4, col: 0 },
      { row: 4, col: 1 },
      { row: 4, col: 3 },
      { row: 4, col: 4 },
    ],
    specialTiles: [],
  },
  CASTLE_WALLS: {
    rows: 4,
    cols: 5,
    name: 'Castle Walls',
    description: 'Fortified chokepoint with walls',
    blockedTiles: [
      { row: 1, col: 1 },
      { row: 1, col: 3 },
      { row: 2, col: 1 },
      { row: 2, col: 3 },
    ],
    specialTiles: [
      { position: { row: 1, col: 2 }, type: 'HIGH_GROUND' },
      { position: { row: 2, col: 2 }, type: 'HIGH_GROUND' },
    ],
  },
};

/**
 * Complete Map Preset - Combines layout + theme + weather + terrain
 */
export interface MapPreset {
  layout: MapLayoutPreset;
  theme: MapTheme;
  weather: WeatherType | null;
  name: string;
  fullDescription: string;
}

export type CompleteMapPreset =
  | 'CLASSIC_ARENA'
  | 'FOREST_CLEARING'
  | 'MOUNTAIN_FORTRESS'
  | 'DESERT_RUINS'
  | 'FROZEN_WASTE'
  | 'VOLCANIC_CRATER'
  | 'CURSED_SWAMP'
  | 'ROYAL_COURTYARD'
  | 'ARCANE_NEXUS'
  | 'L_SHAPED_CANYON'
  | 'T_CROSSROADS';

export const COMPLETE_MAP_PRESETS: Record<CompleteMapPreset, MapPreset> = {
  CLASSIC_ARENA: {
    layout: 'CLASSIC_3X3',
    theme: 'CLASSIC_STONE',
    weather: null,
    name: 'Classic Arena',
    fullDescription: 'Traditional stone battlefield under clear skies',
  },
  FOREST_CLEARING: {
    layout: 'WIDE_5X3',
    theme: 'FOREST_GROVE',
    weather: 'FOG',
    name: 'Misty Forest Clearing',
    fullDescription: 'Wide forest battlefield shrouded in fog',
  },
  MOUNTAIN_FORTRESS: {
    layout: 'CASTLE_WALLS',
    theme: 'MOUNTAIN_PASS',
    weather: 'SNOW',
    name: 'Mountain Fortress',
    fullDescription: 'Fortified mountain pass in snowy conditions',
  },
  DESERT_RUINS: {
    layout: 'DIAMOND',
    theme: 'DESERT_WASTES',
    weather: 'SANDSTORM',
    name: 'Desert Ruins',
    fullDescription: 'Ancient diamond-shaped ruins in a sandstorm',
  },
  FROZEN_WASTE: {
    layout: 'NARROW_3X5',
    theme: 'FROZEN_TUNDRA',
    weather: 'BLIZZARD',
    name: 'Frozen Wasteland',
    fullDescription: 'Treacherous tundra ravaged by blizzards',
  },
  VOLCANIC_CRATER: {
    layout: 'CROSS_SHAPED',
    theme: 'VOLCANIC_RIFT',
    weather: 'HEATWAVE',
    name: 'Volcanic Crater',
    fullDescription: 'Scorching crossroads amid flowing lava',
  },
  CURSED_SWAMP: {
    layout: 'L_SHAPED',
    theme: 'SWAMP_MARSH',
    weather: 'FOG',
    name: 'Cursed Swamp',
    fullDescription: 'Twisted L-shaped marshland in thick fog',
  },
  ROYAL_COURTYARD: {
    layout: 'LARGE_4X4',
    theme: 'CASTLE_COURTYARD',
    weather: 'RAIN',
    name: 'Royal Courtyard',
    fullDescription: 'Grand castle courtyard in the rain',
  },
  ARCANE_NEXUS: {
    layout: 'MASSIVE_5X5',
    theme: 'ETHEREAL_VOID',
    weather: 'ARCANE_STORM',
    name: 'Arcane Nexus',
    fullDescription: 'Mystical void crackling with arcane energy',
  },
  L_SHAPED_CANYON: {
    layout: 'L_SHAPED',
    theme: 'MOUNTAIN_PASS',
    weather: null,
    name: 'L-Shaped Canyon',
    fullDescription: 'Asymmetric mountain canyon passage',
  },
  T_CROSSROADS: {
    layout: 'T_SHAPED',
    theme: 'CLASSIC_STONE',
    weather: null,
    name: 'T-Junction Crossroads',
    fullDescription: 'Three-way stone crossroads',
  },
};

/**
 * Legacy GridConfig type for backwards compatibility
 */
export interface GridConfig {
  rows: number;
  cols: number;
  name: string;
  description: string;
  theme?: MapTheme;
  weather?: WeatherType | null;
  blockedTiles?: Position[];
}

export type GridPreset = MapLayoutPreset;
export const GRID_PRESETS: Record<GridPreset, GridConfig> = MAP_LAYOUTS;

export type FormationType =
  | 'VANGUARD'     // Front-loaded offense
  | 'PHALANX'      // Defensive wall
  | 'ARCHER_LINE'  // Back row attackers
  | 'FLANKING'     // Side pressure
  | 'SIEGE'        // Enemy zone control
  | 'SKIRMISH';    // Default formation

export interface FormationBonus {
  type: FormationType;
  attackMod: number;
  defenseMod: number;
  speedMod: number;
}

// ============================================================================
// WEATHER & TERRAIN
// ============================================================================

export type WeatherType =
  | 'CLEAR'
  | 'RAIN'
  | 'STORM'
  | 'FOG'
  | 'SNOW'
  | 'BLIZZARD'
  | 'SANDSTORM'
  | 'HEATWAVE'
  | 'ARCANE_STORM'
  | 'BLOOD_MOON';

export interface WeatherEffect {
  type: WeatherType;
  attackMod: number;
  defenseMod: number;
  speedMod: number;
  turnsRemaining: number;
  icon: string;
  color: string;
}

export const WEATHER_TYPES: Record<WeatherType, Omit<WeatherEffect, 'turnsRemaining'>> = {
  CLEAR: {
    type: 'CLEAR',
    attackMod: 1.0,
    defenseMod: 1.0,
    speedMod: 1.0,
    icon: '☀️',
    color: '#FFD700',
  },
  RAIN: {
    type: 'RAIN',
    attackMod: 0.9,
    defenseMod: 1.0,
    speedMod: 0.95,
    icon: '🌧️',
    color: '#4682B4',
  },
  STORM: {
    type: 'STORM',
    attackMod: 0.8,
    defenseMod: 1.0,
    speedMod: 0.9,
    icon: '⛈️',
    color: '#483D8B',
  },
  FOG: {
    type: 'FOG',
    attackMod: 0.85,
    defenseMod: 1.1,
    speedMod: 1.0,
    icon: '🌫️',
    color: '#B0C4DE',
  },
  SNOW: {
    type: 'SNOW',
    attackMod: 0.9,
    defenseMod: 1.0,
    speedMod: 0.85,
    icon: '❄️',
    color: '#E0FFFF',
  },
  BLIZZARD: {
    type: 'BLIZZARD',
    attackMod: 0.7,
    defenseMod: 1.2,
    speedMod: 0.7,
    icon: '🌨️',
    color: '#B0E0E6',
  },
  SANDSTORM: {
    type: 'SANDSTORM',
    attackMod: 0.75,
    defenseMod: 0.9,
    speedMod: 0.8,
    icon: '🏜️',
    color: '#D2B48C',
  },
  HEATWAVE: {
    type: 'HEATWAVE',
    attackMod: 1.1,
    defenseMod: 0.9,
    speedMod: 0.85,
    icon: '🔥',
    color: '#FF4500',
  },
  ARCANE_STORM: {
    type: 'ARCANE_STORM',
    attackMod: 1.2,
    defenseMod: 0.8,
    speedMod: 1.1,
    icon: '✨',
    color: '#9932CC',
  },
  BLOOD_MOON: {
    type: 'BLOOD_MOON',
    attackMod: 1.3,
    defenseMod: 0.7,
    speedMod: 1.0,
    icon: '🌕',
    color: '#8B0000',
  },
};

export type TerrainType =
  | 'HIGH_GROUND'
  | 'FOREST'
  | 'WATER'
  | 'RUINS'
  | 'SWAMP'
  | 'LAVA'
  | 'ICE'
  | 'DESERT'
  | 'HOLY_GROUND'
  | 'CURSED_GROUND';

export interface TerrainEffect {
  position: Position;
  type: TerrainType;
  attackMod: number;
  defenseMod: number;
  speedMod: number;
  icon: string;
  color: string;
}

export const TERRAIN_TYPES: Record<TerrainType, Omit<TerrainEffect, 'position'>> = {
  HIGH_GROUND: {
    type: 'HIGH_GROUND',
    attackMod: 1.2,
    defenseMod: 1.1,
    speedMod: 1.0,
    icon: '⛰️',
    color: '#808080',
  },
  FOREST: {
    type: 'FOREST',
    attackMod: 0.9,
    defenseMod: 1.2,
    speedMod: 0.9,
    icon: '🌲',
    color: '#228B22',
  },
  WATER: {
    type: 'WATER',
    attackMod: 0.8,
    defenseMod: 0.8,
    speedMod: 0.7,
    icon: '💧',
    color: '#1E90FF',
  },
  RUINS: {
    type: 'RUINS',
    attackMod: 1.0,
    defenseMod: 1.15,
    speedMod: 0.95,
    icon: '🏛️',
    color: '#A9A9A9',
  },
  SWAMP: {
    type: 'SWAMP',
    attackMod: 0.85,
    defenseMod: 0.9,
    speedMod: 0.6,
    icon: '🐊',
    color: '#556B2F',
  },
  LAVA: {
    type: 'LAVA',
    attackMod: 1.3,
    defenseMod: 0.7,
    speedMod: 0.8,
    icon: '🌋',
    color: '#FF4500',
  },
  ICE: {
    type: 'ICE',
    attackMod: 0.9,
    defenseMod: 1.0,
    speedMod: 0.7,
    icon: '❄️',
    color: '#87CEEB',
  },
  DESERT: {
    type: 'DESERT',
    attackMod: 1.0,
    defenseMod: 0.85,
    speedMod: 0.85,
    icon: '🏜️',
    color: '#DEB887',
  },
  HOLY_GROUND: {
    type: 'HOLY_GROUND',
    attackMod: 1.1,
    defenseMod: 1.2,
    speedMod: 1.05,
    icon: '✨',
    color: '#FFD700',
  },
  CURSED_GROUND: {
    type: 'CURSED_GROUND',
    attackMod: 1.4,
    defenseMod: 0.6,
    speedMod: 1.1,
    icon: '☠️',
    color: '#8B0000',
  },
};

// ============================================================================
// PLAYER TYPES
// ============================================================================

export type PlayerType = 'human' | 'ai';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  castleHp: number;
  maxCastleHp: number;
  mana: number;
  maxMana: number;
  hand: Card[];
  deck: Card[];
  strategy: PlayerStrategy; // ⭐ Strategy pattern - NEVER check type directly
  lpBonus: number; // LP token multiplier (0.01 LP = +5%)
  loyaltyBonus?: number; // Loyalty system bonus (consecutive days holding LP)
  aiPersonality?: AIPersonality;
}

// ============================================================================
// STRATEGY PATTERN - THE GOLDEN RULE
// ============================================================================

/**
 * Player Strategy Interface
 *
 * CRITICAL: This is how we handle Human vs AI vs future multiplayer.
 * NEVER check player.type anywhere in the codebase.
 * ALWAYS use player.strategy methods.
 */
export interface PlayerStrategy {
  getAvailableCards(player: Player, state: BattleState): Card[];
  selectAction(player: Player, state: BattleState): Promise<BattleAction>;
  onTurnStart(player: Player, state: BattleState): void;
  onTurnEnd(player: Player, state: BattleState): void;
}

// ============================================================================
// AI PERSONALITY SYSTEM
// ============================================================================

export interface AIPersonality {
  name: string;
  title: string;
  aggression: number;      // 0-1: Attack/HP distribution
  creativity: number;      // 0-1: Unusual play likelihood
  riskTolerance: number;   // 0-1: High-risk action preference
  patience: number;        // 0-1: Early vs late game focus
  adaptability: number;    // 0-1: Board state response speed
  flavorText: string;
}

export type AIMode =
  | 'AGGRESSIVE'    // High pressure offense
  | 'DEFENSIVE'     // Protect castle at all costs
  | 'ADAPTIVE'      // Balanced response to threats
  | 'DESPERATE'     // Behind - risky plays
  | 'EXPERIMENTAL'; // Ahead - creative plays

export interface AIMemory {
  previousActions: BattleAction[];
  stuckCounter: number;
  lastBoardHash: string;
  confidenceLevel: number;
  currentMode: AIMode;
}

// ============================================================================
// BATTLE STATE
// ============================================================================

export type BattlePhase = 'deployment' | 'battle' | 'victory';

export interface BattleState {
  id: string;
  currentTurn: number;
  phase: BattlePhase;
  activePlayerId: string;
  players: Record<string, Player>;
  battlefield: Battlefield;
  gridConfig: GridConfig; // ⭐ Dynamic grid dimensions
  mapTheme: MapTheme; // ⭐ Visual theme for battlefield
  blockedTiles: Position[]; // ⭐ Impassable obstacles
  weather: WeatherEffect | null;
  terrainEffects: TerrainEffect[];
  controlledZones: Record<string, string>; // position hash -> player id
  winner: string | null;
  battleLog: BattleLogEntry[];
  aiMemories: Record<string, AIMemory>; // AI player memories
}

export interface BattleLogEntry {
  turn: number;
  playerId: string;
  action: string;
  result: string;
  timestamp: number;
}

// ============================================================================
// BATTLE ACTIONS
// ============================================================================

export type BattleAction =
  | DeployCardAction
  | AttackCardAction
  | AttackCastleAction
  | MoveCardAction
  | UseAbilityAction
  | EndTurnAction;

export interface DeployCardAction {
  type: 'DEPLOY_CARD';
  playerId: string;
  cardId: string;
  position: Position;
  generatedCard?: Card; // ⭐ AI-generated cards travel with action
  allocationBonus?: number; // ⭐ Per-game LP allocation bonus for this card
}

export interface AttackCardAction {
  type: 'ATTACK_CARD';
  playerId: string;
  attackerCardId: string;
  targetCardId: string;
  randomSeed?: number; // ⭐ For deterministic crit calculation in multiplayer
}

export interface AttackCastleAction {
  type: 'ATTACK_CASTLE';
  playerId: string;
  attackerCardId: string;
  targetPlayerId: string;
  randomSeed?: number; // ⭐ For deterministic crit calculation in multiplayer
}

export interface MoveCardAction {
  type: 'MOVE_CARD';
  playerId: string;
  cardId: string;
  fromPosition: Position;
  toPosition: Position;
}

export interface UseAbilityAction {
  type: 'USE_ABILITY';
  playerId: string;
  cardId: string;
  abilityId: string;
  targetCardId?: string;
  targetPosition?: Position;
}

export interface EndTurnAction {
  type: 'END_TURN';
  playerId: string;
}

// ============================================================================
// SCORED ACTIONS (AI DECISION MAKING)
// ============================================================================

export interface ScoredAction {
  action: BattleAction;
  score: number;
  reasoning: string;
  strategicMode: AIMode;
}

// ============================================================================
// VICTORY CONDITIONS
// ============================================================================

export type VictoryCondition =
  | 'CASTLE_DESTROYED'
  | 'RESOURCE_EXHAUSTION'
  | 'TURN_LIMIT'
  | 'SURRENDER';

export interface VictoryResult {
  winnerId: string;
  condition: VictoryCondition;
  turn: number;
}
