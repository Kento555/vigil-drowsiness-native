import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import type { EventCause } from './detector';
import type { VigilSettings } from './settings';

let sound: Audio.Sound | null = null;
let hapticInterval: ReturnType<typeof setInterval> | null = null;
let speechInterval: ReturnType<typeof setInterval> | null = null;

const SPOKEN_WARNING = 'Wake up. Pull over as soon as it is safe.';

export async function startAlarm(cause: EventCause | null, settings?: Pick<VigilSettings, 'siren' | 'vibration' | 'spokenWarning'>) {
  const { siren = true, vibration = true, spokenWarning = true } = settings ?? {};

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });

  if (vibration) {
    hapticInterval = setInterval(async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, 800);
  }

  if (siren) {
    try {
      const { sound: s } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
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
    await sound.stopAsync();
    await sound.unloadAsync();
    sound = null;
  }
}

export async function triggerHaptic() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
