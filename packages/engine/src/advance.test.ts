import { describe, expect, it } from 'vitest';
import { advance } from './advance';
import { random } from './rng';
import { HOUR_MS } from './state';
import { addPlant, equippedGame, newGame, T0 } from './test-utils';

describe('rng', () => {
  it('est déterministe pour une même graine', () => {
    const a = { rng: 7 };
    const b = { rng: 7 };
    const seqA = Array.from({ length: 5 }, () => random(a));
    const seqB = Array.from({ length: 5 }, () => random(b));
    expect(seqA).toEqual(seqB);
    expect(seqA.every((n) => n >= 0 && n < 1)).toBe(true);
  });
});

describe('advance', () => {
  it("ne fait rien avant l'heure pleine suivante", () => {
    const state = newGame();
    const result = advance(state, T0 + 59 * 60_000);
    expect(result.ticks).toBe(0);
    expect(result.state.lastTickAt).toBe(T0);
  });

  it('rejoue une actualisation par heure pleine franchie', () => {
    const state = newGame();
    const result = advance(state, T0 + 5 * HOUR_MS + 30 * 60_000);
    expect(result.ticks).toBe(5);
    expect(result.state.lastTickAt).toBe(T0 + 5 * HOUR_MS);
  });

  it("aligne l'état initial sur l'heure pleine", () => {
    const state = equippedGame();
    expect(state.lastTickAt % HOUR_MS).toBe(0);
  });

  it("ne modifie pas l'état reçu et donne le même résultat à chaque fois", () => {
    const state = equippedGame();
    addPlant(state, { waterCl: 5, fertMl: 5 });
    const snapshot = JSON.stringify(state);
    const a = advance(state, T0 + 30 * HOUR_MS);
    const b = advance(state, T0 + 30 * HOUR_MS);
    expect(JSON.stringify(state)).toBe(snapshot);
    expect(a).toEqual(b);
  });

  it('découper le temps en plusieurs appels donne le même résultat', () => {
    const state = equippedGame();
    addPlant(state, { waterCl: 5, fertMl: 5, protectedVeg: false });
    const once = advance(state, T0 + 10 * HOUR_MS).state;
    const split = advance(advance(state, T0 + 4 * HOUR_MS).state, T0 + 10 * HOUR_MS).state;
    expect(split).toEqual(once);
  });
});
