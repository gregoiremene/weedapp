import { HOUSINGS, JOBS } from '@weedapp/engine';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '@/auth/session';
import { resetLocalGame } from '@/game/client';
import { useGame, useGameState } from '@/game/store';
import { isOnline } from '@/lib/supabase';
import { Button, Card, Muted, Screen } from '@/ui/components';
import { confirm } from '@/ui/confirm';
import { colors, spacing } from '@/ui/theme';

function NavRow({ href, title, detail }: { href: Href; title: string; detail: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>{title}</Text>
          <Muted>{detail}</Muted>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </Link>
  );
}

export default function MoreScreen() {
  const state = useGameState();
  const profile = useSession((s) => s.profile);
  const signOut = useSession((s) => s.signOut);
  const sync = useGame((s) => s.sync);
  const reset = useGame((s) => s.reset);
  if (!state) return null;

  return (
    <Screen>
      <Card>
        <NavRow href="/housing" title="Immobilier" detail={`${HOUSINGS[state.housing].name} · ${HOUSINGS[state.housing].plantCapacity} plants`} />
        <NavRow href="/jobs" title="Métiers" detail={JOBS[state.job].name} />
        <NavRow href="/players" title="La ville" detail={`Voleurs, gardes du corps (${state.guards}), détective`} />
        <NavRow href="/journal" title="Journal" detail="Tes 50 dernières actions" />
      </Card>

      <Card title="Compte">
        {isOnline ? (
          <>
            <Muted>
              Connecté en tant que {profile?.pseudo ?? '…'}
              {profile && profile.role !== 'player' ? ` (${profile.role === 'admin' ? 'admin' : 'modérateur'})` : ''}
            </Muted>
            <Button
              label="Se déconnecter"
              variant="secondary"
              onPress={async () => {
                reset();
                await signOut();
              }}
            />
          </>
        ) : (
          <>
            <Muted>Mode démo hors ligne : ta partie est enregistrée sur ce téléphone. Le chat et les vols nécessitent le serveur.</Muted>
            <Button
              label="Recommencer la partie"
              variant="danger"
              onPress={() =>
                confirm('Recommencer ?', 'Ta partie locale sera effacée.', 'Effacer', () => {
                  resetLocalGame();
                  void sync();
                })
              }
            />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  chevron: { color: colors.textMuted, fontSize: 24 },
});
