/**
 * Ability System Type Definitions
 *
 * Passive abilities: Always active
 * Triggered abilities: Activate on specific events
 */

export type PassiveAbilityType =
  | 'STAT_BOOST'      // Permanent stat increase
  | 'AURA'            // Buff nearby allies
  | 'REGENERATION'    // Heal HP each turn
  | 'THORNS'          // Reflect damage
  | 'SHIELD';         // Damage reduction

export type TriggeredAbilityType =
  | 'ON_DEPLOY'       // When card enters battlefield
  | 'ON_ATTACK'       // When card attacks
  | 'ON_DAMAGED'      // When card takes damage
  | 'ON_DEATH'        // When card dies
  | 'ON_TURN_START';  // At start of owner's turn

export type AbilityEffectType =
  | 'DAMAGE'          // Deal damage
  | 'HEAL'            // Restore HP
  | 'BUFF'            // Increase stats
  | 'DEBUFF'          // Decrease stats
  | 'SUMMON';         // Create new card

export interface PassiveAbility {
  type: PassiveAbilityType;
  target: 'self' | 'allies' | 'enemies' | 'adjacent_allies';
  stat?: 'attack' | 'defense' | 'speed' | 'hp';
  value: number;
  description: string;
}

export interface TriggeredAbility {
  type: TriggeredAbilityType;
  effect: AbilityEffectType;
  target: 'self' | 'random_enemy' | 'random_ally' | 'all_enemies' | 'all_allies' | 'adjacent_enemies';
  stat?: 'attack' | 'defense' | 'speed' | 'hp';
  value: number;
  description: string;
}

export type Ability = PassiveAbility | TriggeredAbility;

/**
 * Check if ability is passive
 */
export function isPassiveAbility(ability: Ability): ability is PassiveAbility {
  return (ability as PassiveAbility).type in {
    STAT_BOOST: true,
    AURA: true,
    REGENERATION: true,
    THORNS: true,
    SHIELD: true,
  };
}

/**
 * Check if ability is triggered
 */
export function isTriggeredAbility(ability: Ability): ability is TriggeredAbility {
  return (ability as TriggeredAbility).type in {
    ON_DEPLOY: true,
    ON_ATTACK: true,
    ON_DAMAGED: true,
    ON_DEATH: true,
    ON_TURN_START: true,
  };
}
