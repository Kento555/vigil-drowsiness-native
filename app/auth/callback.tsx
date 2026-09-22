import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useURL } from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { extractSessionTokens } from '../../lib/auth';
import { colors, fonts } from '../../lib/theme';

// Supabase email-confirmation / magic-link redirects land here as
// vigil://auth/callback#access_token=...&refresh_token=...&type=signup.
// Tokens are in the URL fragment, so they never reach the server and must
// be parsed and applied to the client session manually.
export default function AuthCallback() {
  const url = useURL();
  const [status, setStatus] = useState<'working' | 'done' | 'failed'>('working');
  const handled = useRef(false);

  useEffect(() => {
    if (!url || handled.current) return;
    handled.current = true;

    const tokens = extractSessionTokens(url);
    if (!tokens) {
      setStatus('failed');
      return;
    }
    supabase.auth.setSession(tokens).then(({ error }) => {
      setStatus(error ? 'failed' : 'done');
    });
  }, [url]);

  if (status === 'done') return <Redirect href="/" />;
  if (status === 'failed') return <Redirect href="/auth/sign-in" />;

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.text} />
      <Text style={styles.text}>Confirming your email…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 12 },
  text: { fontFamily: fonts.body, color: colors.muted, fontSize: 14 },
});
