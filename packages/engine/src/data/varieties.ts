/**
 * Variétés de beuh. Toutes poussent à la même vitesse et produisent le même poids :
 * seuls le prix des graines et le prix de revente de base diffèrent.
 * Prix calibrés sur l'instantané du jeu d'origine (voir docs/weedland-reference.md §5).
 */

export const VARIETY_IDS = [
  'jack_herer',
  'big_bud',
  'shiva_shanti',
  'super_skunk',
  'marleys_collie',
  'blueberry',
  'aurora_indica',
  'white_widow',
  'early_girl',
  'ak48',
  'crystal',
  'afghane',
  'tibetaine',
  'marocaine',
] as const;

export type VarietyId = (typeof VARIETY_IDS)[number];

export interface Variety {
  id: VarietyId;
  name: string;
  /** Prix d'un paquet de graines en boutique. */
  seedPackPrice: number;
  /** Prix de revente de base (Wl/g), point de départ des prix dynamiques. */
  baseSalePrice: number;
  /** Cultivable en extérieur (V1). */
  outdoor: boolean;
}

export const VARIETIES: Record<VarietyId, Variety> = {
  jack_herer: { id: 'jack_herer', name: 'Jack Herer', seedPackPrice: 150, baseSalePrice: 2, outdoor: true },
  big_bud: { id: 'big_bud', name: 'Big Bud', seedPackPrice: 88, baseSalePrice: 6, outdoor: true },
  shiva_shanti: { id: 'shiva_shanti', name: 'Shiva Shanti', seedPackPrice: 33, baseSalePrice: 3, outdoor: true },
  super_skunk: { id: 'super_skunk', name: 'Super Skunk', seedPackPrice: 44, baseSalePrice: 7, outdoor: true },
  marleys_collie: { id: 'marleys_collie', name: "Marley's Collie", seedPackPrice: 120, baseSalePrice: 7, outdoor: true },
  blueberry: { id: 'blueberry', name: 'Blueberry', seedPackPrice: 150, baseSalePrice: 4, outdoor: false },
  aurora_indica: { id: 'aurora_indica', name: 'Aurora Indica', seedPackPrice: 45, baseSalePrice: 5, outdoor: true },
  white_widow: { id: 'white_widow', name: 'White Widow', seedPackPrice: 140, baseSalePrice: 2, outdoor: true },
  early_girl: { id: 'early_girl', name: 'Early Girl', seedPackPrice: 89, baseSalePrice: 4, outdoor: true },
  ak48: { id: 'ak48', name: 'AK48', seedPackPrice: 115, baseSalePrice: 5, outdoor: true },
  crystal: { id: 'crystal', name: 'Crystal', seedPackPrice: 200, baseSalePrice: 4, outdoor: false },
  afghane: { id: 'afghane', name: 'Afghane', seedPackPrice: 135, baseSalePrice: 3, outdoor: true },
  tibetaine: { id: 'tibetaine', name: 'Tibetaine', seedPackPrice: 130, baseSalePrice: 2, outdoor: true },
  marocaine: { id: 'marocaine', name: 'Marocaine', seedPackPrice: 135, baseSalePrice: 6, outdoor: true },
};

export const SEEDS_PER_PACK = 15;
