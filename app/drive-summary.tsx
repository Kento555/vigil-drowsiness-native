import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Blueprint, Btn } from '../components/ui';
import { scoreFor, formatDuration } from '../lib/history';
import { colors, fonts } from '../lib/theme';

type Marker = { offset: number; type: 'alarm' | 'drowsy' };
const BUCKETS = 9;

export default function DriveSummaryScreen() {
  const params = useLocalSearchParams<{ durationMs?: string; alarms?: string; drowsy?: string; markers?: string }>();
  const durationMs = Number(params.durationMs ?? 0);
  const alarms = Number(params.alarms ?? 0);
  const drowsy = Number(params.drowsy ?? 0);
  const markers: Marker[] = useMemo(() => {
    try { return JSON.parse(params.markers ?? '[]'); } catch { return []; }
  }, [params.markers]);

  const score = scoreFor(alarms, drowsy);
  const now = Date.now();
  const startTs = now - durationMs;

  const bars = useMemo(() => {
    const buckets = new Array(BUCKETS).fill('alert') as ('alert' | 'drowsy' | 'alarm')[];
    for (const m of markers) {
      const idx = Math.min(BUCKETS - 1, Math.floor(m.offset * BUCKETS));
      if (m.type === 'alarm') buckets[idx] = 'alarm';
      else if (buckets[idx] !== 'alarm') buckets[idx] = 'drowsy';
    }
    return buckets;
  }, [markers]);

  const tip = alarms > 0
    ? 'An alarm means you need real rest, not just a break. On drives longer than an hour, stop every 45 minutes.'
    : drowsy > 0
    ? 'A couple of drowsy moments is a good early warning. Consider a short break next time you feel this way.'
    : 'You stayed alert the whole way. Keep the same rest schedule before your next drive.';

  const summarySentence = alarms > 0
    ? `${alarms} alarm${alarms > 1 ? 's' : ''}${drowsy > 0 ? ` and ${drowsy} drowsy moment${drowsy > 1 ? 's' : ''}` : ''}, mostly later in the drive.`
    : drowsy > 0
    ? `${drowsy} drowsy moment${drowsy > 1 ? 's' : ''}, no full alarms.`
    : 'No drowsy moments at all.';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.kicker}>DRIVE FINISHED · {formatDuration(durationMs).toUpperCase()}</Text>
        <Text style={styles.headline}>You were alert for {score}% of this drive.</Text>

        <Blueprint style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreKicker}>ALERTNESS SCORE</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          <Text style={styles.scoreSentence}>{summarySentence}</Text>
        </Blueprint>

        <Text style={styles.kicker}>WHEN IT HAPPENED</Text>
        <View style={styles.timeline}>
          <View style={styles.bars}>
            {bars.map((b, i) => (
              <View key={i} style={[styles.bar, { height: `${barHeight(b)}%`, backgroundColor: barColor(b) }]} />
            ))}
          </View>
          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>{fmtTime(startTs)}</Text>
            <Text style={styles.timeLabel}>{fmtTime(startTs + durationMs / 2)}</Text>
            <Text style={styles.timeLabel}>{fmtTime(now)}</Text>
          </View>
        </View>

        <View style={styles.legend}>
          <LegendDot color={colors.alarm} label="Alarm" />
          <LegendDot color={colors.accentLight} label="Drowsy" />
          <LegendDot color={colors.accentLighter} label="Alert" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.tip}>{tip}</Text>
          <Btn title="DONE" variant="primary" height={60} fontSize={16} onPress={() => router.replace('/')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function barHeight(kind: 'alert' | 'drowsy' | 'alarm') {
  return kind === 'alarm' ? 88 : kind === 'drowsy' ? 46 : 24;
}
function barColor(kind: 'alert' | 'drowsy' | 'alarm') {
  return kind === 'alarm' ? colors.alarm : kind === 'drowsy' ? colors.accentLight : colors.accentLighter;
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 },
  kicker: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 2.5, color: colors.muted, marginBottom: 8 },
  headline: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 34, color: colors.text, marginBottom: 20 },
  scoreCard: { flexDirection: 'row', alignItems: 'flex-end', gap: 20, padding: 22, marginBottom: 20 },
  scoreKicker: { fontFamily: fonts.heading, fontSize: 10, letterSpacing: 2.5, color: colors.muted, marginBottom: 8 },
  scoreValue: { fontFamily: fonts.headingBold, fontSize: 66, lineHeight: 60, color: colors.accentDark },
  scoreSentence: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20, color: colors.textFaint },
  timeline: { borderWidth: 1, borderColor: colors.divider, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12, marginBottom: 16 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 72 },
  bar: { flex: 1 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeLabel: { fontFamily: fonts.heading, fontSize: 10, letterSpacing: 1.5, color: colors.muted },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 'auto', paddingBottom: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 9, height: 9 },
  legendText: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  footer: { paddingTop: 4, gap: 12 },
  tip: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: colors.textFaint },
});
