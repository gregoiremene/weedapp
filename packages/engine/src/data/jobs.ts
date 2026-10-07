import type { HousingId } from './housings.ts';

/** Métiers : frais d'études payés une fois, salaire versé chaque semaine avec les impôts. */

export const JOB_IDS = [
  'none',
  'bus_driver',
  'waiter',
  'taxi_driver',
  'fisher',
  'mason',
  'teacher',
  'farmer',
  'designer',
  'politician',
  'basketball_player',
  'football_player',
  'surgeon',
  'ceo',
] as const;

export type JobId = (typeof JOB_IDS)[number];

export interface Job {
  id: JobId;
  name: string;
  weeklySalary: number;
  studyCost: number;
  minHousing: HousingId;
}

export const JOBS: Record<JobId, Job> = {
  none: { id: 'none', name: 'Sans travail', weeklySalary: 0, studyCost: 0, minHousing: 'chambre' },
  bus_driver: { id: 'bus_driver', name: 'Chauffeur de bus', weeklySalary: 750, studyCost: 3_900, minHousing: 'chambre' },
  waiter: { id: 'waiter', name: 'Serveur', weeklySalary: 960, studyCost: 6_700, minHousing: 'chambre' },
  taxi_driver: { id: 'taxi_driver', name: 'Chauffeur de taxi', weeklySalary: 1_200, studyCost: 9_400, minHousing: 'chambre' },
  fisher: { id: 'fisher', name: 'Pêcheur', weeklySalary: 1_500, studyCost: 14_000, minHousing: 'chambre' },
  mason: { id: 'mason', name: 'Maçon', weeklySalary: 1_800, studyCost: 18_600, minHousing: 'chambre' },
  teacher: { id: 'teacher', name: 'Professeur', weeklySalary: 2_100, studyCost: 23_700, minHousing: 'chambre' },
  farmer: { id: 'farmer', name: 'Agriculteur', weeklySalary: 2_550, studyCost: 28_000, minHousing: 'chambre' },
  designer: { id: 'designer', name: 'Dessinateur', weeklySalary: 2_900, studyCost: 32_900, minHousing: 'maison' },
  politician: { id: 'politician', name: 'Politicien', weeklySalary: 3_300, studyCost: 37_300, minHousing: 'maison' },
  basketball_player: { id: 'basketball_player', name: 'Basketteur', weeklySalary: 3_900, studyCost: 42_500, minHousing: 'villa' },
  football_player: { id: 'football_player', name: 'Footballeur', weeklySalary: 4_600, studyCost: 53_000, minHousing: 'villa' },
  surgeon: { id: 'surgeon', name: 'Chirurgien', weeklySalary: 5_500, studyCost: 62_500, minHousing: 'fermette' },
  ceo: { id: 'ceo', name: 'PDG', weeklySalary: 7_000, studyCost: 75_000, minHousing: 'fermette' },
};
