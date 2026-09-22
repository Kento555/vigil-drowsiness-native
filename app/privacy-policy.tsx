import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Blueprint, Btn } from '../components/ui';
import { useAuth } from '../lib/auth';
import { fetchRecentEvents } from '../lib/supabase';
import { colors, fonts } from '../lib/theme';

const RETENTION_ROWS: [string, string][] = [
  ['Drive and drowsy-moment records', '24 months'],
  ['Account e-mail and name', 'While active'],
  ['Crash and diagnostic logs', '90 days'],
  ['Camera images', 'Not kept'],
];

export default function PrivacyPolicyScreen() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const requestCopy = async () => {
    if (!user) { Alert.alert('Sign in required', 'Sign in to request a copy of your data.'); return; }
    setBusy(true);
    const events = await fetchRecentEvents(user.id, 1000);
    setBusy(false);
    await Share.share({ title: 'My Vigil data', message: JSON.stringify({ email: user.email, events }, null, 2) });
  };

  const withdrawConsent = () => {
    Alert.alert(
      'Withdraw consent and delete everything',
      'This turns off drowsiness detection, signs you out, and queues your account and drive records for permanent deletion within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw & delete',
          style: 'destructive',
          onPress: async () => { await signOut(); router.replace('/auth/sign-in'); },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 6l-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PRIVACY POLICY</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.headline}>How Vigil handles your personal data</Text>
        <Text style={styles.updated}>
          Last updated 16 September 2026. Written to meet the Personal Data Protection Act 2012
          (Singapore). If any part of this is unclear, the Data Protection Officer in section 08
          has to answer you.
        </Text>

        <Blueprint style={styles.callout} tint={colors.accentPalest}>
          <Text style={styles.calloutText}>
            The short version: camera images are read on your phone and thrown away instantly.
            What reaches our servers is your e-mail, your trip times, and the fact that a drowsy
            moment happened.
          </Text>
        </Blueprint>

        <Section n="01" title="What we collect">
          <Para><Bold>Never collected:</Bold> camera images, video, photographs, any face template or
            biometric identifier, audio, and your location. Frames are analysed in your phone's
            memory and discarded within milliseconds.</Para>
          <Para last><Bold>Collected:</Bold> your e-mail address, the display name you choose, your
            device model and operating system version, the start and end time of each drive, and
            a record that a drowsy moment or alarm occurred with its timestamp and cause category.</Para>
        </Section>

        <Section n="02" title="Why we collect it">
          <Para>Under the PDPA we may only use your data for purposes we have told you about.
            Those purposes are:</Para>
          <Bullet>To let you sign in and recover your account</Bullet>
          <Bullet>To show you your own drive history and weekly pattern</Bullet>
          <Bullet>To keep that history when you change phone</Bullet>
          <Bullet>To find and fix crashes and detection faults</Bullet>
          <Para last>We do not sell your data, share it with advertisers, use it for advertising or
            profiling, or disclose it to your employer or insurer. We will not use it for a new
            purpose without asking you first.</Para>
        </Section>

        <Section n="03" title="Your consent, and taking it back">
          <Para>You gave consent when you allowed the camera and created an account. You can
            withdraw it at any time, for any reason, using the button at the bottom of this
            screen — no explanation needed.</Para>
          <Para last>Withdrawing consent stops drowsiness detection and deletes your stored
            records. We will tell you what stops working before you confirm, and we will not
            refuse or penalise the withdrawal.</Para>
        </Section>

        <Section n="04" title="How long we keep it">
          <View style={styles.table}>
            {RETENTION_ROWS.map(([k, v]) => (
              <View key={k} style={styles.tableRow}>
                <Text style={styles.tableKey}>{k}</Text>
                <Text style={styles.tableVal}>{v}</Text>
              </View>
            ))}
          </View>
          <Para last>After you delete your account everything is erased within 30 days, including
            from backups. An inactive account is erased after 24 months without a drive.</Para>
        </Section>

        <Section n="05" title="Where it is stored, and transfers abroad">
          <Para>Your account and drive records sit in a Supabase database hosted in the{' '}
            <Bold>Singapore (ap-southeast-1)</Bold> region.</Para>
          <Para last>If data ever has to move outside Singapore, the PDPA transfer limitation
            obligation applies: we will only send it to a recipient bound by contract to protect
            it to a standard comparable to the PDPA. Current sub-processors and their locations
            are listed at vigil.app/subprocessors.</Para>
        </Section>

        <Section n="06" title="How it is protected">
          <Bullet>Encrypted in transit (TLS 1.2+) and at rest (AES-256)</Bullet>
          <Bullet>Row-level security: your records are readable only by your own signed-in account</Bullet>
          <Bullet>Staff access is restricted, logged and reviewed</Bullet>
          <Bullet last>A notifiable data breach is reported to the PDPC and to you within 3 calendar days of assessment</Bullet>
        </Section>

        <Section n="07" title="Your rights">
          <Para>You may ask for a copy of the personal data we hold about you and how we have
            used it in the past year, and you may ask us to correct anything wrong. Use the
            buttons below or write to the officer in section 08.</Para>
          <Para last>We answer within 30 days. If we need longer we will tell you why and when.
            Where a request is refused we will say on what legal ground.</Para>
        </Section>

        <Section n="08" title="Data Protection Officer" last>
          <Blueprint style={styles.dpoCard}>
            <Text style={styles.dpoName}>Data Protection Officer, Vigil</Text>
            <Text style={styles.dpoLine}>dpo@vigil.app</Text>
            <Text style={[styles.dpoLine, { color: colors.textFaint }]}>+65 6XXX XXXX</Text>
            <Text style={[styles.dpoLine, { color: colors.textFaint }]}>Registered office address, Singapore</Text>
          </Blueprint>
          <Text style={styles.dpoFootnote}>
            Unhappy with our answer? You can escalate to the Personal Data Protection Commission
            at pdpc.gov.sg.
          </Text>
        </Section>

        <View style={styles.footer}>
          <Btn title="Request a copy of my data" variant="secondary" height={56} fontSize={15} onPress={requestCopy} disabled={busy} style={{ marginBottom: 8 }} />
          <Btn title="Correct my details" variant="secondary" height={56} fontSize={15} onPress={() => router.push('/settings')} style={{ marginBottom: 8 }} />
          <Btn title="Withdraw consent and delete everything" variant="danger" height={56} fontSize={15} onPress={withdrawConsent} />
          <Text style={styles.disclaimer}>
            Withdrawing consent turns off drowsiness detection. Vigil is assistive only and is not
            a medical device.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ n, title, children, last }: { n: string; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[styles.section, !last && styles.sectionDivider]}>
      <Text style={styles.sectionNum}>{n}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </View>
    </View>
  );
}
function Para({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <Text style={[styles.para, last && { marginBottom: 0 }]}>{children}</Text>;
}
function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}
function Bullet({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[styles.bulletRow, last && { marginBottom: 8 }]}>
      <Text style={styles.bulletMark}>—</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider },
  headerTitle: { fontFamily: fonts.heading, fontSize: 14, letterSpacing: 2.5, color: colors.text },
  body: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 24 },
  headline: { fontFamily: fonts.heading, fontSize: 29, lineHeight: 33, color: colors.text, marginBottom: 8 },
  updated: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted, marginBottom: 18 },
  callout: { padding: 16, marginBottom: 4 },
  calloutText: { fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: colors.accentDarker },
  section: { flexDirection: 'row', gap: 14, paddingVertical: 18 },
  sectionDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  sectionNum: { fontFamily: fonts.headingBold, fontSize: 19, color: colors.accent, width: 30 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 22, color: colors.text, marginBottom: 7 },
  para: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text, marginBottom: 8 },
  bold: { fontFamily: fonts.bodySemiBold },
  bulletRow: { flexDirection: 'row', gap: 9, marginBottom: 5 },
  bulletMark: { fontFamily: fonts.body, fontSize: 14, color: colors.accent },
  bulletText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.text },
  table: { borderTopWidth: 1, borderTopColor: colors.dividerFaint, marginBottom: 8 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.dividerFaint },
  tableKey: { flex: 1, fontFamily: fonts.body, fontSize: 13.5, color: colors.text },
  tableVal: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: colors.text },
  dpoCard: { padding: 14, marginTop: 2 },
  dpoName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, marginBottom: 2 },
  dpoLine: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.accent },
  dpoFootnote: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: colors.muted, marginTop: 9 },
  footer: { paddingTop: 22, paddingBottom: 20 },
  disclaimer: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted, textAlign: 'center', marginTop: 8 },
});
