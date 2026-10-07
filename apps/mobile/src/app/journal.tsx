import { View } from 'react-native';
import { formatTime, logText } from '@/game/labels';
import { useGameState } from '@/game/store';
import { Body, Card, Muted, Screen } from '@/ui/components';
import { spacing } from '@/ui/theme';

export default function JournalScreen() {
  const state = useGameState();
  if (!state) return null;
  return (
    <Screen>
      <Card>
        {state.log.length === 0 ? (
          <Muted>Rien pour l'instant.</Muted>
        ) : (
          state.log.map((entry, index) => (
            <View key={`${entry.at}-${index}`} style={{ gap: 2, paddingVertical: spacing.xs }}>
              <Muted>{formatTime(entry.at)}</Muted>
              <Body>{logText(entry)}</Body>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
