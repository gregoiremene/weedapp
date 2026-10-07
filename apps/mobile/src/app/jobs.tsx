import { HOUSINGS, JOB_IDS, JOBS } from '@weedapp/engine';
import { Text } from 'react-native';
import { housingName, wl } from '@/game/labels';
import { useGame, useGameState } from '@/game/store';
import { Button, Card, Muted, Screen } from '@/ui/components';
import { colors } from '@/ui/theme';

export default function JobsScreen() {
  const state = useGameState();
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  if (!state) return null;
  const level = HOUSINGS[state.housing].level;

  return (
    <Screen>
      <Muted>Le salaire tombe chaque lundi avec les impôts. Attention : une descente des stups te fait perdre ton emploi.</Muted>
      {JOB_IDS.filter((id) => id !== 'none').map((id) => {
        const job = JOBS[id];
        const current = state.job === id;
        const locked = level < HOUSINGS[job.minHousing].level;
        return (
          <Card key={id} title={job.name} right={<Text style={{ color: colors.accent, fontWeight: '700' }}>{wl(job.weeklySalary)}/sem.</Text>}>
            <Muted>
              Études : {wl(job.studyCost)}
              {job.minHousing !== 'chambre' ? ` · à partir de : ${housingName(job.minHousing)}` : ''}
            </Muted>
            {current ? (
              <Muted>✅ Ton métier actuel</Muted>
            ) : (
              <Button
                label={locked ? `Habitation requise : ${housingName(job.minHousing)}` : `Devenir ${job.name.toLowerCase()}`}
                variant="secondary"
                disabled={busy || locked || state.money < job.studyCost}
                onPress={() => act({ type: 'chooseJob', jobId: id }, `Te voilà ${job.name.toLowerCase()} !`)}
              />
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
