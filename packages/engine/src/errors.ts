export type GameErrorCode =
  | 'INVALID_QUANTITY'
  | 'UNKNOWN_ITEM'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_SEEDS'
  | 'GERMINATION_FULL'
  | 'GERM_NOT_FOUND'
  | 'GERM_NOT_READY'
  | 'NOT_ENOUGH_READY_GERMS'
  | 'HOUSING_FULL'
  | 'INSUFFICIENT_POTS'
  | 'INSUFFICIENT_SOIL'
  | 'INSUFFICIENT_FERTILIZER'
  | 'INSUFFICIENT_INSECTICIDE'
  | 'PLANT_NOT_FOUND'
  | 'PLANT_NOT_GROWING'
  | 'PLANT_NOT_OVERDOSED'
  | 'INVALID_LIGHT_HOURS';

/** Erreur métier : action refusée par les règles du jeu (l'état n'est pas modifié). */
export class GameError extends Error {
  constructor(
    public readonly code: GameErrorCode,
    public readonly details: Record<string, number | string> = {},
  ) {
    super(code);
    this.name = 'GameError';
  }
}
