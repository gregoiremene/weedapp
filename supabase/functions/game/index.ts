// POST /game { action?: GameAction }
// Rattrape les actualisations horaires du joueur, applique son action (optionnelle) et sauvegarde.
// Sans action : simple synchronisation (renvoie l'état à jour).
import { advance, applyAction, parseAction } from '../_shared/engine/index.ts';
import { assertNotBanned, HttpError, json, loadPlayer, readBody, requireUser, savePlayer, serve } from '../_shared/server.ts';

const MAX_ATTEMPTS = 3;

serve(async (req) => {
  const userId = await requireUser(req);
  await assertNotBanned(userId, 'game');
  const body = await readBody(req);
  const action = body.action == null ? null : parseAction(body.action);

  // Verrou optimiste : si une autre requête a écrit entre-temps, on recommence depuis l'état frais.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const now = Date.now();
    const player = await loadPlayer(userId, now);
    const { state: advanced, events, ticks } = advance(player.state, now);
    const next = action ? applyAction(advanced, action, now) : advanced;
    const changed = action !== null || ticks > 0 || player.version === 0;
    if (!changed || (await savePlayer(userId, next, player.version))) {
      return json({ state: next, events, serverTime: now });
    }
  }
  throw new HttpError(409, 'VERSION_CONFLICT');
});
