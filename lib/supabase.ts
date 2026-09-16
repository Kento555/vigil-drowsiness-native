import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function isCloudConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export interface VigilEvent {
  id: string;
  ts: number;
  type: 'session_start' | 'session_end' | 'calibrated' | 'drowsy' | 'alarm';
  cause?: 'eyes' | 'yawn' | 'nod' | null;
  durationMs?: number;
}

export interface RemoteEvent {
  id: string;
  user_id: string;
  device_label: string;
  ts: string;
  type: string;
  cause: string | null;
  duration_ms: number | null;
}

export interface UserStats {
  alarms: number;
  drowsy: number;
  sessions: number;
  eye_events: number;
  yawns: number;
  nods: number;
}

export async function syncEvent(e: VigilEvent, userId: string, deviceLabel: string): Promise<boolean> {
  const { error } = await supabase.from('vigil_events').insert({
    id: e.id,
    user_id: userId,
    device_label: deviceLabel,
    ts: new Date(e.ts).toISOString(),
    type: e.type,
    cause: e.cause ?? null,
    duration_ms: e.durationMs ?? null,
  });
  return !error;
}

export async function fetchRecentEvents(userId: string, limit = 200): Promise<RemoteEvent[]> {
  const { data, error } = await supabase
    .from('vigil_events')
    .select('*')
    .eq('user_id', userId)
    .order('ts', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as RemoteEvent[];
}

export async function fetchUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return {
    alarms: Number(data.alarms ?? 0),
    drowsy: Number(data.drowsy ?? 0),
    sessions: Number(data.sessions ?? 0),
    eye_events: Number(data.eye_events ?? 0),
    yawns: Number(data.yawns ?? 0),
    nods: Number(data.nods ?? 0),
  };
}
