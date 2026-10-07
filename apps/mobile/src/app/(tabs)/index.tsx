import {
  BALANCE,
  equipmentFactor,
  germinationCapacity,
  growingPlants,
  HOUR_MS,
  HOUSINGS,
  lightFactor,
  policeIndexMax,
  POT_SIZES,
  VARIETY_IDS,
  type GameState,
  type Plant,
  type PotSize,
  type Room,
  type VarietyId,
} from '@weedapp/engine';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fmt, fmt1, formatDuration, varietyName, wl } from '@/game/labels';
import { useGame, useGameState, useNow } from '@/game/store';
import { Body, Button, Card, Chips, Field, Muted, ProgressBar, Row, Screen, Stat } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

const ROOM_LABEL: Record<Room, string> = { veg: 'Végétation', flo: 'Floraison' };

function autonomyHours(plant: Plant): number {
  if (plant.stage !== 'veg' && plant.stage !== 'flo') return Infinity;
  const stage = BALANCE.stages[plant.stage];
  return Math.min(plant.waterCl / stage.waterPerHourCl, plant.fertMl / stage.fertPerHourMl);
}

export default function ExploitationScreen() {
  const state = useGameState();
  const sync = useGame((s) => s.sync);
  const [refreshing, setRefreshing] = useState(false);
  if (!state) return null;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await sync();
        setRefreshing(false);
      }}
    >
      <Overview state={state} />
      <Germination state={state} />
      <RoomCard state={state} room="veg" />
      <RoomCard state={state} room="flo" />
      <Drying state={state} />
    </Screen>
  );
}

function Overview({ state }: { state: GameState }) {
  const now = useNow();
  const housing = HOUSINGS[state.housing];
  const max = policeIndexMax(state);
  const ratio = state.policeIndex / max;
  const nextTick = (Math.floor(now / HOUR_MS) + 1) * HOUR_MS;
  return (
    <Card>
      <Row wrap>
        <Stat label="Bourse" value={wl(state.money)} tone={state.money < 0 ? 'danger' : undefined} />
        <Stat label="Livret" value={wl(state.bankBalance)} />
        <Stat label="Indice police" value={`${fmt(state.policeIndex)} / ${fmt(max)}`} tone={ratio > 0.8 ? 'danger' : ratio > 0.5 ? 'warning' : undefined} />
      </Row>
      <ProgressBar value={ratio} tone={ratio > 0.8 ? 'danger' : ratio > 0.5 ? 'warning' : 'info'} />
      {state.raidPending && <Text style={styles.alert}>🚨 Les stups arrivent à la prochaine actualisation ! Va voir le commissaire.</Text>}
      <Muted>
        {housing.name} · {growingPlants(state).length}/{housing.plantCapacity} plants · actualisation dans {formatDuration(nextTick - now)}
      </Muted>
    </Card>
  );
}

function intOr(text: string, fallback: number): number {
  const n = Number.parseInt(text, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function Germination({ state }: { state: GameState }) {
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const owned = VARIETY_IDS.filter((v) => state.inventory.seeds[v] > 0);
  const [variety, setVariety] = useState<VarietyId>(owned[0] ?? 'super_skunk');
  const [sowCount, setSowCount] = useState('15');
  const [plantCount, setPlantCount] = useState('3');
  const [potSize, setPotSize] = useState<PotSize>(40);
  const capacity = germinationCapacity(state);
  const ready = state.germs.filter((g) => g.height >= BALANCE.germination.plantableHeight).length;
  const tallest = Math.max(0, ...state.germs.map((g) => g.height));
  const selectedVariety = owned.includes(variety) ? variety : owned[0];

  return (
    <Card title="Germination" right={<Muted>{state.germs.length}/{capacity} germes</Muted>}>
      {state.germs.length > 0 && (
        <>
          <Muted>
            {ready} prêt(s) à planter · le plus grand fait {fmt1(tallest)} cm (10 cm requis)
          </Muted>
          <ProgressBar value={tallest / BALANCE.germination.plantableHeight} />
        </>
      )}
      {capacity === 0 ? (
        <Muted>Achète un kit de germination en boutique pour commencer.</Muted>
      ) : owned.length === 0 ? (
        <Muted>Aucune graine en stock : passe à la boutique.</Muted>
      ) : (
        <>
          <Chips options={owned.map((v) => ({ value: v, label: `${varietyName(v)} (${state.inventory.seeds[v]})` }))} value={selectedVariety ?? variety} onChange={setVariety} />
          <Row>
            <Field value={sowCount} onChangeText={setSowCount} keyboardType="number-pad" placeholder="Nombre" />
            <Button
              label="Faire germer"
              disabled={busy || !selectedVariety}
              onPress={() => selectedVariety && act({ type: 'sow', variety: selectedVariety, count: intOr(sowCount, 1) }, 'Graines mises à germer')}
            />
          </Row>
        </>
      )}
      {ready > 0 && (
        <>
          <Body bold>Planter en végétation</Body>
          <Chips options={POT_SIZES.map((size) => ({ value: size, label: `Pot ${size} cm (${state.inventory.pots[size]})` }))} value={potSize} onChange={setPotSize} />
          <Row>
            <Field value={plantCount} onChangeText={setPlantCount} keyboardType="number-pad" placeholder="Nombre" />
            <Button
              label="Planter les plus rapides"
              disabled={busy}
              onPress={() => act({ type: 'plantFastest', count: intOr(plantCount, 1), potSize }, 'Plantés ! Pense à les arroser.')}
            />
          </Row>
          <Muted>Un plant fraîchement planté doit être arrosé avant la prochaine actualisation.</Muted>
        </>
      )}
      {state.germs.length > 0 && (
        <Button label="Jeter tous les germes" variant="secondary" compact disabled={busy} onPress={() => act({ type: 'discardGerms', germIds: state.germs.map((g) => g.id) })} />
      )}
    </Card>
  );
}

function RoomCard({ state, room }: { state: GameState; room: Room }) {
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const plants = state.plants.filter((p) => p.stage === room);
  const stage = BALANCE.stages[room];
  const light = state.lightHours[room];
  const equip = equipmentFactor(state);
  const lightOk = lightFactor(state, room);
  const males = plants.filter((p) => p.sex === 'male').length;
  const overdosed = plants.filter((p) => p.overdosed);
  const minAutonomy = Math.min(...plants.filter((p) => !p.frozen).map(autonomyHours));
  const anyFrozen = plants.some((p) => p.frozen);

  return (
    <Card title={`${ROOM_LABEL[room]} (${plants.length})`} right={<Muted>max {stage.waterMaxCl} cl / {stage.fertMaxMl} ml</Muted>}>
      <Row>
        <Muted>Éclairage {light} h/j (idéal {stage.targetLightHours} h)</Muted>
        <View style={{ flex: 1 }} />
        <Button label="−" compact variant="secondary" disabled={busy || light <= 0} onPress={() => act({ type: 'setLight', room, hours: light - 1 })} />
        <Button label="+" compact variant="secondary" disabled={busy || light >= 24} onPress={() => act({ type: 'setLight', room, hours: light + 1 })} />
      </Row>
      {plants.length === 0 ? (
        <Muted>Aucun plant.</Muted>
      ) : (
        <>
          {equip < 1 && <Text style={styles.warning}>⚠️ Matériel insuffisant : pousse à {Math.round(equip * 100)} %. Achète lampes, radiateurs, ventilateurs.</Text>}
          {lightOk < 1 && <Text style={styles.warning}>⚠️ Éclairage mal réglé : pousse à {Math.round(lightOk * 100)} %.</Text>}
          {Number.isFinite(minAutonomy) && (
            <Text style={minAutonomy < 4 ? styles.alert : styles.muted}>
              💧 Autonomie du plant le plus assoiffé : {formatDuration(minAutonomy * HOUR_MS)}
            </Text>
          )}
          <Row wrap>
            <Button label="Arroser + engrais (max)" disabled={busy} onPress={() => act({ type: 'fillToMax', selector: { room } }, 'Arrosé !')} />
            <Button label="Traiter" variant="secondary" disabled={busy} onPress={() => act({ type: 'treat', selector: { room } }, 'Plants protégés des pucerons')} />
            <Button
              label={anyFrozen ? 'Dégeler' : 'Geler'}
              variant="secondary"
              disabled={busy}
              onPress={() => act({ type: 'setFrozen', selector: { room }, frozen: !anyFrozen })}
            />
            {room === 'flo' && males > 0 && (
              <Button label={`Jeter les mâles (${males})`} variant="danger" disabled={busy} onPress={() => act({ type: 'discardMales' }, 'Mâles jetés')} />
            )}
            {overdosed.length > 0 && (
              <Button label={`Rempoter (${overdosed.length})`} variant="danger" disabled={busy} onPress={() => act({ type: 'repot', plantIds: overdosed.map((p) => p.id) }, 'Rempotés : arrose-les vite !')} />
            )}
          </Row>
          <View style={{ gap: spacing.sm }}>
            {plants.map((plant) => (
              <PlantRow key={plant.id} plant={plant} />
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

function PlantRow({ plant }: { plant: Plant }) {
  const room = plant.stage as Room;
  const stage = BALANCE.stages[room];
  const start = room === 'veg' ? BALANCE.germination.plantableHeight : BALANCE.stages.veg.endHeight;
  const progress = (plant.height - start) / (stage.endHeight - start);
  const tags = [
    plant.stage === 'flo' ? (plant.sex === 'male' ? '♂ mâle' : '♀ femelle') : null,
    plant.frozen ? '❄️ gelé' : null,
    plant.overdosed ? '☠️ surdosé' : null,
    plant.infested ? '🐛 pucerons' : null,
    plant.pollinationHours > 0 && plant.sex === 'female' ? '🌼 pollinisée' : null,
  ].filter(Boolean);
  return (
    <View style={styles.plant}>
      <Row>
        <Text style={styles.plantName}>{varietyName(plant.variety)}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.muted}>
          {fmt(plant.height)} cm · 💧{fmt1(plant.waterCl)} · 🧪{fmt1(plant.fertMl)}
        </Text>
      </Row>
      <ProgressBar value={progress} tone={plant.overdosed ? 'danger' : 'accent'} />
      {tags.length > 0 && <Text style={styles.muted}>{tags.join(' · ')}</Text>}
    </View>
  );
}

function Drying({ state }: { state: GameState }) {
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const drying = state.plants.filter((p) => p.stage === 'drying');
  const dry = state.plants.filter((p) => p.stage === 'dry');
  const dead = state.plants.filter((p) => p.stage === 'dead');
  if (drying.length + dry.length + dead.length === 0) return null;
  const readyGrams = dry.reduce((sum, p) => sum + p.harvestGrams, 0);
  const readySeeds = dry.reduce((sum, p) => sum + p.harvestSeeds, 0);
  const nextDry = Math.min(...drying.map((p) => p.dryingHoursLeft));

  return (
    <Card title="Séchage">
      {drying.length > 0 && (
        <Muted>
          {drying.length} plant(s) en séchage · premier prêt dans ~{nextDry} h
        </Muted>
      )}
      {dry.length > 0 && (
        <Button
          label={`Récolter ${fmt(readyGrams)} g${readySeeds ? ` + ${readySeeds} graines` : ''}`}
          disabled={busy}
          onPress={() => act({ type: 'harvest' }, `Récolte : ${fmt(readyGrams)} g dans ta bourse`)}
        />
      )}
      {dead.length > 0 && (
        <Row>
          <Muted>💀 {dead.length} plant(s) mort(s)</Muted>
          <View style={{ flex: 1 }} />
          <Button label="Retirer" compact variant="secondary" disabled={busy} onPress={() => act({ type: 'clearDead' })} />
        </Row>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  alert: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  warning: { color: colors.warning, fontSize: 13 },
  muted: { color: colors.textMuted, fontSize: 13 },
  plant: { gap: 4, paddingVertical: spacing.xs },
  plantName: { color: colors.text, fontWeight: '600', fontSize: 14 },
});
