import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from './theme';

export function Screen({ children, onRefresh, refreshing = false }: { children: ReactNode; onRefresh?: () => void; refreshing?: boolean }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ title, right, children, style }: { title?: string; right?: ReactNode; children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      {(title || right) && (
        <View style={styles.cardHeader}>
          {title ? <Text style={styles.cardTitle}>{title}</Text> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  compact,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        (pressed || inactive) && { opacity: inactive ? 0.45 : 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.accentText : colors.text} />
      ) : (
        <Text style={[styles.buttonLabel, variant === 'primary' && { color: colors.accentText }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Row({ children, gap = spacing.sm, wrap }: { children: ReactNode; gap?: number; wrap?: boolean }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: wrap ? 'wrap' : 'nowrap' }}>{children}</View>;
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warning' | 'danger' | 'accent' }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone && { color: colors[tone] }]}>{value}</Text>
    </View>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Body({ children, bold }: { children: ReactNode; bold?: boolean }) {
  return <Text style={[styles.body, bold && { fontWeight: '700' }]}>{children}</Text>;
}

export function Field(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: spacing.xs, flex: 1 }}>
      {label ? <Text style={styles.muted}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.textMuted} style={[styles.input, style]} {...rest} />
    </View>
  );
}

/** Sélecteur en pastilles (variété, taille de pot, quantité…). */
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Row wrap gap={spacing.xs}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipLabel, selected && { color: colors.accentText }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </Row>
  );
}

export function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'warning' | 'danger' | 'info' }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.progress}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors[tone] }]} />
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { minHeight: 36, paddingHorizontal: spacing.md },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonSecondary: { backgroundColor: colors.surfaceRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  buttonDanger: { backgroundColor: '#5A2420' },
  buttonLabel: { color: colors.text, fontWeight: '700', fontSize: 15 },
  stat: { flex: 1, minWidth: 90, gap: 2 },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    fontSize: 16,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  progress: { height: 6, borderRadius: 3, backgroundColor: colors.background, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
