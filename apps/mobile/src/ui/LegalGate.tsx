import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './components';
import { colors, spacing } from './theme';

const ACCEPTED_KEY = 'weedapp.legalAccepted.v1';

/** Avertissement légal et confirmation d'âge, affichés au premier lancement. */
export function LegalGate({ children }: { children: ReactNode }) {
  const [accepted, setAccepted] = useState(() => localStorage.getItem(ACCEPTED_KEY) === 'yes');
  if (accepted) return <>{children}</>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Avant de jouer</Text>
        <Text style={styles.text}>
          Ce jeu est une simulation de gestion humoristique et entièrement fictive. Les données de culture sont
          volontairement fausses et ne constituent en aucun cas des informations utilisables.
        </Text>
        <Text style={styles.text}>
          La production, la détention, la vente et l'usage de stupéfiants sont interdits par la loi en France et dans
          de nombreux pays. Le jeu n'incite pas à la consommation.
        </Text>
        <Text style={styles.text}>
          Le chat est modéré : insultes, contenus haineux, publicité ou partage d'informations personnelles entraînent
          une suspension.
        </Text>
        <Text style={[styles.text, { fontWeight: '700' }]}>Ce jeu est réservé aux personnes de 18 ans et plus.</Text>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="J'ai 18 ans ou plus, j'ai compris"
          onPress={() => {
            localStorage.setItem(ACCEPTED_KEY, 'yes');
            setAccepted(true);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  text: { color: colors.text, fontSize: 16, lineHeight: 23 },
  footer: { padding: spacing.xl },
});
