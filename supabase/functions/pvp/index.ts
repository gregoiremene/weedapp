// POST /pvp
//   { type: 'theft', targetId, thieves }  → envoie des voleurs chez un joueur
//   { type: 'detective', targetId }       → dossier du détective privé
// Les deux parties sont rattrapées à l'instant présent avant d'appliquer les règles du moteur.
import { advance, attemptTheft, HOUSINGS, investigate } from '../_shared/engine/index.ts';
import {
  admin,
  assertNotBanned,
  HttpError,
  json,
  loadPlayer,
  readBody,
  requireUser,
  savePlayer,
  sendPush,
  serve,
} from '../_shared/server.ts';

const MAX_ATTEMPTS = 3;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const userId = await requireUser(req);
  await assertNotBanned(userId, 'game');
  const body = await readBody(req);
  const targetId = body.targetId;
  if (typeof targetId !== 'string' || !UUID.test(targetId)) throw new HttpError(400, 'INVALID_TARGET');
  if (targetId === userId) throw new HttpError(400, 'CANNOT_TARGET_SELF');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const now = Date.now();
    const [me, target] = await Promise.all([loadPlayer(userId, now), loadPlayer(targetId, now)]);
    if (target.version === 0) throw new HttpError(404, 'PLAYER_NOT_FOUND');
    const mine = advance(me.state, now).state;
    const theirs = advance(target.state, now).state;
    const refs = { attacker: { id: me.id, pseudo: me.pseudo }, victim: { id: target.id, pseudo: target.pseudo } };

    if (body.type === 'detective') {
      const { state, report } = investigate(mine, theirs, refs.victim, now);
      if (await savePlayer(userId, state, me.version)) return json({ state, report, serverTime: now });
      continue;
    }

    if (body.type !== 'theft') throw new HttpError(400, 'INVALID_ACTION');
    const thieves = body.thieves;
    if (typeof thieves !== 'number') throw new HttpError(400, 'INVALID_ACTION');
    const result = attemptTheft(mine, theirs, refs, thieves, now);

    const { error } = await admin.rpc('save_two_player_states', {
      p_a: me.id,
      p_a_state: result.attacker,
      p_a_version: me.version,
      p_a_housing: HOUSINGS[result.attacker.housing].level,
      p_b: target.id,
      p_b_state: result.victim,
      p_b_version: target.version,
      p_b_housing: HOUSINGS[result.victim.housing].level,
    });
    if (error) {
      if (error.message.includes('VERSION_CONFLICT')) continue;
      throw error;
    }

    await sendPush(
      target.id,
      result.success ? 'Tu t’es fait cambrioler !' : 'Cambriolage repoussé',
      result.success
        ? `${me.pseudo} t’a volé ${result.money.toLocaleString('fr-FR')} Wl.`
        : `Tes gardes du corps ont repoussé les voleurs de ${me.pseudo}.`,
    );
    return json({
      state: result.attacker,
      outcome: { success: result.success, money: result.money, grams: result.grams },
      serverTime: now,
    });
  }
  throw new HttpError(409, 'VERSION_CONFLICT');
});
