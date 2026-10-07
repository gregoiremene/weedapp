import { CONSUMABLES, EQUIPMENT, POTS, type ConsumableId, type EquipmentId, type PotSize } from '../data/equipment.ts';
import { SEEDS_PER_PACK, VARIETIES, type VarietyId } from '../data/varieties.ts';
import { GameError } from '../errors.ts';
import { addLog, cloneState, type GameState } from '../state.ts';

export type ShopItem =
  | { kind: 'seeds'; variety: VarietyId }
  | { kind: 'equipment'; id: EquipmentId }
  | { kind: 'pot'; size: PotSize }
  | { kind: 'consumable'; id: ConsumableId };

export function shopItemPrice(item: ShopItem): number {
  switch (item.kind) {
    case 'seeds':
      return requireDefined(VARIETIES[item.variety]).seedPackPrice;
    case 'equipment':
      return requireDefined(EQUIPMENT[item.id]).price;
    case 'pot':
      return requireDefined(POTS[item.size]).price;
    case 'consumable':
      return requireDefined(CONSUMABLES[item.id]).price;
  }
}

function requireDefined<T>(value: T | undefined): T {
  if (value === undefined) throw new GameError('UNKNOWN_ITEM');
  return value;
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new GameError('INVALID_QUANTITY');
}

/** Achète `quantity` unités (paquets de graines, lampes, sacs de terreau…) en boutique. */
export function buy(state: GameState, item: ShopItem, quantity: number, now: number): GameState {
  assertQuantity(quantity);
  const cost = shopItemPrice(item) * quantity;
  if (state.money < cost) throw new GameError('INSUFFICIENT_FUNDS', { cost, money: state.money });

  const next = cloneState(state);
  const inv = next.inventory;
  next.money -= cost;
  switch (item.kind) {
    case 'seeds':
      inv.seeds[item.variety] += SEEDS_PER_PACK * quantity;
      break;
    case 'equipment':
      inv.equipment[item.id] += quantity;
      break;
    case 'pot':
      inv.pots[item.size] += quantity;
      break;
    case 'consumable': {
      const amount = CONSUMABLES[item.id].amount * quantity;
      if (item.id === 'soil') inv.soilL += amount;
      else if (item.id === 'fertVeg') inv.fertVegMl += amount;
      else if (item.id === 'fertFlo') inv.fertFloMl += amount;
      else if (item.id === 'insecticide') inv.insecticideMl += amount;
      else inv.germKits += amount;
      break;
    }
  }
  addLog(next, now, 'purchase', { item: describeItem(item), quantity, cost });
  return next;
}

function describeItem(item: ShopItem): string {
  switch (item.kind) {
    case 'seeds':
      return `seeds:${item.variety}`;
    case 'equipment':
      return `equipment:${item.id}`;
    case 'pot':
      return `pot:${item.size}`;
    case 'consumable':
      return `consumable:${item.id}`;
  }
}
