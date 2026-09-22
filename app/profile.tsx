import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Btn } from '../components/ui';
import { useAuth } from '../lib/auth';
import { colors, fonts } from '../lib/theme';

export default function ProfileScreen() {
  const { user, updateUsername } = useAuth();
  const savedName = (user?.user_metadata?.username as string) || '';
  const [name, setName] = useState(savedName);
  const [busy, setBusy] = useState(false);

  if (!user) return <Redirect href="/auth/sign-in" />;

  const initial = (savedName || user.email || '?').charAt(0).toUpperCase();
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;
  const dirty = name.trim() !== savedName && name.trim().length > 0;

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    const { error } = await updateUsername(trimmed);
    setBusy(false);
    if (error) Alert.alert('Could not save', error);
    else Alert.alert('Saved', 'Your name has been updated.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 6l-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>

        <Text style={styles.kicker}>NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.mutedSoft}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <Btn
          title={busy ? '…' : 'SAVE NAME'}
          variant="secondary"
          height={50}
          fontSize={13}
          onPress={save}
          disabled={busy || !dirty}
          style={{ marginTop: 12, marginBottom: 28 }}
        />

        <Text style={styles.kicker}>ACCOUNT DETAILS</Text>
        <View style={styles.list}>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{user.email}</Text>
          </View>
          {memberSince && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Member since</Text>
              <Text style={styles.rowValue}>{memberSince}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => router.push('/settings')} style={{ marginTop: 24 }}>
          <Text style={styles.link}>Go to settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 14 },
  headerTitle: { fontFamily: fonts.heading, fontSize: 14, letterSpacing: 2.5, color: colors.text },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  avatarWrap: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  avatar: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: colors.dividerStrong,
    backgroundColor: colors.accentPale, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.headingBold, fontSize: 30, color: colors.accentDark },
  kicker: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 2.5, color: colors.muted, marginBottom: 10 },
  input: {
    height: 52, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface,
    color: colors.text, fontFamily: fonts.body, fontSize: 15, paddingHorizontal: 12,
  },
  list: { borderTopWidth: 1, borderTopColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingVertical: 15 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text },
  rowValue: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  link: { fontFamily: fonts.heading, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.text, textAlign: 'center' },
});
