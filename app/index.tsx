import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'react-native-vision-camera';
import { router, Redirect, useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Blueprint, Btn, PresetSegmented, Toggle, PRESET_COPY } from '../components/ui';
import { PermissionDisclosure } from '../components/PermissionDisclosure';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { fetchRecentEvents } from '../lib/supabase';
import { computeDriveSessions, formatDuration, formatRelativeDay, type DriveSession } from '../lib/history';
import { colors, fonts } from '../lib/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const { settings, update, onboardingComplete, loaded } = useSettings();
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [lastDrive, setLastDrive] = useState<DriveSession | null>(null);

  useEffect(() => {
    console.log('[index] render', { hasUser: !!user, onboardingComplete, loaded });
  }, [user, onboardingComplete, loaded]);

  useFocusEffect(useCallback(() => {
    if (!user) return;
    fetchRecentEvents(user.id, 100).then(events => {
      const sessions = computeDriveSessions(events, 1);
      setLastDrive(sessions[0] ?? null);
    });
  }, [user]));

  const startWatching = async () => {
    const status = await Camera.getCameraPermissionStatus();
    if (status === 'granted') {
      router.push('/watch');
      return;
    }
    setShowDisclosure(true);
  };

  const allowCamera = async () => {
    console.log('[index] allowCamera tapped');
    try {
      const result = await Camera.requestCameraPermission();
      console.log('[index] requestCameraPermission result', result);
      setShowDisclosure(false);
      if (result === 'granted') router.push('/watch');
    } catch (e) {
      console.log('[index] requestCameraPermission threw', e);
      setShowDisclosure(false);
    }
  };

  if (loaded && !onboardingComplete) return <Redirect href="/onboarding" />;
  if (!user) return <Redirect href="/auth/sign-in" />;

  const displayName = (user.user_metadata?.username as string) || user.email?.split('@')[0] || '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.dot} />
          <Text style={styles.brandText}>VIGIL</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/profile')} hitSlop={10} style={styles.avatarBtn} testID="profile-icon">
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(displayName.charAt(0) || '?').toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={10}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82A1.65 1.65 0 003.09 13H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Blueprint style={styles.readyCard}>
          <Text style={styles.kicker}>BEFORE YOU DRIVE</Text>
          <Text style={styles.ready}>READY</Text>
          <Text style={styles.readyBody}>
            Your face is in view and the camera is clear. Vigil will watch you and sound an alarm
            if you start to drift.
          </Text>
        </Blueprint>

        <Btn title="START WATCHING" variant="primary" corners height={96} fontSize={24} onPress={startWatching} style={{ marginBottom: 20 }} />

        <Text style={styles.kicker}>HOW SOON SHOULD I WAKE YOU?</Text>
        <PresetSegmented value={settings.preset} onChange={p => update({ preset: p })} height={54} />
        <Text style={styles.presetCopy}>{PRESET_COPY[settings.preset]}</Text>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Keep watching with the screen off</Text>
            <Text style={styles.toggleSub}>Saves battery and stops the glare at night</Text>
          </View>
          <Toggle value={settings.screenOffEnabled} onValueChange={() => update({ screenOffEnabled: !settings.screenOffEnabled })} />
        </View>

        <View style={styles.lastDriveRow}>
          <View>
            <Text style={styles.kicker}>LAST DRIVE</Text>
            <Text style={styles.lastDriveText}>
              {lastDrive
                ? `${formatRelativeDay(lastDrive.startTs)}, ${formatDuration(lastDrive.durationMs)} — ${lastDrive.summary.toLowerCase()}`
                : 'No drives yet'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.historyLink}>History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PermissionDisclosure visible={showDisclosure} onAllow={allowCamera} onDismiss={() => setShowDisclosure(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 11, height: 11, backgroundColor: colors.accent },
  brandText: { fontFamily: fonts.headingBold, fontSize: 17, letterSpacing: 2, color: colors.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarBtn: { borderRadius: 15 },
  avatar: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.dividerStrong,
    backgroundColor: colors.accentPale, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.headingBold, fontSize: 13, color: colors.accentDark },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  readyCard: { padding: 24, marginBottom: 18 },
  kicker: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 3, color: colors.muted, marginBottom: 10 },
  ready: { fontFamily: fonts.headingBold, fontSize: 56, lineHeight: 56, color: colors.text, marginBottom: 12 },
  readyBody: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20, color: colors.textFaint },
  presetCopy: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textFaint, marginTop: 10, marginBottom: 18, minHeight: 40 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider, marginBottom: 20,
  },
  toggleTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginBottom: 3 },
  toggleSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  lastDriveRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 12 },
  lastDriveText: { fontFamily: fonts.body, fontSize: 14.5, color: colors.text },
  historyLink: { fontFamily: fonts.heading, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text },
});
