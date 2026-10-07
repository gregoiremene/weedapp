import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session';
import { LegalGate } from '@/ui/LegalGate';
import { Notice } from '@/ui/Notice';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  const init = useSession((s) => s.init);
  useEffect(() => init(), [init]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <LegalGate>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: colors.background },
              headerBackTitle: 'Retour',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="housing" options={{ title: 'Immobilier' }} />
            <Stack.Screen name="jobs" options={{ title: 'Métiers' }} />
            <Stack.Screen name="players" options={{ title: 'La ville' }} />
            <Stack.Screen name="journal" options={{ title: 'Journal' }} />
          </Stack>
          <Notice />
        </View>
      </LegalGate>
    </SafeAreaProvider>
  );
}
