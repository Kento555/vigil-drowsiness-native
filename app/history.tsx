import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, Redirect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Blueprint } from '../components/ui';
import { useAuth } from '../lib/auth';
import { fetchRecentEvents, type RemoteEvent } from '../lib/supabase';
import { computeDriveSessions, computeHourlyRisk, riskiestHourLabel, formatDuration, formatRelativeDay } from '../lib/history';
import { colors, fonts } from '../lib/theme';

const HOUR_TICKS = ['12 AM', '6 AM', '12 PM', '6 PM'];

export default function HistoryScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<RemoteEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchRecentEvents(user.id, 500).then(e => { setEvents(e); setLoading(false); });
  }, [user]);

  const sessions = useMemo(() => computeDriveSessions(events, 10), [events]);
  const hourly = useMemo(() => computeHourlyRisk(events), [events]);
  const riskLabel = useMemo(() => riskiestHourLabel(hourly), [hourly]);
  const bars = useMemo(() => bucketHourly(hourly), [hourly]);

  if (!user) return <Redirect href="/auth/sign-in" />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M14 6l-6 6 6 6" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HISTORY</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.headline}>
          {riskLabel ? `Your risky hours are around ${riskLabel}.` : 'Drive a bit more to see your pattern.'}
        </Text>
        <Text style={styles.sub}>
          {sessions.length > 0
            ? `Based on ${sessions.length} drive${sessions.length === 1 ? '' : 's'}${sessions.length >= 10 ? ' or more' : ''}.`
            : 'No drives recorded yet.'}
        </Text>

        <Blueprint style={styles.chartCard}>
          <View style={styles.barsRow}>
            {bars.map((h, i) => (
              <View key={i} style={[styles.bar, { height: `${Math.max(6, h * 100)}%` }]} />
            ))}
          </View>
          <View style={styles.tickRow}>
            {HOUR_TICKS.map(t => <Text key={t} style={styles.tick}>{t}</Text>)}
          </View>
        </Blueprint>

        <Text style={styles.kicker}>RECENT DRIVES</Text>
        <View style={styles.list}>
          {sessions.map((s, i) => (
            <View key={s.id} style={[styles.row, i < sessions.length - 1 && styles.rowDivider]}>
              <Text style={[styles.rowScore, { color: s.score < 70 ? colors.alarm : colors.accentDark }]}>{s.score}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{formatRelativeDay(s.startTs)} · {formatDuration(s.durationMs)}</Text>
                <Text style={styles.rowSub}>{s.summary}</Text>
              </View>
            </View>
          ))}
          {!loading && sessions.length === 0 && (
            <Text style={styles.empty}>Start watching on a drive to build your history.</Text>
          )}
        </View>

        <Text style={styles.footnote}>Scores are a rough guide to how you drove, not a medical measurement.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function bucketHourly(hourly: number[], buckets = 12): number[] {
  const perBucket = 24 / buckets;
  const out: number[] = [];
  for (let i = 0; i < buckets; i++) {
    let sum = 0;
    for (let h = Math.floor(i * perBucket); h < Math.floor((i + 1) * perBucket); h++) sum += hourly[h] ?? 0;
    out.push(sum);
  }
  const max = Math.max(1, ...out);
  return out.map(v => v / max);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingVertical: 14 },
  headerTitle: { fontFamily: fonts.heading, fontSize: 14, letterSpacing: 2.5, color: colors.text },
  body: { paddingHorizontal: 24, paddingBottom: 24 },
  headline: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 32, color: colors.text, marginBottom: 6 },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginBottom: 20 },
  chartCard: { padding: 16, paddingTop: 18, paddingBottom: 14, marginBottom: 22 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 104 },
  bar: { flex: 1, backgroundColor: colors.accent },
  tickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  tick: { fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.2, color: colors.muted },
  kicker: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 2.5, color: colors.muted, marginBottom: 4 },
  list: { borderTopWidth: 1, borderTopColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowScore: { fontFamily: fonts.headingBold, fontSize: 26, width: 42 },
  rowTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.text, marginBottom: 3 },
  rowSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  empty: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, paddingVertical: 24, textAlign: 'center' },
  footnote: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 8, marginBottom: 20 },
});
