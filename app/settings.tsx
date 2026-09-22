import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { PresetSegmented, Toggle, PRESET_COPY } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useSettings } from '../lib/settings';
import { colors, fonts } from '../lib/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { settings, update } = useSettings();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/auth/sign-in'); } },
    ]);
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
        <Text style={styles.headerTitle}>SETTINGS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.kicker}>HOW SOON TO WAKE YOU</Text>
        <PresetSegmented value={settings.preset} onChange={p => update({ preset: p })} height={52} fontSize={12.5} />
        <Text style={styles.presetCopy}>{PRESET_COPY[settings.preset]}</Text>

        <Text style={styles.kicker}>HOW TO WAKE YOU</Text>
        <View style={styles.list}>
          <SettingRow title="Spoken warning" sub={'"Pull over and rest"'}>
            <Toggle value={settings.spokenWarning} onValueChange={() => update({ spokenWarning: !settings.spokenWarning })} />
          </SettingRow>
          <SettingRow title="Siren" sub="Plays over music at full volume">
            <Toggle value={settings.siren} onValueChange={() => update({ siren: !settings.siren })} />
          </SettingRow>
          <SettingRow title="Vibration" sub="Useful if the phone is in a cradle">
            <Toggle value={settings.vibration} onValueChange={() => update({ vibration: !settings.vibration })} />
          </SettingRow>
          <SettingRow title="Watch with the screen off" sub="Keeps a notification showing while active" last>
            <Toggle value={settings.screenOffEnabled} onValueChange={() => update({ screenOffEnabled: !settings.screenOffEnabled })} />
          </SettingRow>
        </View>

        <Text style={styles.kicker}>ACCOUNT</Text>
        <View style={styles.list}>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowTitle}>{user.email}</Text>
            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={styles.link}>Privacy</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.row, styles.rowDivider]} onPress={() => router.push('/privacy')}>
            <Text style={[styles.rowTitle, { color: colors.alarm }]}>Delete my account and data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Text style={styles.rowTitle}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>Vigil 3.0 · assistive only. Never rely on it alone to stay awake.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ title, sub, children, last }: { title: string; sub: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 14 },
  headerTitle: { fontFamily: fonts.heading, fontSize: 14, letterSpacing: 2.5, color: colors.text },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  kicker: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 2.5, color: colors.muted, marginBottom: 10, marginTop: 4 },
  presetCopy: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: colors.textFaint, marginTop: 10, marginBottom: 20, minHeight: 38 },
  list: { borderTopWidth: 1, borderTopColor: colors.divider, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 15 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginBottom: 2 },
  rowSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  link: { fontFamily: fonts.heading, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.text },
  footnote: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: colors.muted, textAlign: 'center', marginTop: 20, marginBottom: 16 },
});
