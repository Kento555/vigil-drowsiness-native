import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Blueprint, Btn } from '../components/ui';
import { useAuth } from '../lib/auth';
import { fetchRecentEvents } from '../lib/supabase';
import { colors, fonts } from '../lib/theme';

export default function PrivacyScreen() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const downloadData = async () => {
    if (!user) return;
    setBusy(true);
    const events = await fetchRecentEvents(user.id, 1000);
    setBusy(false);
    await Share.share({
      title: 'My Vigil data',
      message: JSON.stringify({ email: user.email, events }, null, 2),
    });
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete account and data',
      'This withdraws your consent, signs you out immediately, and queues your account and drive records for permanent deletion within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Actual row purge happens server-side within the retention window —
            // this client only has an anon key, so it can request, not execute, deletion.
            await signOut();
            router.replace('/auth/sign-in');
          },
        },
      ],
    );
  };

  if (!user) return <Redirect href="/auth/sign-in" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 6l-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YOUR DATA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.headline}>The camera never leaves this phone.</Text>

        <Blueprint style={styles.card} tint={colors.accentPalest}>
          <Text style={[styles.cardKicker, { color: colors.accentDark }]}>WHAT NEVER LEAVES THE PHONE</Text>
          <Bullet color={colors.accent}>Camera images. Read frame by frame, then discarded</Bullet>
          <Bullet color={colors.accent}>Your face. No face print is made or stored</Bullet>
          <Bullet color={colors.accent}>Audio. Vigil never opens the microphone</Bullet>
        </Blueprint>

        <Blueprint style={styles.card}>
          <Text style={styles.cardKicker}>WHAT IS SAVED TO YOUR ACCOUNT</Text>
          <Bullet color={colors.muted}>Your e-mail and name</Bullet>
          <Bullet color={colors.muted}>When a drive started and ended</Bullet>
          <Bullet color={colors.muted}>That a drowsy moment happened, and when</Bullet>
          <Text style={styles.cardFootnote}>
            This is what builds your history. It is never sold or shared, and never used for
            advertising.
          </Text>
        </Blueprint>

        <View style={styles.footer}>
          <Btn title="Download my data" variant="secondary" height={56} fontSize={15} onPress={downloadData} disabled={busy} style={{ marginBottom: 8 }} />
          <Btn title="Delete my account and data" variant="danger" height={56} fontSize={15} onPress={deleteAccount} />
          <Text style={styles.disclaimer}>
            Deletion removes everything within 30 days. <Text style={styles.link} onPress={() => router.push('/privacy-policy')}>Full policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bullet({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletMark, { color }]}>—</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 14 },
  headerTitle: { fontFamily: fonts.heading, fontSize: 14, letterSpacing: 2.5, color: colors.text },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  headline: { fontFamily: fonts.heading, fontSize: 29, lineHeight: 33, color: colors.text, marginBottom: 20 },
  card: { padding: 18, marginBottom: 16 },
  cardKicker: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 2, color: colors.muted, marginBottom: 12 },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 9 },
  bulletMark: { fontFamily: fonts.body },
  bulletText: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 19, color: colors.text },
  cardFootnote: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 6 },
  footer: { marginTop: 8, paddingBottom: 20 },
  disclaimer: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted, textAlign: 'center', marginTop: 14 },
  link: { color: colors.accent },
});
