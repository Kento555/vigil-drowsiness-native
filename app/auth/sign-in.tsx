import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Btn } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { colors, fonts } from '../../lib/theme';

export default function SignInScreen() {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignUp = mode === 'signup';

  const submit = async () => {
    if (!email || !password) return;
    setBusy(true);
    if (mode === 'signin') {
      const { error } = await signInWithPassword(email, password);
      if (error) Alert.alert('Sign In Failed', error);
    } else {
      if (!name) { Alert.alert('Name required'); setBusy(false); return; }
      const { error, needsConfirm } = await signUpWithPassword(email, password, name);
      if (error) Alert.alert('Sign Up Failed', error);
      else if (needsConfirm) {
        Alert.alert('Check your email', 'Confirm your email address to finish signing up.');
        setMode('signin');
      }
    }
    setBusy(false);
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) Alert.alert('Google Sign In Failed', error);
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.dot} />
          <Text style={styles.brandText}>VIGIL</Text>
        </View>

        <View style={styles.tabs}>
          <SegTab label="Sign in" active={mode === 'signin'} onPress={() => setMode('signin')} />
          <SegTab label="Create account" active={mode === 'signup'} onPress={() => setMode('signup')} border />
        </View>

        <Btn
          title="Continue with Google"
          variant="secondary"
          height={56}
          fontSize={15}
          onPress={handleGoogle}
          disabled={busy}
          style={{ marginBottom: 20 }}
          icon={<Text style={styles.googleG}>G</Text>}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {isSignUp && (
          <Field label="Name" value={name} onChangeText={setName} placeholder="What should we call you?" />
        )}
        <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

        <Btn
          title={busy ? '…' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          variant="primary"
          height={58}
          fontSize={16}
          onPress={submit}
          disabled={busy}
          style={{ marginBottom: 20 }}
        />

        <Text style={styles.footer}>
          An account keeps your trip history when you change phone. Drowsiness detection itself
          runs offline.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SegTab({ label, active, onPress, border }: { label: string; active: boolean; onPress: () => void; border?: boolean }) {
  return (
    <Btn
      title={label}
      variant="plain"
      height={50}
      fontSize={13}
      onPress={onPress}
      style={[styles.segTab, border && styles.segTabBorder, active && { backgroundColor: colors.text }]}
      textStyle={{ color: active ? colors.bg : colors.muted, letterSpacing: 1.5 }}
    />
  );
}

function Field(props: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder: string;
  secureTextEntry?: boolean; keyboardType?: 'email-address'; autoCapitalize?: 'none';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.mutedSoft}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flexGrow: 1, padding: 24, paddingTop: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 30 },
  dot: { width: 11, height: 11, backgroundColor: colors.accent },
  brandText: { fontFamily: fonts.headingBold, fontSize: 17, letterSpacing: 2, color: colors.text },
  tabs: { flexDirection: 'row', borderWidth: 1, borderColor: colors.divider, marginBottom: 24 },
  segTab: { flex: 1, borderWidth: 0, borderRadius: 0 },
  segTabBorder: { borderLeftWidth: 1, borderLeftColor: colors.divider },
  googleG: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.accentDark },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { fontFamily: fonts.heading, fontSize: 10, letterSpacing: 2, color: colors.muted },
  field: { marginBottom: 16 },
  fieldLabel: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.muted, marginBottom: 6 },
  input: {
    height: 52, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface,
    color: colors.text, fontFamily: fonts.body, fontSize: 15, paddingHorizontal: 12,
  },
  footer: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.muted, marginTop: 8 },
});
