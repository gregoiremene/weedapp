import { gameClock } from '../clock.ts';
import { BALANCE } from '../data/balance.ts';
import { EQUIPMENT, EQUIPMENT_IDS, type EquipmentKind } from '../data/equipment.ts';
import { HOUSINGS, type HousingId } from '../data/housings.ts';
import type { JobId } from '../data/jobs.ts';
import { VARIETY_IDS, type VarietyId } from '../data/varieties.ts';
import { GameError } from '../errors.ts';
import { chance, randomBetween } from '../rng.ts';
import { addLog, cloneState, growingPlants, type GameState } from '../state.ts';

/** Identité publique d'un joueur, fournie par le serveur. */
export interface PlayerRef {
  id: string;
  pseudo: string;
}

export interface TheftResult {
  attacker: GameState;
  victim: GameState;
  success: boolean;
  money: number;
  grams: Partial<Record<VarietyId, number>>;
}

/** Probabilité de réussite : chaque garde du corps pèse autant qu'un voleur. */
export function theftSuccessChance(thieves: number, guards: number): number {
  return thieves / (thieves + guards);
}

/** Vérifie qu'une attaque est permise (sans la coûter). */
export function assertCanAttack(attacker: GameState, victim: GameState, now: number): void {
  const t = BALANCE.theft;
  const victimLevel = HOUSINGS[victim.housing].level;
  if (victimLevel < t.minVictimHousingLevel) throw new GameError('TARGET_PROTECTED');
  if (victimLevel < HOUSINGS[attacker.housing].level) throw new GameError('TARGET_TOO_SMALL');
  const today = gameClock(now).dayKey;
  if (attacker.thefts.dayKey === today && attacker.thefts.count >= t.attacksPerDay) throw new GameError('DAILY_THEFT_LIMIT');
}

/**
 * Envoie des voleurs chez un autre joueur. Les deux états doivent avoir été avancés à `now`.
 * En cas de réussite, une part (5 à 10 %) de la bourse de la victime (argent et beuh) change de mains.
 * Le hasard utilise le générateur de l'attaquant.
 */
export function attemptTheft(
  attackerState: GameState,
  victimState: GameState,
  refs: { attacker: PlayerRef; victim: PlayerRef },
  thieves: number,
  now: number,
): TheftResult {
  if (refs.attacker.id === refs.victim.id) throw new GameError('CANNOT_TARGET_SELF');
  if (!Number.isInteger(thieves) || thieves <= 0) throw new GameError('INVALID_QUANTITY');
  assertCanAttack(attackerState, victimState, now);
  const cost = thieves * BALANCE.theft.costPerThief;
  if (attackerState.money < cost) throw new GameError('INSUFFICIENT_FUNDS', { cost, money: attackerState.money });

  const attacker = cloneState(attackerState);
  const victim = cloneState(victimState);
  attacker.money -= cost;
  const today = gameClock(now).dayKey;
  attacker.thefts = { dayKey: today, count: attacker.thefts.dayKey === today ? attacker.thefts.count + 1 : 1 };

  const success = chance(attacker, theftSuccessChance(thieves, victim.guards));
  let money = 0;
  const grams: Partial<Record<VarietyId, number>> = {};
  if (success) {
    const fraction = randomBetween(attacker, BALANCE.theft.minStealFraction, BALANCE.theft.maxStealFraction);
    money = Math.floor(Math.max(0, victim.money) * fraction);
    victim.money -= money;
    attacker.money += money;
    for (const variety of VARIETY_IDS) {
      const taken = Math.floor(victim.stock[variety] * fraction);
      if (taken <= 0) continue;
      victim.stock[variety] -= taken;
      attacker.stock[variety] += taken;
      grams[variety] = taken;
    }
  }
  const totalGrams = Object.values(grams).reduce((a, b) => a + (b ?? 0), 0);
  addLog(attacker, now, success ? 'theft_success' : 'theft_failed', {
    target: refs.victim.pseudo, thieves, cost, money, grams: totalGrams,
  });
  addLog(victim, now, success ? 'robbed' : 'theft_repelled', {
    attacker: refs.attacker.pseudo, money, grams: totalGrams,
  });
  return { attacker, victim, success, money, grams };
}

export interface DetectiveReport {
  pseudo: string;
  housing: HousingId;
  job: JobId;
  guards: number;
  growingPlants: number;
  equipmentCapacity: Record<EquipmentKind, number>;
}

/** Le détective privé dresse le dossier d'un joueur (sans dévoiler son argent). */
export function investigate(state: GameState, target: GameState, targetRef: PlayerRef, now: number): { state: GameState; report: DetectiveReport } {
  const cost = BALANCE.theft.detectiveCost;
  if (state.money < cost) throw new GameError('INSUFFICIENT_FUNDS', { cost, money: state.money });
  const next = cloneState(state);
  next.money -= cost;
  const equipmentCapacity: Record<EquipmentKind, number> = { lamp: 0, heater: 0, fan: 0 };
  for (const id of EQUIPMENT_IDS) equipmentCapacity[EQUIPMENT[id].kind] += EQUIPMENT[id].capacity * target.inventory.equipment[id];
  addLog(next, now, 'detective', { target: targetRef.pseudo, cost });
  return {
    state: next,
    report: {
      pseudo: targetRef.pseudo,
      housing: target.housing,
      job: target.job,
      guards: target.guards,
      growingPlants: growingPlants(target).length,
      equipmentCapacity,
    },
  };
}
