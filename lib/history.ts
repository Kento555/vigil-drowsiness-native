import type { RemoteEvent } from './supabase';

export interface DriveSession {
  id: string;
  startTs: number;
  endTs: number;
  durationMs: number;
  alarms: number;
  drowsy: number;
  score: number;
  summary: string;
}

export type BucketState = 'alert' | 'drowsy' | 'alarm';

// Buckets a set of drowsy/alarm markers (offset 0..1 through the drive) into
// `bucketCount` time slots, each holding the worst state seen in that slot.
export function bucketizeOffsets(
  events: { offset: number; type: 'drowsy' | 'alarm' }[],
  bucketCount = 9
): BucketState[] {
  const buckets = new Array(bucketCount).fill('alert') as BucketState[];
  for (const e of events) {
    const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor(e.offset * bucketCount)));
    if (e.type === 'alarm') buckets[idx] = 'alarm';
    else if (buckets[idx] !== 'alarm') buckets[idx] = 'drowsy';
  }
  return buckets;
}

// The alertness score is the share of the drive's timeline that stayed
// alert — same buckets the Drive Summary timeline renders, so the headline
// percentage always agrees with what the chart shows.
export function alertPercent(buckets: BucketState[]): number {
  if (buckets.length === 0) return 100;
  const alertCount = buckets.filter(b => b === 'alert').length;
  return Math.round((alertCount / buckets.length) * 100);
}

// Sessions aren't stored as rows — they're reconstructed from the
// session_start/session_end/drowsy/alarm event stream each device syncs.
export function computeDriveSessions(events: RemoteEvent[], limit = 20): DriveSession[] {
  const sorted = [...events].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  const sessions: DriveSession[] = [];
  let open: { startTs: number; alarms: number; drowsy: number; marks: { ts: number; type: 'drowsy' | 'alarm' }[] } | null = null;

  const close = (endTs: number) => {
    if (!open) return;
    const durationMs = Math.max(1, endTs - open.startTs);
    const buckets = bucketizeOffsets(
      open.marks.map(m => ({ offset: Math.min(1, Math.max(0, (m.ts - open!.startTs) / durationMs)), type: m.type }))
    );
    sessions.push({
      id: `${open.startTs}`,
      startTs: open.startTs,
      endTs,
      durationMs: Math.max(0, endTs - open.startTs),
      alarms: open.alarms,
      drowsy: open.drowsy,
      score: alertPercent(buckets),
      summary: summarize(open.alarms, open.drowsy),
    });
    open = null;
  };

  for (const e of sorted) {
    const ts = new Date(e.ts).getTime();
    if (e.type === 'session_start') {
      if (open) close(ts); // missing end — close it out at the next start
      open = { startTs: ts, alarms: 0, drowsy: 0, marks: [] };
    } else if (e.type === 'session_end') {
      close(ts);
    } else if (open && e.type === 'alarm') {
      open.alarms++;
      open.marks.push({ ts, type: 'alarm' });
    } else if (open && e.type === 'drowsy') {
      open.drowsy++;
      open.marks.push({ ts, type: 'drowsy' });
    }
  }

  return sessions.sort((a, b) => b.startTs - a.startTs).slice(0, limit);
}

function summarize(alarms: number, drowsy: number): string {
  if (alarms >= 3) return `${alarms} alarms — you were very tired`;
  if (alarms >= 1) return `${alarms} alarm${alarms > 1 ? 's' : ''} — pull over sooner next time`;
  if (drowsy >= 1) return `${drowsy} drowsy moment${drowsy > 1 ? 's' : ''} near the end`;
  return 'Stayed alert the whole way';
}

// 24 hourly buckets (local time) of drowsy+alarm events, used for the
// "risky hours" chart. Index 0 = midnight.
export function computeHourlyRisk(events: RemoteEvent[]): number[] {
  const buckets = new Array(24).fill(0);
  for (const e of events) {
    if (e.type !== 'drowsy' && e.type !== 'alarm') continue;
    const hour = new Date(e.ts).getHours();
    buckets[hour] += e.type === 'alarm' ? 2 : 1;
  }
  return buckets;
}

export function riskiestHourLabel(buckets: number[]): string | null {
  const max = Math.max(...buckets);
  if (max <= 0) return null;
  const hour = buckets.indexOf(max);
  const period = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${period}`;
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function formatRelativeDay(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
