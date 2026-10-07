import { BALANCE } from './data/balance.ts';
import { EQUIPMENT_IDS, POT_SIZES, type EquipmentId, type PotSize } from './data/equipment.ts';
import type { HousingId } from './data/housings.ts';
import type { JobId } from './data/jobs.ts';
import type { PlaceId } from './data/places.ts';
import { VARIETY_IDS, type VarietyId } from './data/varieties.ts';

export const HOUR_MS = 3_600_000;

export type Room = 'veg' | 'flo';
export type PlantStage = Room | 'drying' | 'dry' | 'dead';
export type Sex = 'female' | 'male';
export type DeathCause = 'thirst' | 'starvation' | 'overdose';

export interface Germ {
  id: number;
  variety: VarietyId;
  height: number;
  /** Indice de développement : multiplie toute la croissance du plant. */
  devIndex: number;
  sownAt: number;
}

export interface Plant {
  id: number;
  variety: VarietyId;
  stage: PlantStage;
  height: number;
  devIndex: number;
  /** Tiré à la plantation, révélé au passage en floraison. */
  sex: Sex;
  potSize: PotSize;
  waterCl: number;
  fertMl: number;
  frozen: boolean;
  overdosed: boolean;
  overdoseHours: number;
  infested: boolean;
  protectedVeg: boolean;
  protectedFlo: boolean;
  pollinationHours: number;
  /** Somme des facteurs de conditions (matériel × éclairage) par heure de pousse. */
  conditionSum: number;
  growthHours: number;
  dryingHoursLeft: number;
  /** Fixés à l'entrée en séchage. */
  harvestGrams: number;
  harvestSeeds: number;
  deathCause?: DeathCause;
}

export interface Inventory {
  seeds: Record<VarietyId, number>;
  pots: Record<PotSize, number>;
  soilL: number;
  fertVegMl: number;
  fertFloMl: number;
  insecticideMl: number;
  germKits: number;
  equipment: Record<EquipmentId, number>;
}

/** Vente en cours dans un lieu public/privé. */
export interface Sale {
  placeId: PlaceId;
  variety: VarietyId;
  gramsLeft: number;
  gramsSold: number;
  /** Argent ramassé sur place, confisqué en cas de descente. */
  earned: number;
  startedAt: number;
}

export interface LogEntry {
  at: number;
  type: string;
  data: Record<string, number | string>;
}

export interface GameState {
  version: 1;
  /** État du générateur aléatoire (voir rng.ts). */
  rng: number;
  nextId: number;
  /** Heure pleine de la dernière actualisation traitée (ms epoch). */
  lastTickAt: number;
  money: number;
  housing: HousingId;
  /** « Bourse » de beuh : grammes par variété. */
  stock: Record<VarietyId, number>;
  inventory: Inventory;
  lightHours: Record<Room, number>;
  germs: Germ[];
  plants: Plant[];
  sales: Sale[];
  /** Argent placé sur le livret (à l'abri des voleurs et de l'ISF). */
  bankBalance: number;
  policeIndex: number;
  /** Indice au-dessus du maximum : les stups débarquent à l'actualisation suivante. */
  raidPending: boolean;
  job: JobId;
  guards: number;
  thefts: { dayKey: string; count: number };
  /** Consommations de la semaine, facturées avec les impôts. */
  meters: { waterCl: number; kwh: number };
  log: LogEntry[];
}

function zeroRecord<K extends string | number>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

export function createInitialState(now: number, seed: number): GameState {
  const stock = zeroRecord(VARIETY_IDS);
  stock[BALANCE.start.stock.variety] = BALANCE.start.stock.grams;
  return {
    version: 1,
    rng: seed | 0,
    nextId: 1,
    lastTickAt: Math.floor(now / HOUR_MS) * HOUR_MS,
    money: BALANCE.start.money,
    housing: 'chambre',
    stock,
    inventory: {
      seeds: zeroRecord(VARIETY_IDS),
      pots: zeroRecord(POT_SIZES),
      soilL: 0,
      fertVegMl: 0,
      fertFloMl: 0,
      insecticideMl: 0,
      germKits: 0,
      equipment: zeroRecord(EQUIPMENT_IDS),
    },
    lightHours: { ...BALANCE.start.lightHours },
    germs: [],
    plants: [],
    sales: [],
    bankBalance: 0,
    policeIndex: 0,
    raidPending: false,
    job: 'none',
    guards: 0,
    thefts: { dayKey: '', count: 0 },
    meters: { waterCl: 0, kwh: 0 },
    log: [],
  };
}

/** Copie profonde : les actions et le tick ne modifient jamais l'état reçu. */
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function addLog(state: GameState, at: number, type: string, data: LogEntry['data'] = {}): void {
  state.log.unshift({ at, type, data });
  if (state.log.length > BALANCE.log.maxEntries) state.log.length = BALANCE.log.maxEntries;
}

/** Plants qui occupent une place (végétation + floraison). */
export function growingPlants(state: GameState): Plant[] {
  return state.plants.filter((p) => p.stage === 'veg' || p.stage === 'flo');
}
