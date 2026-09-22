import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { useRunOnJS } from 'react-native-worklets-core';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { Blueprint, Btn } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useSettings, configForPreset } from '../lib/settings';
import { DrowsinessDetector, type DetectionState, type EventCause } from '../lib/detector';
import { startAlarm, stopAlarm } from '../lib/alarm';
import { syncEvent } from '../lib/supabase';
import { colors, fonts } from '../lib/theme';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const DEVICE_LABEL = 'Vigil';
const POCKET_AUTO_HIDE_MS = 8000;

type FaceData = { leftEye: number; rightEye: number; mouth: number; pitch: number; yaw: number };

export default function WatchScreen() {
  const { user } = useAuth();
  const { settings } = useSettings();
  useKeepAwake();

  const [faceFound, setFaceFound] = useState(false);
  const [state, setState] = useState<DetectionState>('calibrating');
  const [screenOff, setScreenOff] = useState(false);
  const [pocketRevealed, setPocketRevealed] = useState(false);
  const [dismissStep, setDismissStep] = useState(0);
  const [elapsedMin, setElapsedMin] = useState(0);

  const device = useCameraDevice('front');
  const detectorRef = useRef(new DrowsinessDetector(configForPreset(settings.preset)));
  const lastStateRef = useRef<DetectionState>('calibrating');
  const startTsRef = useRef(Date.now());
  const alarmsRef = useRef(0);
  const drowsyRef = useRef(0);
  const markersRef = useRef<{ t: number; type: 'alarm' | 'drowsy' }[]>([]);
  const alarmActiveRef = useRef(false);
  const pocketTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    detectorRef.current.reset();
    startTsRef.current = Date.now();
    if (user) syncEvent({ id: uuid(), ts: Date.now(), type: 'session_start' }, user.id, DEVICE_LABEL).catch(() => {});

    const tick = setInterval(() => setElapsedMin(Math.floor((Date.now() - startTsRef.current) / 60000)), 15000);
    return () => clearInterval(tick);
  }, []);

  const dispatch = useCallback((type: 'drowsy' | 'alarm', cause: EventCause | null, durationMs?: number) => {
    if (type === 'alarm') alarmsRef.current++;
    if (type === 'drowsy') drowsyRef.current++;
    markersRef.current.push({ t: Date.now(), type });
    if (user) syncEvent({ id: uuid(), ts: Date.now(), type, cause, durationMs }, user.id, DEVICE_LABEL).catch(() => {});
  }, [user]);

  const lastPitchLogRef = useRef(0);

  const handleFaceData = useCallback((data: FaceData | null) => {
    setFaceFound(!!data);
    if (!data) return;
    const now = Date.now();
    const update = detectorRef.current.update({
      leftEyeOpenProbability: data.leftEye,
      rightEyeOpenProbability: data.rightEye,
      mouthOpenProbability: data.mouth,
      pitchAngle: data.pitch,
      yawAngle: data.yaw,
    }, now);

    if (now - lastPitchLogRef.current > 300) {
      lastPitchLogRef.current = now;
      console.log('[watch] pitch', { rawPitch: data.pitch, pitchDelta: update.pitchDelta, nodMs: update.nodMs, state: update.state });
    }

    const prev = lastStateRef.current;
    const cur = update.state;
    if (prev === cur) return;
    setState(cur);
    lastStateRef.current = cur;

    if (cur === 'alarm' && !alarmActiveRef.current) {
      alarmActiveRef.current = true;
      startAlarm(update.cause, settings);
      dispatch('alarm', update.cause);
    }
    if (cur === 'drowsy' && prev === 'alert') {
      dispatch('drowsy', update.cause);
    }
    if (cur === 'alert' && alarmActiveRef.current) {
      stopAlarm();
      alarmActiveRef.current = false;
      setDismissStep(0);
    }
  }, [dispatch, settings]);

  const { detectFaces } = useFaceDetector({ performanceMode: 'fast', classificationMode: 'all', trackingEnabled: true });
  const handleFaceDataJS = useRunOnJS(handleFaceData, [handleFaceData]);

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const faces = detectFaces(frame);
    if (!faces.length) { handleFaceDataJS(null); return; }
    const face = faces[0];
    handleFaceDataJS({
      leftEye: face.leftEyeOpenProbability ?? 1,
      rightEye: face.rightEyeOpenProbability ?? 1,
      // ML Kit's Face type has no mouth-openness field, so yawn detection
      // (lib/detector.ts's yawnThreshold) never actually triggers today.
      mouth: 0,
      pitch: face.pitchAngle ?? 0,
      yaw: face.yawAngle ?? 0,
    });
  }, [handleFaceDataJS]);

  const stopWatching = useCallback(async () => {
    if (alarmActiveRef.current) { await stopAlarm(); alarmActiveRef.current = false; }
    if (user) syncEvent({ id: uuid(), ts: Date.now(), type: 'session_end' }, user.id, DEVICE_LABEL).catch(() => {});
    const durationMs = Date.now() - startTsRef.current;
    const markers = markersRef.current.map(m => ({
      offset: durationMs > 0 ? Math.min(1, Math.max(0, (m.t - startTsRef.current) / durationMs)) : 0,
      type: m.type,
    }));
    router.replace({
      pathname: '/drive-summary',
      params: {
        durationMs: String(durationMs),
        alarms: String(alarmsRef.current),
        drowsy: String(drowsyRef.current),
        markers: JSON.stringify(markers),
      },
    });
  }, [user]);

  const revealPocket = () => {
    setPocketRevealed(true);
    if (pocketTimerRef.current) clearTimeout(pocketTimerRef.current);
    pocketTimerRef.current = setTimeout(() => setPocketRevealed(false), POCKET_AUTO_HIDE_MS);
  };

  useEffect(() => () => { if (pocketTimerRef.current) clearTimeout(pocketTimerRef.current); }, []);

  const tapDismiss = () => {
    if (dismissStep === 0) { setDismissStep(1); return; }
    stopAlarm();
    alarmActiveRef.current = false;
    setDismissStep(0);
    setState('alert');
    lastStateRef.current = 'alert';
  };

  if (!user) return <Redirect href="/auth/sign-in" />;

  const lookLabel = state === 'drowsy' ? 'DROWSY' : state === 'calibrating' ? 'CHECKING' : 'ALERT';
  const sentence = state === 'drowsy'
    ? 'Your eyes are drooping. Sit up and get some air if you can.'
    : state === 'calibrating'
    ? 'Finding your baseline. Keep your eyes on the road.'
    : `Eyes open, head steady. Watching for ${elapsedMin} minute${elapsedMin === 1 ? '' : 's'}.`;

  // Pocket/alarm modes render as overlays, not alternate returns — the camera
  // and its frame processor must stay mounted or detection stops dead.
  return (
    <>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.dot} />
          <Text style={styles.brandText}>VIGIL</Text>
        </View>
        <View style={styles.watchingChip}>
          <Text style={styles.watchingChipText}>WATCHING</Text>
        </View>
      </View>

      <Blueprint style={styles.previewFrame} cornerColor="rgba(242,242,243,0.55)">
        {device ? (
          <Camera style={StyleSheet.absoluteFill} device={device} isActive frameProcessor={frameProcessor} pixelFormat="yuv" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.previewFallback]} />
        )}
        <View pointerEvents="none" style={styles.previewShade} />
        <Text style={styles.previewLabel}>{faceFound ? 'EYES FOUND' : 'LOOKING FOR YOUR FACE'}</Text>
        <View style={styles.previewCaption}>
          <Text style={styles.previewCaptionText}>Preview only — nothing is recorded</Text>
        </View>
      </Blueprint>

      <View style={styles.body}>
        <Text style={styles.kicker}>YOU LOOK</Text>
        <Text style={styles.lookLabel}>{lookLabel}</Text>
        <Text style={styles.sentence}>{sentence}</Text>

        <View style={styles.actions}>
          <Btn
            title="Turn the screen off"
            variant="secondary"
            height={64}
            fontSize={16}
            onPress={() => { setScreenOff(true); setPocketRevealed(false); }}
            icon={
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5} strokeLinecap="round">
                <Rect x={5} y={2.5} width={14} height={19} />
                <Path d="M10 18.5h4" />
              </Svg>
            }
            style={{ marginBottom: 10 }}
          />
          <Btn title="Stop watching" variant="secondary" height={56} fontSize={15} onPress={stopWatching} />
        </View>
      </View>
    </SafeAreaView>
    {screenOff && (
      <View style={StyleSheet.absoluteFill}>
        <PocketMode
          revealed={pocketRevealed}
          onTap={revealPocket}
          state={state}
          elapsedMin={elapsedMin}
          drowsyCount={drowsyRef.current}
          onKeepWatching={() => setPocketRevealed(false)}
          onStop={stopWatching}
        />
      </View>
    )}
    {state === 'alarm' && (
      <View style={StyleSheet.absoluteFill}>
        <AlarmOverlay dismissStep={dismissStep} onTap={tapDismiss} />
      </View>
    )}
    </>
  );
}

function PocketMode({
  revealed, onTap, state, elapsedMin, drowsyCount, onKeepWatching, onStop,
}: {
  revealed: boolean; onTap: () => void; state: DetectionState; elapsedMin: number;
  drowsyCount: number; onKeepWatching: () => void; onStop: () => void;
}) {
  if (!revealed) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onTap} style={styles.pocketDim}>
        <SafeAreaView style={styles.pocketDimInner} edges={['top', 'bottom']}>
          <View style={styles.pocketPulseWrap}>
            <View style={styles.pocketPulse} />
            <Text style={styles.pocketWatching}>WATCHING</Text>
          </View>
          <Text style={styles.pocketHint}>Tap anywhere to check</Text>
        </SafeAreaView>
      </TouchableOpacity>
    );
  }
  const lookLabel = state === 'drowsy' ? 'DROWSY' : 'ALERT';
  return (
    <View style={styles.pocketDim}>
      <SafeAreaView style={styles.pocketRevealed} edges={['top', 'bottom']}>
        <View style={styles.pocketHeader}>
          <View style={styles.pocketDot} />
          <Text style={styles.pocketBrand}>VIGIL</Text>
          <View style={styles.pocketBadge}>
            <Text style={styles.pocketBadgeText}>SCREEN OFF</Text>
          </View>
        </View>
        <Text style={styles.pocketKicker}>YOU LOOK</Text>
        <Text style={styles.pocketLook}>{lookLabel}</Text>
        <Text style={styles.pocketSentence}>
          Watching for {elapsedMin} minute{elapsedMin === 1 ? '' : 's'}.{' '}
          {drowsyCount === 0 ? 'No drowsy moments so far.' : `${drowsyCount} drowsy moment${drowsyCount === 1 ? '' : 's'} so far.`}
        </Text>
        <View style={styles.pocketActions}>
          <Btn title="Keep watching" variant="secondary" height={64} fontSize={15} textStyle={{ color: colors.onDark }} style={styles.pocketBtn} onPress={onKeepWatching} />
          <Btn title="Stop" variant="secondary" height={64} fontSize={15} textStyle={{ color: colors.onDark }} style={[styles.pocketBtn, styles.pocketBtnFilled]} onPress={onStop} />
        </View>
        <Text style={styles.pocketAutoHide}>Going dark again in 8 seconds</Text>
      </SafeAreaView>
    </View>
  );
}

function AlarmOverlay({ dismissStep, onTap }: { dismissStep: number; onTap: () => void }) {
  const label = dismissStep === 0 ? "I'm awake" : 'Yes — I am awake and pulling over';
  const hint = dismissStep === 0 ? 'Silencing needs a second tap' : 'Tap again to silence the alarm';
  return (
    <SafeAreaView style={styles.alarmContainer} edges={['top', 'bottom']}>
      <View style={styles.alarmBody}>
        <View style={styles.alarmHeader}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.5} strokeLinecap="round">
            <Path d="M12 3.5l9 16H3l9-16z" />
            <Path d="M12 9.5v5M12 17.2v.3" />
          </Svg>
          <Text style={styles.alarmKicker}>VIGIL · WAKE ALARM</Text>
        </View>
        <Text style={styles.alarmTitle}>WAKE{'\n'}UP</Text>
        <Text style={styles.alarmSub}>Pull over as soon as it is safe.</Text>
        <Text style={styles.alarmBodyText}>
          Your eyes were closed for longer than they should be. A short sleep is the only thing
          that fixes this.
        </Text>
        <View style={styles.alarmFooter}>
          <View style={styles.alarmModeRow}>
            <View style={styles.alarmDot} />
            <Text style={styles.alarmModeText}>Speaking aloud · siren · vibrating</Text>
          </View>
          <TouchableOpacity
            onPress={onTap}
            style={[styles.alarmDismiss, { height: dismissStep === 0 ? 72 : 84, backgroundColor: dismissStep === 0 ? 'transparent' : '#fff' }]}
          >
            <Text style={[styles.alarmDismissText, { color: dismissStep === 0 ? '#fff' : colors.alarm }]}>{label.toUpperCase()}</Text>
          </TouchableOpacity>
          <Text style={styles.alarmDismissHint}>{hint}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 24, paddingTop: 6, paddingBottom: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 11, height: 11, backgroundColor: colors.accent },
  brandText: { fontFamily: fonts.headingBold, fontSize: 17, letterSpacing: 2, color: colors.text },
  watchingChip: { marginLeft: 'auto', borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 9, paddingVertical: 6 },
  watchingChipText: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.5, color: colors.accentDark },
  previewFrame: { marginHorizontal: 24, aspectRatio: 4 / 3, backgroundColor: colors.accentDarker, overflow: 'hidden' },
  previewFallback: { backgroundColor: colors.accentDarker },
  previewShade: { ...StyleSheet.absoluteFill },
  previewLabel: {
    position: 'absolute', left: '10%', bottom: '30%', fontFamily: fonts.heading, fontSize: 10,
    letterSpacing: 2, color: colors.accentLighter,
  },
  previewCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingVertical: 12 },
  previewCaptionText: { fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(242,242,243,0.7)' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 22 },
  kicker: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 3, color: colors.muted, marginBottom: 8 },
  lookLabel: { fontFamily: fonts.headingBold, fontSize: 64, lineHeight: 64, color: colors.accentDark, marginBottom: 12 },
  sentence: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: colors.text, maxWidth: 300, marginBottom: 22 },
  actions: { marginTop: 'auto', paddingBottom: 22 },

  pocketDim: { flex: 1, backgroundColor: colors.steelFieldDeep },
  pocketDimInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 },
  pocketPulseWrap: { alignItems: 'center', gap: 22 },
  pocketPulse: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accentLight },
  pocketWatching: { fontFamily: fonts.heading, fontSize: 12, letterSpacing: 6, color: colors.accentLighter },
  pocketHint: { position: 'absolute', bottom: 40, fontFamily: fonts.body, fontSize: 13, color: colors.onDarkMuted },
  pocketRevealed: { flex: 1, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 34 },
  pocketHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 'auto' },
  pocketDot: { width: 11, height: 11, backgroundColor: colors.accentLight },
  pocketBrand: { fontFamily: fonts.headingBold, fontSize: 16, letterSpacing: 2, color: colors.onDark },
  pocketBadge: { marginLeft: 'auto', borderWidth: 1, borderColor: colors.onDarkDivider, paddingHorizontal: 9, paddingVertical: 6 },
  pocketBadgeText: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 1.5, color: colors.accentLighter },
  pocketKicker: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 3, color: colors.onDarkMuted, marginBottom: 8, marginTop: 40 },
  pocketLook: { fontFamily: fonts.headingBold, fontSize: 60, lineHeight: 60, color: colors.onDark, marginBottom: 14 },
  pocketSentence: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22, color: 'rgba(242,242,243,0.8)', marginBottom: 24 },
  pocketActions: { flexDirection: 'row', gap: 10, marginTop: 'auto' },
  pocketBtn: { flex: 1, borderColor: colors.onDarkDivider },
  pocketBtnFilled: { backgroundColor: 'rgba(242,242,243,0.1)' },
  pocketAutoHide: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, color: colors.onDarkMuted, marginTop: 16 },

  alarmContainer: { flex: 1, backgroundColor: colors.alarm },
  alarmBody: { flex: 1, paddingHorizontal: 26, paddingTop: 20 },
  alarmHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 26 },
  alarmKicker: { fontFamily: fonts.heading, fontSize: 12, letterSpacing: 3, color: 'rgba(255,255,255,0.9)' },
  alarmTitle: { fontFamily: fonts.headingBold, fontSize: 76, lineHeight: 72, color: '#fff', marginBottom: 16 },
  alarmSub: { fontFamily: fonts.bodySemiBold, fontSize: 22, lineHeight: 28, color: '#fff', marginBottom: 10 },
  alarmBodyText: { fontFamily: fonts.body, fontSize: 15.5, lineHeight: 22, color: 'rgba(255,255,255,0.8)' },
  alarmFooter: { marginTop: 'auto', paddingBottom: 24 },
  alarmModeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  alarmDot: { width: 8, height: 8, backgroundColor: '#fff' },
  alarmModeText: { fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.75)' },
  alarmDismiss: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  alarmDismissText: { fontFamily: fonts.heading, fontSize: 18, letterSpacing: 1 },
  alarmDismissHint: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 14 },
});
