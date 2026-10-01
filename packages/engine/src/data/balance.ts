import type { VarietyId } from './varieties';

/**
 * Toutes les constantes d'équilibrage du moteur.
 *
 * Calibrage visé (GAME_SPEED = 1, germe d'indice de développement 1, bonnes conditions) :
 * germination ~24 h + végétation ~48 h + floraison ~84 h + séchage 7-8 h ≈ 6,8 jours.
 * Eau/engrais : un plein tient ~20 h, donc deux sessions par jour (~12 h d'écart) suffisent.
 */
export const BALANCE = {
  /** Multiplicateur global du temps de jeu (1 = cycle d'environ une semaine). */
  gameSpeed: 1,

  start: {
    money: 2_000,
    /** Stock offert au départ pour pouvoir vendre dès le premier jour. */
    stock: { variety: 'super_skunk' as VarietyId, grams: 150 },
    lightHours: { veg: 18, flo: 12 },
  },

  germination: {
    /** Graines par kit de germination. */
    seedsPerKit: 15,
    /** Croissance d'un germe d'indice 1 (atteint 10 cm en 24 h). */
    cmPerHour: 10 / 24,
    plantableHeight: 10,
    maxHeight: 15,
    /** Indice de développement aléatoire d'un germe (multiplie toute sa croissance). */
    devIndexMin: 0.7,
    devIndexMax: 1.3,
  },

  stages: {
    veg: {
      cmPerHour: 1.25,
      /** Passage automatique en floraison. */
      endHeight: 70,
      waterMaxCl: 5,
      fertMaxMl: 5,
      waterPerHourCl: 0.25,
      fertPerHourMl: 0.25,
      targetLightHours: 18,
    },
    flo: {
      cmPerHour: 90 / 84,
      /** Passage automatique en séchage. */
      endHeight: 160,
      waterMaxCl: 15,
      fertMaxMl: 15,
      waterPerHourCl: 0.75,
      fertPerHourMl: 0.75,
      targetLightHours: 12,
    },
  },

  drying: { minHours: 7, maxHours: 8 },

  /** Un plant surdosé arrête de pousser et meurt après ce délai s'il n'est pas rempoté. */
  overdoseGraceHours: 6,

  /** Perte de croissance par heure d'écart avec l'éclairage cible de la salle. */
  lightPenaltyPerHour: 0.1,

  /**
   * Couverture du matériel : sans lampes rien ne pousse ; radiateurs et ventilateurs
   * manquants retirent chacun jusqu'à ce poids du facteur de croissance.
   */
  equipment: { heaterWeight: 0.25, fanWeight: 0.25 },

  aphids: {
    chancePerHour: 0.01,
    growthFactor: 0.5,
    insecticidePerTreatmentMl: 4,
  },

  sex: { maleChance: 0.25 },

  yield: {
    femaleGrams: 140,
    /** Écart aléatoire ± sur le poids d'une femelle. */
    femaleVarianceGrams: 10,
    maleGrams: 17,
    /** Une femelle totalement pollinisée ne donne plus que ce poids… */
    pollinatedFemaleGrams: 17,
    /** … et ce nombre de graines. */
    maxSeeds: 98,
    /** Heures d'exposition à un mâle mature pour une pollinisation complète. */
    fullPollinationHours: 60,
    /** Un mâle pollinise à partir de cette taille (même gelé). */
    malePollinationHeight: 100,
  },

  log: { maxEntries: 50 },
} as const;
