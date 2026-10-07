import { describe, expect, it } from 'vitest';
import { advance } from '../advance.ts';
import { HOUR_MS } from '../state.ts';
import { addPlant, equippedGame, newGame, T0 } from '../test-utils.ts';
import { estimateWeeklyBill, isWeeklyTick } from './economy.ts';

// T0 = lundi 10h (Paris). Les impôts tombent le lundi suivant à 4h : 6 jours et 18 h plus tard.
const NEXT_TAX = T0 + (6 * 24 + 18) * HOUR_MS;

describe('impôts hebdomadaires', () => {
  it('tombent le lundi à 4h, heure du jeu', () => {
    expect(isWeeklyTick(NEXT_TAX)).toBe(true);
    expect(isWeeklyTick(NEXT_TAX - HOUR_MS)).toBe(false);
  });

  it("prélèvent habitation, gardes et ISF, versent salaire et intérêts", () => {
    const state = newGame();
    state.housing = 'maison';
    state.money = 25_000;
    state.guards = 2;
    state.job = 'bus_driver';
    state.bankBalance = 100_000;
    const before = advance(state, NEXT_TAX - HOUR_MS);
    expect(before.events.some((e) => e.type === 'weekly_bill')).toBe(false);

    const after = advance(state, NEXT_TAX);
    const event = after.events.find((e) => e.type === 'weekly_bill') as { bill: ReturnType<typeof estimateWeeklyBill> };
    // ISF : 6 % de la part au-dessus de 15 000 Wl.
    expect(event.bill).toMatchObject({ housing: 6_500, guards: 400, wealthTax: 600, salary: 750, interest: 1_500 });
    expect(after.state.money).toBe(25_000 - (6_500 + 400 + 600 - 750));
    expect(after.state.bankBalance).toBe(101_500);
  });

  it("facturent l'eau et l'électricité consommées puis remettent les compteurs à zéro", () => {
    const state = equippedGame(3);
    addPlant(state, { waterCl: 5, fertMl: 5, frozen: true });
    state.meters.waterCl = 1_000;
    const ticked = advance(state, T0 + 10 * HOUR_MS).state;
    // 1 lampe 1000 W × 18/24 + radiateur 2000 W + ventilateur 200 W = 2,95 kW.
    expect(ticked.meters.kwh).toBeCloseTo(29.5);
    const bill = estimateWeeklyBill(ticked);
    expect(bill.water).toBe(90);
    expect(bill.electricity).toBe(24);
    expect(advance(ticked, NEXT_TAX).state.meters).toEqual({ waterCl: 0, kwh: expect.any(Number) });
    expect(advance(ticked, NEXT_TAX).state.meters.kwh).toBe(0);
  });

  it("pas d'électricité quand aucune plante ne pousse", () => {
    const state = equippedGame(3);
    expect(advance(state, T0 + 10 * HOUR_MS).state.meters.kwh).toBe(0);
  });

  it('la bourse peut passer en négatif', () => {
    const state = newGame();
    state.housing = 'villa';
    state.money = 0;
    expect(advance(state, NEXT_TAX).state.money).toBe(-15_000);
  });
});
