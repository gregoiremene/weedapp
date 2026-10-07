import {
  CONSUMABLES,
  EQUIPMENT,
  EQUIPMENT_IDS,
  marketPrice,
  POT_SIZES,
  POTS,
  SEEDS_PER_PACK,
  shopItemPrice,
  VARIETIES,
  VARIETY_IDS,
  type ConsumableId,
  type GameState,
  type ShopItem,
} from '@weedapp/engine';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fmt, wl } from '@/game/labels';
import { useGame, useGameState, useNow } from '@/game/store';
import { Button, Card, Chips, Muted, Row, Screen } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

const QUANTITIES = [1, 5, 10, 50] as const;

function owned(state: GameState, id: ConsumableId): string {
  const inv = state.inventory;
  switch (id) {
    case 'soil': return `${fmt(inv.soilL)} L`;
    case 'fertVeg': return `${fmt(inv.fertVegMl)} ml`;
    case 'fertFlo': return `${fmt(inv.fertFloMl)} ml`;
    case 'insecticide': return `${fmt(inv.insecticideMl)} ml`;
    case 'germKit': return `${inv.germKits} kit(s)`;
  }
}

export default function ShopScreen() {
  const state = useGameState();
  const now = useNow();
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const [quantity, setQuantity] = useState<number>(1);
  if (!state) return null;

  const line = (key: string, title: string, detail: string, item: ShopItem) => {
    const cost = shopItemPrice(item) * quantity;
    return (
      <View key={key} style={styles.line}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.name}>{title}</Text>
          <Muted>{detail}</Muted>
        </View>
        <Button label={wl(cost)} compact disabled={busy || state.money < cost} onPress={() => act({ type: 'buy', item, quantity }, `Acheté : ${title}`)} />
      </View>
    );
  };

  return (
    <Screen>
      <Card>
        <Row>
          <Text style={styles.money}>{wl(state.money)}</Text>
          <View style={{ flex: 1 }} />
          <Muted>Quantité</Muted>
        </Row>
        <Chips options={QUANTITIES.map((q) => ({ value: q, label: `×${q}` }))} value={quantity} onChange={setQuantity} />
      </Card>

      <Card title="Ressources">
        {(Object.keys(CONSUMABLES) as ConsumableId[]).map((id) =>
          line(id, CONSUMABLES[id].name, `En stock : ${owned(state, id)}`, { kind: 'consumable', id }),
        )}
      </Card>

      <Card title={`Graines (paquet de ${SEEDS_PER_PACK})`}>
        <Muted>Toutes les variétés poussent pareil : seuls le prix des graines et la revente changent.</Muted>
        {VARIETY_IDS.map((id) =>
          line(
            id,
            VARIETIES[id].name,
            `Revente cette semaine : ${marketPrice(id, now)} Wl/g · stock ${state.inventory.seeds[id]}`,
            { kind: 'seeds', variety: id },
          ),
        )}
      </Card>

      <Card title="Pots">
        {POT_SIZES.map((size) => line(`pot${size}`, `Pot ${size} cm`, `${POTS[size].soilLiters} L de terreau · stock ${state.inventory.pots[size]}`, { kind: 'pot', size }))}
      </Card>

      <Card title="Matériel">
        <Muted>Il faut assez de lampes, radiateurs et ventilateurs pour couvrir tous les plants en pousse.</Muted>
        {EQUIPMENT_IDS.map((id) =>
          line(id, EQUIPMENT[id].name, `Couvre ${EQUIPMENT[id].capacity} plants · possédé : ${state.inventory.equipment[id]}`, { kind: 'equipment', id }),
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  money: { color: colors.accent, fontSize: 20, fontWeight: '800' },
});
