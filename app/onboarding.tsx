import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'react-native-vision-camera';
import { router } from 'expo-router';
import { Btn } from '../components/ui';
import { PermissionDisclosure } from '../components/PermissionDisclosure';
import { useSettings } from '../lib/settings';
import { colors, fonts } from '../lib/theme';

const POINTS = [
  'Works with your screen off — mount the phone and forget it',
  'Everything happens on this phone. Nothing is recorded',
  'Siren, voice and vibration together — loud enough to wake you',
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useSettings();
  const [showDisclosure, setShowDisclosure] = useState(false);

  const finish = () => {
    completeOnboarding();
    router.replace('/auth/sign-in');
  };

  const allowCamera = async () => {
    await Camera.requestCameraPermission();
    setShowDisclosure(false);
    finish();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <View style={styles.brand}>
          <View style={styles.dot} />
          <Text style={styles.brandText}>VIGIL</Text>
        </View>

        <Text style={styles.headline}>Vigil watches your eyes so you can watch the road.</Text>
        <Text style={styles.sub}>
          It listens for closing eyes, yawns and a nodding head, and wakes you before you drift.
        </Text>

        <View style={styles.list}>
          {POINTS.map((p, i) => (
            <View key={p} style={[styles.row, i < POINTS.length - 1 && styles.rowDivider]}>
              <Text style={styles.rowNum}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.rowText}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            Vigil is an assistive tool. It is not a substitute for rest. If you feel drowsy, stop and sleep.
          </Text>
          <Btn title="GET STARTED" variant="primary" corners height={60} fontSize={17} onPress={() => setShowDisclosure(true)} style={{ marginBottom: 4 }} />
          <Btn title="I already have an account" variant="plain" height={48} fontSize={14} onPress={finish} />
        </View>
      </View>

      <PermissionDisclosure visible={showDisclosure} onAllow={allowCamera} onDismiss={() => setShowDisclosure(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 34 },
  dot: { width: 11, height: 11, backgroundColor: colors.accent },
  brandText: { fontFamily: fonts.headingBold, fontSize: 18, letterSpacing: 2, color: colors.text },
  headline: { fontFamily: fonts.heading, fontSize: 36, lineHeight: 38, color: colors.text, maxWidth: 320, marginBottom: 14 },
  sub: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.muted, marginBottom: 26 },
  list: { borderTopWidth: 1, borderTopColor: colors.divider },
  row: { flexDirection: 'row', gap: 14, paddingVertical: 15 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowNum: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.accent, width: 20 },
  rowText: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20, color: colors.text },
  footer: { marginTop: 'auto', paddingBottom: 24 },
  disclaimer: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: colors.muted, marginBottom: 14 },
});
