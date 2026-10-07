import { cloneState, HOUR_MS, type GameState } from './state.ts';
import { tickEconomy, type EconomyEvent } from './systems/economy.ts';
import { tickGrowth, type GrowthEvent } from './systems/growth.ts';
import { tickSalesAndPolice, type SalesEvent } from './systems/sales.ts';

export type GameEvent = (GrowthEvent | SalesEvent | EconomyEvent) & { at: number };

export interface AdvanceResult {
  state: GameState;
  events: GameEvent[];
  ticks: number;
}

/** Une actualisation horaire complète, à l'heure pleine `at`. Modifie `state` en place. */
export function tick(state: GameState, at: number): GameEvent[] {
  const events = [...tickGrowth(state, at), ...tickSalesAndPolice(state, at), ...tickEconomy(state, at)];
  state.lastTickAt = at;
  return events.map((event) => ({ ...event, at }));
}

/**
 * Rejoue toutes les actualisations horaires (à chaque heure pleine) survenues entre
 * `state.lastTickAt` et `now`. Déterministe : même état + même `now` = même résultat.
 * À appeler avant toute action sur le joueur (évaluation paresseuse côté serveur).
 */
export function advance(state: GameState, now: number): AdvanceResult {
  const next = cloneState(state);
  const events: GameEvent[] = [];
  let ticks = 0;
  for (let at = next.lastTickAt + HOUR_MS; at <= now; at += HOUR_MS) {
    events.push(...tick(next, at));
    ticks++;
  }
  return { state: next, events, ticks };
}
