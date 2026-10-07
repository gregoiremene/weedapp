import { BALANCE, HOUSING_IDS, HOUSINGS, theftSuccessChance, type DetectiveReport } from '@weedapp/engine';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSession } from '@/auth/session';
import { housingName, jobName, wl } from '@/game/labels';
import { useGame, useGameState } from '@/game/store';
import { isOnline, supabase } from '@/lib/supabase';
import { Body, Button, Card, Field, Muted, Row, Screen } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

interface PublicPlayer {
  id: string;
  pseudo: string;
  housing_level: number;
}

export default function PlayersScreen() {
  return (
    <Screen>
      <Guards />
      {isOnline ? <Targets /> : <Card title="Joueurs"><Muted>Les vols entre joueurs nécessitent le serveur.</Muted></Card>}
    </Screen>
  );
}

function Guards() {
  const state = useGameState();
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const [count, setCount] = useState('1');
  if (!state) return null;
  const n = Math.max(1, Number.parseInt(count, 10) || 1);
  const s = BALANCE.security;
  const protectedHome = HOUSINGS[state.housing].level < BALANCE.theft.minVictimHousingLevel;
  return (
    <Card title={`Gardes du corps (${state.guards})`}>
      <Muted>
        Embauche {wl(s.guardHireCost)}, puis {wl(s.guardWeeklyCost)}/semaine chacun, licenciement {wl(s.guardFireCost)}. Chaque garde pèse autant qu'un voleur.
      </Muted>
      {protectedHome && <Muted>Tant que tu n'as pas la Maison, personne ne peut te voler.</Muted>}
      <Row>
        <Field value={count} onChangeText={setCount} keyboardType="number-pad" />
        <Button label="Embaucher" disabled={busy || state.money < n * s.guardHireCost} onPress={() => act({ type: 'hireGuards', count: n }, `${n} garde(s) embauché(s)`)} />
        <Button label="Licencier" variant="secondary" disabled={busy || state.guards < n} onPress={() => act({ type: 'fireGuards', count: n }, `${n} garde(s) licencié(s)`)} />
      </Row>
    </Card>
  );
}

function Targets() {
  const state = useGameState();
  const profile = useSession((s) => s.profile);
  const [players, setPlayers] = useState<PublicPlayer[]>([]);

  useEffect(() => {
    void supabase
      ?.from('profiles')
      .select('id, pseudo, housing_level')
      .order('housing_level', { ascending: false })
      .limit(100)
      .then(({ data }) => setPlayers((data as PublicPlayer[] | null) ?? []));
  }, []);

  if (!state) return null;
  const myLevel = HOUSINGS[state.housing].level;
  const others = players.filter((p) => p.id !== profile?.id);

  return (
    <Card title="Joueurs">
      <Muted>
        Envoie des voleurs ({wl(BALANCE.theft.costPerThief)} chacun, {BALANCE.theft.attacksPerDay} attaques/jour) pour rafler 5 à 10 % de la bourse d'un joueur. Cibles possibles : à partir de la Maison, et pas plus petites que ta propre habitation.
      </Muted>
      {others.length === 0 && <Muted>Aucun autre joueur pour l'instant.</Muted>}
      {others.map((player) => (
        <Target key={player.id} player={player} attackable={player.housing_level >= BALANCE.theft.minVictimHousingLevel && player.housing_level >= myLevel} />
      ))}
    </Card>
  );
}

function Target({ player, attackable }: { player: PublicPlayer; attackable: boolean }) {
  const run = useGame((s) => s.run);
  const setNotice = useGame((s) => s.setNotice);
  const busy = useGame((s) => s.busy);
  const [open, setOpen] = useState(false);
  const [thieves, setThieves] = useState('1');
  const [report, setReport] = useState<DetectiveReport | null>(null);
  const n = Math.max(1, Number.parseInt(thieves, 10) || 1);
  const housing = HOUSING_IDS[player.housing_level] ?? 'chambre';

  async function steal() {
    const result = await run((client) => client.theft(player.id, n));
    if (!result) return;
    const { outcome } = result;
    setNotice(outcome.success ? `Jackpot ! ${wl(outcome.money)} volés à ${player.pseudo}.` : `Raté : les gardes de ${player.pseudo} ont repoussé tes voleurs.`, outcome.success ? 'success' : 'error');
  }

  async function investigate() {
    const result = await run((client) => client.detective(player.id));
    if (result) setReport(result.report);
  }

  return (
    <View style={{ paddingVertical: spacing.sm, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Row>
        <View style={{ flex: 1 }}>
          <Body bold>{player.pseudo}</Body>
          <Muted>{housingName(housing)}</Muted>
        </View>
        {attackable ? <Button label={open ? 'Fermer' : 'Cibler'} compact variant="secondary" onPress={() => setOpen(!open)} /> : <Muted>intouchable</Muted>}
      </Row>
      {open && attackable && (
        <View style={{ gap: spacing.sm }}>
          <Button label={`Détective privé (${wl(BALANCE.theft.detectiveCost)})`} compact variant="secondary" disabled={busy} onPress={investigate} />
          {report && (
            <Text style={{ color: colors.textMuted }}>
              🕵️ {housingName(report.housing)} · {report.guards} garde(s) · {report.growingPlants} plants · {jobName(report.job)}
              {'\n'}Chances avec {n} voleur(s) : {Math.round(theftSuccessChance(n, report.guards) * 100)} %
            </Text>
          )}
          <Row>
            <Field value={thieves} onChangeText={setThieves} keyboardType="number-pad" />
            <Button label={`Envoyer ${n} voleur(s) · ${wl(n * BALANCE.theft.costPerThief)}`} variant="danger" disabled={busy} onPress={steal} />
          </Row>
        </View>
      )}
    </View>
  );
}
