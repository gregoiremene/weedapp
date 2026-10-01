import { cloneState, HOUR_MS, type GameState } from './state';
import { tickGrowth, type GrowthEvent } from './systems/growth';

export type GameEvent = GrowthEvent & { at: number };

export interface AdvanceResult {
  state: GameState;
  events: GameEvent[];
  ticks: number;
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
    for (const event of tickGrowth(next, at)) events.push({ ...event, at });
    next.lastTickAt = at;
    ticks++;
  }
  return { state: next, events, ticks };
}
