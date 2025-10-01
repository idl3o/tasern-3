/**
 * Core type definitions for Tasern Siegefront
 * The foundational reality of our game universe
 */

// ============================================================================
// CARD TYPES
// ============================================================================

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

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
  abilities: CardAbility[];
  imageUrl?: string;
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
  row: number; // 0-2 (front to back)
  col: number; // 0-2 (left to right)
}

export type Battlefield = (BattleCard | null)[][];

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

export type WeatherType = 'CLEAR' | 'RAIN' | 'STORM' | 'FOG' | 'SNOW';

export interface WeatherEffect {
  type: WeatherType;
  attackMod: number;
  defenseMod: number;
  speedMod: number;
  turnsRemaining: number;
}

export interface TerrainEffect {
  position: Position;
  type: 'HIGH_GROUND' | 'FOREST' | 'WATER' | 'RUINS';
  attackMod: number;
  defenseMod: number;
  speedMod: number;
}

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
}

export interface AttackCardAction {
  type: 'ATTACK_CARD';
  playerId: string;
  attackerCardId: string;
  targetCardId: string;
}

export interface AttackCastleAction {
  type: 'ATTACK_CASTLE';
  playerId: string;
  attackerCardId: string;
  targetPlayerId: string;
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
