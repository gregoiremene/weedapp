import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/store';
import { colors, radius, spacing } from './theme';

/** Bandeau de retour d'action (succès, erreur, résumé d'absence), en haut de l'écran. */
export function Notice() {
  const notice = useGame((s) => s.notice);
  const clear = useGame((s) => s.clearNotice);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(clear, notice.tone === 'error' ? 5_000 : 3_500);
    return () => clearTimeout(id);
  }, [notice, clear]);

  if (!notice) return null;
  const background = notice.tone === 'error' ? colors.danger : notice.tone === 'success' ? colors.accent : colors.info;
  return (
    <Pressable onPress={clear} style={[styles.notice, { top: insets.top + spacing.sm, backgroundColor: background }]} accessibilityRole="alert">
      <Text style={styles.text}>{notice.text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  notice: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    zIndex: 100,
    elevation: 8,
  },
  text: { color: colors.accentText, fontWeight: '700', fontSize: 14, textAlign: 'center' },
});
