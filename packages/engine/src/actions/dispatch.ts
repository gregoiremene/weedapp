import { CONSUMABLES, EQUIPMENT_IDS, POT_SIZES, type ConsumableId, type EquipmentId, type PotSize } from '../data/equipment.ts';
import { JOB_IDS, type JobId } from '../data/jobs.ts';
import { PLACE_IDS, type PlaceId } from '../data/places.ts';
import { VARIETY_IDS, type VarietyId } from '../data/varieties.ts';
import { GameError } from '../errors.ts';
import type { GameState, Room } from '../state.ts';
import {
  clearDead,
  discardGerms,
  discardMales,
  discardPlants,
  fillToMax,
  harvest,
  plantFastestGerms,
  plantGerms,
  repot,
  setFrozen,
  setLightHours,
  sowSeeds,
  treatPlants,
  waterPlants,
  type PlantSelector,
} from './culture.ts';
import {
  bribePolice,
  buyNextHousing,
  chooseJob,
  deposit,
  fireGuards,
  hireGuards,
  startSale,
  stopSale,
  withdraw,
} from './economy.ts';
import { buy, type ShopItem } from './shop.ts';

/** Toutes les actions qu'un joueur peut faire sur sa propre partie (format JSON envoyé au serveur). */
export type GameAction =
  | { type: 'buy'; item: ShopItem; quantity: number }
  | { type: 'sow'; variety: VarietyId; count: number }
  | { type: 'discardGerms'; germIds: number[] }
  | { type: 'plantGerms'; germIds: number[]; potSize: PotSize }
  | { type: 'plantFastest'; count: number; potSize: PotSize }
  | { type: 'water'; selector: PlantSelector; waterCl: number; fertMl: number }
  | { type: 'fillToMax'; selector: PlantSelector }
  | { type: 'treat'; selector: PlantSelector }
  | { type: 'setFrozen'; selector: PlantSelector; frozen: boolean }
  | { type: 'repot'; plantIds: number[] }
  | { type: 'setLight'; room: Room; hours: number }
  | { type: 'discardPlants'; plantIds: number[] }
  | { type: 'discardMales' }
  | { type: 'clearDead' }
  | { type: 'harvest' }
  | { type: 'startSale'; placeId: PlaceId; variety: VarietyId; grams: number }
  | { type: 'stopSale'; placeId: PlaceId }
  | { type: 'bribe' }
  | { type: 'deposit'; amount: number }
  | { type: 'withdraw'; amount: number }
  | { type: 'chooseJob'; jobId: JobId }
  | { type: 'buyHousing' }
  | { type: 'hireGuards'; count: number }
  | { type: 'fireGuards'; count: number };

/** Applique une action déjà validée. L'état reçu doit avoir été avancé à `now`. */
export function applyAction(state: GameState, action: GameAction, now: number): GameState {
  switch (action.type) {
    case 'buy': return buy(state, action.item, action.quantity, now);
    case 'sow': return sowSeeds(state, action.variety, action.count, now);
    case 'discardGerms': return discardGerms(state, action.germIds);
    case 'plantGerms': return plantGerms(state, action.germIds, action.potSize, now);
    case 'plantFastest': return plantFastestGerms(state, action.count, action.potSize, now);
    case 'water': return waterPlants(state, action.selector, { waterCl: action.waterCl, fertMl: action.fertMl });
    case 'fillToMax': return fillToMax(state, action.selector);
    case 'treat': return treatPlants(state, action.selector);
    case 'setFrozen': return setFrozen(state, action.selector, action.frozen);
    case 'repot': return repot(state, action.plantIds, now);
    case 'setLight': return setLightHours(state, action.room, action.hours);
    case 'discardPlants': return discardPlants(state, action.plantIds);
    case 'discardMales': return discardMales(state);
    case 'clearDead': return clearDead(state);
    case 'harvest': return harvest(state, now);
    case 'startSale': return startSale(state, action.placeId, action.variety, action.grams, now);
    case 'stopSale': return stopSale(state, action.placeId, now);
    case 'bribe': return bribePolice(state, now);
    case 'deposit': return deposit(state, action.amount, now);
    case 'withdraw': return withdraw(state, action.amount, now);
    case 'chooseJob': return chooseJob(state, action.jobId, now);
    case 'buyHousing': return buyNextHousing(state, now);
    case 'hireGuards': return hireGuards(state, action.count, now);
    case 'fireGuards': return fireGuards(state, action.count, now);
  }
}

// ---------------------------------------------------------------- Validation des entrées non fiables

type Obj = Record<string, unknown>;

function invalid(): never {
  throw new GameError('INVALID_ACTION');
}

function obj(value: unknown): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid();
  return value as Obj;
}

function num(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) invalid();
  return value;
}

function int(value: unknown): number {
  const n = num(value);
  if (!Number.isInteger(n)) invalid();
  return n;
}

function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') invalid();
  return value;
}

function oneOf<T extends string | number>(allowed: readonly T[], value: unknown): T {
  if (!allowed.includes(value as T)) invalid();
  return value as T;
}

function ids(value: unknown): number[] {
  if (!Array.isArray(value) || value.length > 1_000) invalid();
  return value.map(int);
}

const ROOMS: readonly Room[] = ['veg', 'flo'];
const CONSUMABLE_IDS = Object.keys(CONSUMABLES) as ConsumableId[];

function selector(value: unknown): PlantSelector {
  if (value === 'all') return 'all';
  if (Array.isArray(value)) return ids(value);
  return { room: oneOf(ROOMS, obj(value).room) };
}

function shopItem(value: unknown): ShopItem {
  const o = obj(value);
  switch (o.kind) {
    case 'seeds': return { kind: 'seeds', variety: oneOf(VARIETY_IDS, o.variety) };
    case 'equipment': return { kind: 'equipment', id: oneOf<EquipmentId>(EQUIPMENT_IDS, o.id) };
    case 'pot': return { kind: 'pot', size: oneOf<PotSize>(POT_SIZES, o.size) };
    case 'consumable': return { kind: 'consumable', id: oneOf(CONSUMABLE_IDS, o.id) };
    default: return invalid();
  }
}

/** Transforme un JSON quelconque en action valide, ou lève `INVALID_ACTION`. */
export function parseAction(input: unknown): GameAction {
  const o = obj(input);
  switch (o.type) {
    case 'buy': return { type: 'buy', item: shopItem(o.item), quantity: int(o.quantity) };
    case 'sow': return { type: 'sow', variety: oneOf(VARIETY_IDS, o.variety), count: int(o.count) };
    case 'discardGerms': return { type: 'discardGerms', germIds: ids(o.germIds) };
    case 'plantGerms': return { type: 'plantGerms', germIds: ids(o.germIds), potSize: oneOf<PotSize>(POT_SIZES, o.potSize) };
    case 'plantFastest': return { type: 'plantFastest', count: int(o.count), potSize: oneOf<PotSize>(POT_SIZES, o.potSize) };
    case 'water': return { type: 'water', selector: selector(o.selector), waterCl: num(o.waterCl), fertMl: num(o.fertMl) };
    case 'fillToMax': return { type: 'fillToMax', selector: selector(o.selector) };
    case 'treat': return { type: 'treat', selector: selector(o.selector) };
    case 'setFrozen': return { type: 'setFrozen', selector: selector(o.selector), frozen: bool(o.frozen) };
    case 'repot': return { type: 'repot', plantIds: ids(o.plantIds) };
    case 'setLight': return { type: 'setLight', room: oneOf(ROOMS, o.room), hours: int(o.hours) };
    case 'discardPlants': return { type: 'discardPlants', plantIds: ids(o.plantIds) };
    case 'discardMales': return { type: 'discardMales' };
    case 'clearDead': return { type: 'clearDead' };
    case 'harvest': return { type: 'harvest' };
    case 'startSale': return { type: 'startSale', placeId: oneOf(PLACE_IDS, o.placeId), variety: oneOf(VARIETY_IDS, o.variety), grams: int(o.grams) };
    case 'stopSale': return { type: 'stopSale', placeId: oneOf(PLACE_IDS, o.placeId) };
    case 'bribe': return { type: 'bribe' };
    case 'deposit': return { type: 'deposit', amount: int(o.amount) };
    case 'withdraw': return { type: 'withdraw', amount: int(o.amount) };
    case 'chooseJob': return { type: 'chooseJob', jobId: oneOf(JOB_IDS, o.jobId) };
    case 'buyHousing': return { type: 'buyHousing' };
    case 'hireGuards': return { type: 'hireGuards', count: int(o.count) };
    case 'fireGuards': return { type: 'fireGuards', count: int(o.count) };
    default: return invalid();
  }
}
