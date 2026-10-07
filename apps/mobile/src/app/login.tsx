import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session';
import { Button, Chips, Field, Muted } from '@/ui/components';
import { colors, spacing } from '@/ui/theme';

type Mode = 'signIn' | 'signUp';

export default function LoginScreen() {
  const session = useSession((s) => s.session);
  const signIn = useSession((s) => s.signIn);
  const signUp = useSession((s) => s.signUp);
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) return <Redirect href="/" />;

  async function submit() {
    setLoading(true);
    setMessage(null);
    const error = mode === 'signIn' ? await signIn(email.trim(), password) : await signUp(email.trim(), password, pseudo.trim());
    setLoading(false);
    if (error) setMessage(error);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
        <Text style={styles.title}>WeedApp</Text>
        <Muted>Cultive, deale, échappe aux stups… et méfie-toi de tes potes.</Muted>
        <Chips
          options={[
            { value: 'signIn', label: 'Connexion' },
            { value: 'signUp', label: 'Inscription' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <View style={{ gap: spacing.md }}>
          {mode === 'signUp' && (
            <Field label="Pseudo" value={pseudo} onChangeText={setPseudo} autoCapitalize="none" autoCorrect={false} maxLength={20} />
          )}
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
        </View>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Button label={mode === 'signIn' ? 'Se connecter' : 'Créer mon compte'} onPress={submit} loading={loading} disabled={!email || !password} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  title: { color: colors.accent, fontSize: 34, fontWeight: '800' },
  message: { color: colors.warning, fontSize: 14 },
});
