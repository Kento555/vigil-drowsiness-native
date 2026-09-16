import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import type { EventCause } from './detector';
import type { VigilSettings } from './settings';

let sound: AudioPlayer | null = null;
let hapticInterval: ReturnType<typeof setInterval> | null = null;
let speechInterval: ReturnType<typeof setInterval> | null = null;

const SPOKEN_WARNING = 'Wake up. Pull over as soon as it is safe.';

export async function startAlarm(cause: EventCause | null, settings?: Pick<VigilSettings, 'siren' | 'vibration' | 'spokenWarning'>) {
  const { siren = true, vibration = true, spokenWarning = true } = settings ?? {};

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });

  if (vibration) {
    hapticInterval = setInterval(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, 800);
  }

  if (siren) {
    try {
      const s = createAudioPlayer('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      s.loop = true;
      s.volume = 1.0;
      s.play();
      sound = s;
    } catch {
      // Haptics/speech still run if the siren fails to load
    }
  }

  if (spokenWarning) {
    Speech.speak(SPOKEN_WARNING, { rate: 0.95 });
    speechInterval = setInterval(() => Speech.speak(SPOKEN_WARNING, { rate: 0.95 }), 6000);
  }
}

export async function stopAlarm() {
  if (hapticInterval) {
    clearInterval(hapticInterval);
    hapticInterval = null;
  }
  if (speechInterval) {
    clearInterval(speechInterval);
    speechInterval = null;
  }
  Speech.stop();
  if (sound) {
    try {
      sound.pause();
      sound.remove();
    } catch {
      // Sound may never have finished loading; nothing to clean up.
    }
    sound = null;
  }
}

export async function triggerHaptic() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
