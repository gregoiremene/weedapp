import { gameClock } from '../clock.ts';
import { BALANCE } from '../data/balance.ts';
import { EQUIPMENT, EQUIPMENT_IDS } from '../data/equipment.ts';
import { HOUSINGS } from '../data/housings.ts';
import { JOBS } from '../data/jobs.ts';
import { addLog, growingPlants, type GameState } from '../state.ts';

export interface WeeklyBill {
  housing: number;
  electricity: number;
  water: number;
  guards: number;
  wealthTax: number;
  salary: number;
  /** Montant net débité (négatif = crédit). */
  total: number;
  interest: number;
}

export type EconomyEvent = { type: 'weekly_bill'; bill: WeeklyBill };

/**
 * Électricité de l'heure : le matériel tourne dès qu'il y a des plants en pousse.
 * Les lampes ne sont allumées que la durée d'éclairage la plus longue des deux salles.
 */
function meterElectricity(state: GameState): void {
  if (growingPlants(state).length === 0) return;
  const lampHours = Math.max(state.lightHours.veg, state.lightHours.flo) / 24;
  let watts = 0;
  for (const id of EQUIPMENT_IDS) {
    const item = EQUIPMENT[id];
    const count = state.inventory.equipment[id];
    watts += item.watts * count * (item.kind === 'lamp' ? lampHours : 1);
  }
  state.meters.kwh += (watts / 1000) * BALANCE.gameSpeed;
}

/** Facture de la semaine en cours, telle qu'elle serait prélevée maintenant. */
export function estimateWeeklyBill(state: GameState): WeeklyBill {
  const e = BALANCE.economy;
  const housing = HOUSINGS[state.housing].weeklyTax;
  const electricity = Math.round(state.meters.kwh * e.electricityPerKwh);
  const water = Math.round(state.meters.waterCl * e.waterPerCl);
  const guards = state.guards * BALANCE.security.guardWeeklyCost;
  const wealthTax = Math.round(Math.max(0, state.money - e.wealthTaxThreshold) * e.wealthTaxRate);
  const salary = JOBS[state.job].weeklySalary;
  const interest = Math.floor(state.bankBalance * BALANCE.bank.weeklyInterestRate);
  return {
    housing,
    electricity,
    water,
    guards,
    wealthTax,
    salary,
    total: housing + electricity + water + guards + wealthTax - salary,
    interest,
  };
}

export function isWeeklyTick(at: number): boolean {
  const clock = gameClock(at);
  return clock.weekday === BALANCE.economy.weeklyWeekday && clock.hour === BALANCE.economy.weeklyHour;
}

/** Une actualisation horaire de l'économie (compteurs, et le lundi : impôts, salaire, intérêts). */
export function tickEconomy(state: GameState, at: number): EconomyEvent[] {
  meterElectricity(state);
  if (!isWeeklyTick(at)) return [];
  const bill = estimateWeeklyBill(state);
  // La bourse peut passer en négatif : c'est au joueur de prévoir.
  state.money -= bill.total;
  state.bankBalance += bill.interest;
  state.meters = { waterCl: 0, kwh: 0 };
  addLog(state, at, 'weekly_bill', { total: bill.total, wealthTax: bill.wealthTax, salary: bill.salary, interest: bill.interest });
  return [{ type: 'weekly_bill', bill }];
}
