import {Enemy, Loot} from '../../reducers/QuestTypes'

export interface CombatAttack {
  surge: boolean;
  damage: number;
}

export interface MidCombatPhase {
  enemies: Enemy[];
  mostRecentAttack?: CombatAttack;
  mostRecentRolls?: number[];
  numAliveAdventurers: number;
  roundCount: number;
  tier: number;
}
export interface EndCombatPhase {
  levelUp?: boolean;
  loot?: Loot[];
}

export interface CombatDifficultySettings {
  surgePeriod: number,
  damageMultiplier: number,
}

export interface CombatState extends CombatDifficultySettings, MidCombatPhase, EndCombatPhase {
  custom: boolean;
  roleplay?: any; // Actually ParserNode, but set to the any type to minimize dependencies.
  roundTimeMillis: number;
}

export type CombatPhase = 'DRAW_ENEMIES' | 'PREPARE' | 'TIMER' | 'SURGE' | 'RESOLVE_ABILITIES' | 'RESOLVE_DAMAGE' | 'VICTORY' | 'DEFEAT' | 'NO_TIMER';
