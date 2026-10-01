/**
 * Habitations, achetées strictement niveau par niveau.
 * Capacités, impôts et prix issus du jeu d'origine. Les indices police max marqués
 * « estimé » sont inconnus dans l'original et interpolés.
 */

export const HOUSING_IDS = [
  'chambre',
  'cabane',
  'maisonnette',
  'maison',
  'villa',
  'fermette',
  'laboratoire',
] as const;

export type HousingId = (typeof HOUSING_IDS)[number];

export interface Housing {
  id: HousingId;
  name: string;
  /** Rang de progression (0 = Chambre). */
  level: number;
  /** Plants simultanés en végétation + floraison (indoor). */
  plantCapacity: number;
  /** Plants en jardin (outdoor, V1). */
  gardenCapacity: number;
  /** Impôt d'habitation hebdomadaire. */
  weeklyTax: number;
  price: number;
  /** Indice police au-delà duquel les stups débarquent. */
  policeIndexMax: number;
}

export const HOUSINGS: Record<HousingId, Housing> = {
  chambre: { id: 'chambre', name: 'Chambre', level: 0, plantCapacity: 3, gardenCapacity: 0, weeklyTax: 0, price: 0, policeIndexMax: 200 },
  cabane: { id: 'cabane', name: 'Cabane', level: 1, plantCapacity: 9, gardenCapacity: 0, weeklyTax: 400, price: 13_500, policeIndexMax: 300 },
  // policeIndexMax estimé
  maisonnette: { id: 'maisonnette', name: 'Maisonnette', level: 2, plantCapacity: 18, gardenCapacity: 2, weeklyTax: 1_850, price: 60_000, policeIndexMax: 500 },
  maison: { id: 'maison', name: 'Maison', level: 3, plantCapacity: 40, gardenCapacity: 4, weeklyTax: 6_500, price: 140_000, policeIndexMax: 850 },
  // policeIndexMax estimés
  villa: { id: 'villa', name: 'Villa', level: 4, plantCapacity: 70, gardenCapacity: 10, weeklyTax: 15_000, price: 500_000, policeIndexMax: 1_400 },
  fermette: { id: 'fermette', name: 'Fermette', level: 5, plantCapacity: 130, gardenCapacity: 18, weeklyTax: 35_000, price: 2_500_000, policeIndexMax: 2_200 },
  laboratoire: { id: 'laboratoire', name: 'Laboratoire', level: 6, plantCapacity: 200, gardenCapacity: 30, weeklyTax: 80_000, price: 15_000_000, policeIndexMax: 3_200 },
};

export function nextHousing(id: HousingId): Housing | undefined {
  const next = HOUSING_IDS[HOUSINGS[id].level + 1];
  return next ? HOUSINGS[next] : undefined;
}
