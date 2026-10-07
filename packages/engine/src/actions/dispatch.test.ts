import { describe, expect, it } from 'vitest';
import { newGame, T0 } from '../test-utils.ts';
import { applyAction, parseAction } from './dispatch.ts';

describe('parseAction', () => {
  it('accepte une action bien formée', () => {
    const action = parseAction({ type: 'buy', item: { kind: 'pot', size: 40 }, quantity: 3 });
    expect(applyAction(newGame(), action, T0).inventory.pots[40]).toBe(3);
    expect(parseAction({ type: 'fillToMax', selector: { room: 'veg' } })).toEqual({ type: 'fillToMax', selector: { room: 'veg' } });
    expect(parseAction({ type: 'treat', selector: [1, 2] })).toEqual({ type: 'treat', selector: [1, 2] });
  });

  it('rejette tout ce qui est inconnu ou mal typé', () => {
    const bad: unknown[] = [
      null,
      'buy',
      { type: 'hack' },
      { type: 'buy', item: { kind: 'pot', size: 50 }, quantity: 1 },
      { type: 'sow', variety: 'inconnue', count: 1 },
      { type: 'deposit', amount: '100' },
      { type: 'deposit', amount: 1.5 },
      { type: 'water', selector: 'all', waterCl: Number.NaN, fertMl: 1 },
      { type: 'setLight', room: 'cave', hours: 12 },
      { type: 'discardPlants', plantIds: [1, 'x'] },
    ];
    for (const input of bad) expect(() => parseAction(input), JSON.stringify(input)).toThrow('INVALID_ACTION');
  });
});
