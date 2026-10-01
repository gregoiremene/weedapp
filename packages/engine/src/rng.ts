/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 * Son état vit dans le GameState : rejouer les mêmes actions depuis le même état
 * donne exactement le même résultat (indispensable pour un serveur autoritaire).
 */

export interface RngHolder {
  rng: number;
}

/** Nombre dans [0, 1[ ; fait avancer `holder.rng`. */
export function random(holder: RngHolder): number {
  holder.rng = (holder.rng + 0x6d2b79f5) | 0;
  let t = holder.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomBetween(holder: RngHolder, min: number, max: number): number {
  return min + random(holder) * (max - min);
}

export function randomInt(holder: RngHolder, min: number, max: number): number {
  return Math.floor(randomBetween(holder, min, max + 1));
}

export function chance(holder: RngHolder, probability: number): boolean {
  return random(holder) < probability;
}
