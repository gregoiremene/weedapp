import {
  BALANCE,
  bribeCost,
  gameClock,
  isPlaceOpen,
  marketPrice,
  nextRepriceAt,
  PLACE_IDS,
  PLACES,
  policeIndexMax,
  VARIETY_IDS,
  type GameState,
  type PlaceId,
  type VarietyId,
} from '@weedapp/engine';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fmt, formatDuration, grams, varietyName, wl } from '@/game/labels';
import { useGame, useGameState, useNow } from '@/game/store';
import { Body, Button, Card, Chips, Field, Muted, ProgressBar, Row, Screen } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

export default function SellScreen() {
  const state = useGameState();
  const now = useNow();
  if (!state) return null;
  return (
    <Screen>
      <Police state={state} />
      <Stock state={state} now={now} />
      <ActiveSales state={state} />
      <Places state={state} now={now} />
    </Screen>
  );
}

function Police({ state }: { state: GameState }) {
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const max = policeIndexMax(state);
  const cost = bribeCost(state);
  const ratio = state.policeIndex / max;
  return (
    <Card title="Indice police" right={<Text style={[styles.index, ratio > 0.8 && { color: colors.danger }]}>{fmt(state.policeIndex)} / {fmt(max)}</Text>}>
      <ProgressBar value={ratio} tone={ratio > 0.8 ? 'danger' : ratio > 0.5 ? 'warning' : 'info'} />
      <Muted>
        Au-delà du maximum, les stups débarquent à l'actualisation suivante : amende de {BALANCE.police.raidFinePerIndex} × l'indice, saisie de tout ce qui est
        en vente et perte de ton métier. Sans vente en cours, l'indice baisse chaque heure.
      </Muted>
      {state.raidPending && <Text style={styles.alert}>🚨 Descente imminente !</Text>}
      <Button
        label={`Voir le commissaire corrompu (${wl(cost)})`}
        variant={state.raidPending ? 'danger' : 'secondary'}
        disabled={busy || state.policeIndex <= 0 || state.money < cost}
        onPress={() => act({ type: 'bribe' }, 'Indice remis à zéro. Discrétion assurée.')}
      />
    </Card>
  );
}

function Stock({ state, now }: { state: GameState; now: number }) {
  const owned = VARIETY_IDS.filter((v) => state.stock[v] > 0);
  return (
    <Card title="Ta bourse" right={<Muted>prix revus dans {formatDuration(nextRepriceAt(now) - now)}</Muted>}>
      {owned.length === 0 ? (
        <Muted>Rien à vendre pour l'instant.</Muted>
      ) : (
        owned.map((v) => (
          <Row key={v}>
            <Body>{varietyName(v)}</Body>
            <View style={{ flex: 1 }} />
            <Muted>
              {grams(state.stock[v])} · {marketPrice(v, now)} Wl/g
            </Muted>
          </Row>
        ))
      )}
    </Card>
  );
}

function ActiveSales({ state }: { state: GameState }) {
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  if (state.sales.length === 0) return null;
  return (
    <Card title="Ventes en cours">
      {state.sales.map((sale) => {
        const total = sale.gramsLeft + sale.gramsSold;
        return (
          <View key={sale.placeId} style={{ gap: spacing.xs }}>
            <Row>
              <Body bold>{PLACES[sale.placeId].name}</Body>
              <View style={{ flex: 1 }} />
              <Muted>
                {varietyName(sale.variety)} · {grams(sale.gramsSold)}/{grams(total)} · {wl(sale.earned)}
              </Muted>
            </Row>
            <ProgressBar value={sale.gramsSold / total} />
            <Button label="Retirer la vente" compact variant="secondary" disabled={busy} onPress={() => act({ type: 'stopSale', placeId: sale.placeId }, 'Vente retirée')} />
          </View>
        );
      })}
    </Card>
  );
}

function Places({ state, now }: { state: GameState; now: number }) {
  const [selected, setSelected] = useState<PlaceId | null>(null);
  const clock = gameClock(now);
  return (
    <Card title="Lieux de vente">
      {PLACE_IDS.map((id) => {
        const place = PLACES[id];
        const open = isPlaceOpen(place, clock);
        const running = state.sales.some((s) => s.placeId === id);
        return (
          <View key={id} style={styles.place}>
            <Row>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={[styles.badge, { color: open ? colors.accent : colors.textMuted }]}>{open ? 'ouvert' : 'fermé'}</Text>
              <View style={{ flex: 1 }} />
              {open && !running && <Button label={selected === id ? 'Fermer' : 'Vendre ici'} compact variant="secondary" onPress={() => setSelected(selected === id ? null : id)} />}
            </Row>
            <Muted>
              {place.hoursLabel} · risque {place.riskPercent} % · rente {place.rentPercent} % · {place.capacityPerHour} g/h
            </Muted>
            {selected === id && open && !running && <SaleForm state={state} placeId={id} now={now} onDone={() => setSelected(null)} />}
          </View>
        );
      })}
    </Card>
  );
}

function SaleForm({ state, placeId, now, onDone }: { state: GameState; placeId: PlaceId; now: number; onDone: () => void }) {
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const owned = VARIETY_IDS.filter((v) => state.stock[v] > 0);
  const [variety, setVariety] = useState<VarietyId | undefined>(owned[0]);
  const [amount, setAmount] = useState(String(owned[0] ? state.stock[owned[0]] : 0));
  if (!variety || owned.length === 0) return <Muted>Ta bourse est vide.</Muted>;

  const place = PLACES[placeId];
  const g = Math.max(0, Number.parseInt(amount, 10) || 0);
  const hours = Math.ceil(g / place.capacityPerHour);
  const earnings = Math.round((g * marketPrice(variety, now) * place.rentPercent) / 100);
  const indexGain = g * place.riskPercent * BALANCE.police.indexPerGramRisk;

  return (
    <View style={styles.form}>
      <Chips
        options={owned.map((v) => ({ value: v, label: `${varietyName(v)} (${fmt(state.stock[v])} g)` }))}
        value={variety}
        onChange={(v) => {
          setVariety(v);
          setAmount(String(state.stock[v]));
        }}
      />
      <Field label="Grammes" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
      <Muted>
        ≈ {wl(earnings)} en {hours} h d'ouverture · indice +{fmt(indexGain)} (max {fmt(policeIndexMax(state))})
      </Muted>
      <Button
        label="Lancer la vente"
        disabled={busy || g <= 0}
        onPress={async () => {
          if (await act({ type: 'startSale', placeId, variety, grams: g }, 'Vente lancée')) onDone();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  index: { color: colors.text, fontWeight: '800', fontSize: 16 },
  alert: { color: colors.danger, fontWeight: '700' },
  place: { gap: 4, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  placeName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  badge: { fontSize: 12, fontWeight: '700' },
  form: { gap: spacing.sm, paddingTop: spacing.sm },
});
