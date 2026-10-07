import { HOUSING_IDS, HOUSINGS, nextHousing } from '@weedapp/engine';
import { Text, View } from 'react-native';
import { fmt, wl } from '@/game/labels';
import { useGame, useGameState } from '@/game/store';
import { Button, Card, Muted, Row, Screen } from '@/ui/components';
import { colors } from '@/ui/theme';

export default function HousingScreen() {
  const state = useGameState();
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  if (!state) return null;
  const current = HOUSINGS[state.housing];
  const next = nextHousing(state.housing);

  return (
    <Screen>
      <Muted>On monte niveau par niveau. L'ancienne habitation est perdue, mais tes plants et ton matériel déménagent avec toi.</Muted>
      {HOUSING_IDS.map((id) => {
        const h = HOUSINGS[id];
        const owned = h.level <= current.level;
        const isNext = next?.id === id;
        return (
          <Card
            key={id}
            title={h.name}
            right={<Text style={{ color: id === state.housing ? colors.accent : colors.textMuted, fontWeight: '700' }}>{id === state.housing ? 'Actuelle' : owned ? 'Dépassée' : wl(h.price)}</Text>}
            style={!owned && !isNext ? { opacity: 0.6 } : undefined}
          >
            <Row wrap>
              <Muted>{h.plantCapacity} plants</Muted>
              <Muted>· impôt {wl(h.weeklyTax)}/sem.</Muted>
              <Muted>· indice police max {fmt(h.policeIndexMax)}</Muted>
            </Row>
            {h.level >= 3 && <Muted>⚠️ À partir de la Maison, tu peux être volé (et voler).</Muted>}
            {isNext && (
              <View>
                <Button
                  label={`Acheter pour ${wl(h.price)}`}
                  disabled={busy || state.money < h.price}
                  onPress={() => act({ type: 'buyHousing' }, `Bienvenue dans ta ${h.name} !`)}
                />
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
