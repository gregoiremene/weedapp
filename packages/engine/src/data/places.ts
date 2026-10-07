/**
 * Lieux de vente publics/privés (voir docs/weedland-reference.md §6.2).
 * On y dépose des grammes ; à chaque heure d'ouverture, la capacité horaire est vendue
 * au prix du marché × indice de rente, et l'indice police monte selon le risque.
 */

export const PLACE_IDS = [
  'college',
  'lycee',
  'universite',
  'boite_de_nuit',
  'fete_foraine',
  'cage_escalier',
  'rave_party',
  'disney_village',
  'plage',
  'parc',
  'place_du_village',
  'gare',
] as const;

export type PlaceId = (typeof PLACE_IDS)[number];

/** Créneau d'ouverture : jours (0 = dimanche) et heures [from, to[. */
export interface OpeningSlot {
  days: readonly number[];
  from: number;
  to: number;
}

export interface Place {
  id: PlaceId;
  name: string;
  /** Texte affiché pour les horaires. */
  hoursLabel: string;
  opening: readonly OpeningSlot[];
  /** Risque en % : indice gagné par heure = grammes vendus × risque × policeFactor. */
  riskPercent: number;
  /** Indice de rente en % du prix du marché. */
  rentPercent: number;
  capacityPerHour: number;
}

const WEEK = [1, 2, 3, 4, 5] as const;
const WEEKEND = [0, 6] as const;
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export const PLACES: Record<PlaceId, Place> = {
  college: { id: 'college', name: 'Collège', hoursLabel: '8h-17h en semaine', opening: [{ days: WEEK, from: 8, to: 17 }], riskPercent: 0.85, rentPercent: 110, capacityPerHour: 124 },
  lycee: { id: 'lycee', name: 'Lycée', hoursLabel: '8h-18h en semaine', opening: [{ days: WEEK, from: 8, to: 18 }], riskPercent: 0.8, rentPercent: 105, capacityPerHour: 131 },
  universite: { id: 'universite', name: 'Université', hoursLabel: '24h/24 en semaine', opening: [{ days: WEEK, from: 0, to: 24 }], riskPercent: 0.6, rentPercent: 105, capacityPerHour: 138 },
  boite_de_nuit: { id: 'boite_de_nuit', name: 'Boîte de nuit', hoursLabel: '0h-8h vendredi et samedi', opening: [{ days: [5, 6], from: 0, to: 8 }], riskPercent: 0.9, rentPercent: 115, capacityPerHour: 142 },
  fete_foraine: { id: 'fete_foraine', name: 'Fête foraine', hoursLabel: '10h-22h le week-end', opening: [{ days: WEEKEND, from: 10, to: 22 }], riskPercent: 0.6, rentPercent: 110, capacityPerHour: 138 },
  cage_escalier: { id: 'cage_escalier', name: "Cage d'escalier", hoursLabel: '6h-24h en semaine', opening: [{ days: WEEK, from: 6, to: 24 }], riskPercent: 0.75, rentPercent: 115, capacityPerHour: 147 },
  rave_party: { id: 'rave_party', name: 'Rave party', hoursLabel: '24h/24 le week-end', opening: [{ days: WEEKEND, from: 0, to: 24 }], riskPercent: 0.75, rentPercent: 125, capacityPerHour: 158 },
  disney_village: { id: 'disney_village', name: 'Parc d’attractions', hoursLabel: '8h-22h 7j/7', opening: [{ days: ALL_DAYS, from: 8, to: 22 }], riskPercent: 0.95, rentPercent: 120, capacityPerHour: 146 },
  plage: { id: 'plage', name: 'Plage', hoursLabel: '24h/24 le week-end', opening: [{ days: WEEKEND, from: 0, to: 24 }], riskPercent: 0.55, rentPercent: 110, capacityPerHour: 146 },
  parc: { id: 'parc', name: 'Parc', hoursLabel: '8h-22h 7j/7', opening: [{ days: ALL_DAYS, from: 8, to: 22 }], riskPercent: 0.6, rentPercent: 115, capacityPerHour: 136 },
  place_du_village: { id: 'place_du_village', name: 'Place du village', hoursLabel: '0h-7h 7j/7', opening: [{ days: ALL_DAYS, from: 0, to: 7 }], riskPercent: 0.5, rentPercent: 115, capacityPerHour: 129 },
  gare: { id: 'gare', name: 'Gare', hoursLabel: '6h-23h 7j/7', opening: [{ days: ALL_DAYS, from: 6, to: 23 }], riskPercent: 0.6, rentPercent: 115, capacityPerHour: 132 },
};

export function isPlaceOpen(place: Place, clock: { weekday: number; hour: number }): boolean {
  return place.opening.some((slot) => slot.days.includes(clock.weekday) && clock.hour >= slot.from && clock.hour < slot.to);
}
