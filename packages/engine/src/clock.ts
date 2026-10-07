/**
 * Horloge du jeu : jour de la semaine et heure dans le fuseau officiel du jeu.
 * Sert aux horaires des lieux de vente, aux impôts du lundi et aux limites quotidiennes.
 */

export const GAME_TIMEZONE = 'Europe/Paris';

export interface GameClock {
  /** 0 = dimanche … 6 = samedi. */
  weekday: number;
  hour: number;
  /** Jour calendaire « AAAA-MM-JJ » (limites quotidiennes). */
  dayKey: string;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

let formatter: Intl.DateTimeFormat | undefined;

export function gameClock(at: number): GameClock {
  formatter ??= new Intl.DateTimeFormat('en-US', {
    timeZone: GAME_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(new Date(at))) parts[part.type] = part.value;
  return {
    weekday: WEEKDAYS[parts.weekday ?? 'Sun'] ?? 0,
    hour: Number(parts.hour) % 24,
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}
