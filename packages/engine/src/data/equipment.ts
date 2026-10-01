/**
 * Matériel de culture et consommables vendus en boutique.
 * Le matériel « couvre » un nombre de plants, toutes salles confondues (végétation + floraison).
 */

export type EquipmentKind = 'lamp' | 'heater' | 'fan';

export const EQUIPMENT_IDS = [
  'lamp_250',
  'lamp_400',
  'lamp_600',
  'lamp_1000',
  'heater_3',
  'heater_5',
  'heater_10',
  'heater_15',
  'fan_3',
  'fan_5',
  'fan_10',
  'fan_15',
] as const;

export type EquipmentId = (typeof EQUIPMENT_IDS)[number];

export interface Equipment {
  id: EquipmentId;
  kind: EquipmentKind;
  name: string;
  /** Nombre de plants couverts. */
  capacity: number;
  /** Puissance consommée (sert au calcul de l'électricité). */
  watts: number;
  price: number;
}

export const EQUIPMENT: Record<EquipmentId, Equipment> = {
  lamp_250: { id: 'lamp_250', kind: 'lamp', name: 'Lampe 250 W', capacity: 3, watts: 250, price: 230 },
  lamp_400: { id: 'lamp_400', kind: 'lamp', name: 'Lampe 400 W', capacity: 5, watts: 400, price: 360 },
  lamp_600: { id: 'lamp_600', kind: 'lamp', name: 'Lampe 600 W', capacity: 10, watts: 600, price: 690 },
  lamp_1000: { id: 'lamp_1000', kind: 'lamp', name: 'Lampe 1000 W', capacity: 15, watts: 1000, price: 1_000 },
  heater_3: { id: 'heater_3', kind: 'heater', name: 'Radiateur 3 plants', capacity: 3, watts: 500, price: 200 },
  heater_5: { id: 'heater_5', kind: 'heater', name: 'Radiateur 5 plants', capacity: 5, watts: 800, price: 340 },
  heater_10: { id: 'heater_10', kind: 'heater', name: 'Radiateur 10 plants', capacity: 10, watts: 1500, price: 600 },
  heater_15: { id: 'heater_15', kind: 'heater', name: 'Radiateur 15 plants', capacity: 15, watts: 2000, price: 800 },
  fan_3: { id: 'fan_3', kind: 'fan', name: 'Ventilateur 3 plants', capacity: 3, watts: 50, price: 200 },
  fan_5: { id: 'fan_5', kind: 'fan', name: 'Ventilateur 5 plants', capacity: 5, watts: 80, price: 340 },
  fan_10: { id: 'fan_10', kind: 'fan', name: 'Ventilateur 10 plants', capacity: 10, watts: 150, price: 600 },
  fan_15: { id: 'fan_15', kind: 'fan', name: 'Ventilateur 15 plants', capacity: 15, watts: 200, price: 800 },
};

export const POT_SIZES = [20, 25, 30, 40] as const;
export type PotSize = (typeof POT_SIZES)[number];

export interface Pot {
  size: PotSize;
  /** Terreau consommé à la plantation. */
  soilLiters: number;
  price: number;
  /**
   * Multiplicateur de rendement. L'effet réel est inconnu dans l'original :
   * hypothèse « plus grand pot = meilleure récolte ».
   */
  yieldFactor: number;
}

export const POTS: Record<PotSize, Pot> = {
  20: { size: 20, soilLiters: 2, price: 7, yieldFactor: 0.85 },
  25: { size: 25, soilLiters: 3, price: 11, yieldFactor: 0.9 },
  30: { size: 30, soilLiters: 4, price: 17, yieldFactor: 0.95 },
  40: { size: 40, soilLiters: 6, price: 24, yieldFactor: 1 },
};

/** Consommables : quantité reçue par unité achetée et prix. */
export const CONSUMABLES = {
  soil: { name: 'Terreau (sac de 15 L)', amount: 15, price: 45 },
  fertVeg: { name: 'Engrais végétation (250 ml)', amount: 250, price: 60 },
  fertFlo: { name: 'Engrais floraison (250 ml)', amount: 250, price: 78 },
  insecticide: { name: 'Insecticide (50 ml)', amount: 50, price: 20 },
  germKit: { name: 'Kit de germination (15 graines)', amount: 1, price: 350 },
} as const;

export type ConsumableId = keyof typeof CONSUMABLES;
