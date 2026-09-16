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

export function scoreFor(alarms: number, drowsy: number): number {
  return Math.max(0, Math.min(100, 100 - alarms * 15 - drowsy * 8));
}

// Sessions aren't stored as rows — they're reconstructed from the
// session_start/session_end/drowsy/alarm event stream each device syncs.
export function computeDriveSessions(events: RemoteEvent[], limit = 20): DriveSession[] {
  const sorted = [...events].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  const sessions: DriveSession[] = [];
  let open: { startTs: number; alarms: number; drowsy: number } | null = null;

  const close = (endTs: number) => {
    if (!open) return;
    const score = scoreFor(open.alarms, open.drowsy);
    sessions.push({
      id: `${open.startTs}`,
      startTs: open.startTs,
      endTs,
      durationMs: Math.max(0, endTs - open.startTs),
      alarms: open.alarms,
      drowsy: open.drowsy,
      score,
      summary: summarize(open.alarms, open.drowsy),
    });
    open = null;
  };

  for (const e of sorted) {
    const ts = new Date(e.ts).getTime();
    if (e.type === 'session_start') {
      if (open) close(ts); // missing end — close it out at the next start
      open = { startTs: ts, alarms: 0, drowsy: 0 };
    } else if (e.type === 'session_end') {
      close(ts);
    } else if (open && e.type === 'alarm') {
      open.alarms++;
    } else if (open && e.type === 'drowsy') {
      open.drowsy++;
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
