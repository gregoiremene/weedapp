import { BALANCE } from '../data/balance.ts';
import { VARIETIES, VARIETY_IDS, type VarietyId } from '../data/varieties.ts';
import { HOUR_MS } from '../state.ts';
import { random } from '../rng.ts';

/** Lundi 5 janvier 1970 00:00 UTC : origine des périodes de prix (alignées sur un lundi). */
const MARKET_EPOCH = 4 * 24 * HOUR_MS;

export function marketPeriod(at: number): number {
  return Math.floor((at - MARKET_EPOCH) / (BALANCE.market.repricePeriodHours * HOUR_MS));
}

/** Début de la période de prix suivante (pour afficher « prochaine réévaluation »). */
export function nextRepriceAt(at: number): number {
  return MARKET_EPOCH + (marketPeriod(at) + 1) * BALANCE.market.repricePeriodHours * HOUR_MS;
}

/**
 * Prix de revente (Wl/g) d'une variété à un instant donné. Déterministe et identique pour
 * tous les joueurs : il ne dépend que de la période et de la graine du marché.
 */
export function marketPrice(variety: VarietyId, at: number): number {
  const index = VARIETY_IDS.indexOf(variety);
  const holder = { rng: (BALANCE.market.seed ^ Math.imul(marketPeriod(at) + 1, 0x9e3779b1) ^ Math.imul(index + 1, 0x85ebca6b)) | 0 };
  // Quelques tirages pour bien mélanger la graine.
  random(holder);
  random(holder);
  const { minFactor, maxFactor } = BALANCE.market;
  const factor = minFactor + random(holder) * (maxFactor - minFactor);
  return Math.max(1, Math.round(VARIETIES[variety].baseSalePrice * factor));
}

export function marketPrices(at: number): Record<VarietyId, number> {
  return Object.fromEntries(VARIETY_IDS.map((id) => [id, marketPrice(id, at)])) as Record<VarietyId, number>;
}
