import { BALANCE, estimateWeeklyBill, withdrawalFee } from '@weedapp/engine';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { fmt1, wl } from '@/game/labels';
import { useGame, useGameState } from '@/game/store';
import { Body, Button, Card, Field, Muted, Row, Screen, Stat } from '@/ui/components';
import { colors } from '@/ui/theme';

export default function BankScreen() {
  const state = useGameState();
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const [depositText, setDepositText] = useState('');
  const [withdrawText, setWithdrawText] = useState('');
  if (!state) return null;

  const bill = estimateWeeklyBill(state);
  const toDeposit = Number.parseInt(depositText, 10) || 0;
  const toWithdraw = Number.parseInt(withdrawText, 10) || 0;
  const { bank, economy } = BALANCE;

  return (
    <Screen>
      <Card title="Livret">
        <Row>
          <Stat label="Sur le livret" value={wl(state.bankBalance)} tone="accent" />
          <Stat label="Dans ta bourse" value={wl(state.money)} tone={state.money < 0 ? 'danger' : undefined} />
        </Row>
        <Muted>
          Intérêts de {fmt1(bank.weeklyInterestRate * 100)} % par semaine (le lundi) · frais de retrait {fmt1(bank.withdrawalFeeRate * 100)} % · plafond {wl(bank.cap)}.
          L'argent placé est à l'abri des voleurs et de l'impôt sur la fortune.
        </Muted>
      </Card>

      <Card title="Déposer">
        <Row>
          <Field value={depositText} onChangeText={setDepositText} keyboardType="number-pad" placeholder="Montant" />
          <Button label="Tout" compact variant="secondary" onPress={() => setDepositText(String(Math.max(0, state.money)))} />
        </Row>
        <Button
          label="Déposer"
          disabled={busy || toDeposit <= 0}
          onPress={async () => {
            if (await act({ type: 'deposit', amount: toDeposit }, `${wl(toDeposit)} déposés`)) setDepositText('');
          }}
        />
      </Card>

      <Card title="Retirer">
        <Row>
          <Field value={withdrawText} onChangeText={setWithdrawText} keyboardType="number-pad" placeholder="Montant" />
          <Button label="Tout" compact variant="secondary" onPress={() => setWithdrawText(String(state.bankBalance))} />
        </Row>
        {toWithdraw > 0 && <Muted>Tu recevras {wl(toWithdraw - withdrawalFee(toWithdraw))} (frais {wl(withdrawalFee(toWithdraw))}).</Muted>}
        <Button
          label="Retirer"
          variant="secondary"
          disabled={busy || toWithdraw <= 0}
          onPress={async () => {
            if (await act({ type: 'withdraw', amount: toWithdraw }, 'Retrait effectué')) setWithdrawText('');
          }}
        />
      </Card>

      <Card title="Impôts de lundi (estimation)">
        <BillLine label="Habitation" value={bill.housing} />
        <BillLine label="Électricité" value={bill.electricity} />
        <BillLine label="Eau" value={bill.water} />
        <BillLine label="Gardes du corps" value={bill.guards} />
        <BillLine label={`ISF (${economy.wealthTaxRate * 100} % au-delà de ${wl(economy.wealthTaxThreshold)} en bourse)`} value={bill.wealthTax} />
        <BillLine label="Salaire" value={-bill.salary} />
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 }}>
          <BillLine label="Total prélevé" value={bill.total} bold />
        </View>
        <Muted>Prélevé de ta bourse le lundi à 4 h. Elle peut passer en négatif. Intérêts attendus : {wl(bill.interest)}.</Muted>
      </Card>
    </Screen>
  );
}

function BillLine({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <Row>
      <View style={{ flex: 1 }}>
        <Body bold={bold}>{label}</Body>
      </View>
      <Text style={{ color: value < 0 ? colors.accent : colors.text, fontWeight: bold ? '800' : '600' }}>{wl(value)}</Text>
    </Row>
  );
}
