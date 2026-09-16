import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Preset } from '../components/ui';
import { DEFAULT_CONFIG, type DetectorConfig } from './detector';

const STORAGE_KEY = 'vigil.settings.v1';
const ONBOARDING_KEY = 'vigil.onboarding-complete.v1';

export interface VigilSettings {
  preset: Preset;
  screenOffEnabled: boolean;
  spokenWarning: boolean;
  siren: boolean;
  vibration: boolean;
}

const DEFAULT_SETTINGS: VigilSettings = {
  preset: 'standard',
  screenOffEnabled: true,
  spokenWarning: true,
  siren: true,
  vibration: true,
};

// The driver-facing UI never shows a threshold number — presets map to the
// underlying detector.ts config here, in one place.
export function configForPreset(preset: Preset): DetectorConfig {
  switch (preset) {
    case 'relaxed':
      return { ...DEFAULT_CONFIG, warnSeconds: 1.6, alarmSeconds: 2.6, nodPitchDelta: 14, nodSeconds: 1.6, yawnsPerMinuteAlarm: 4 };
    case 'strict':
      return { ...DEFAULT_CONFIG, warnSeconds: 0.6, alarmSeconds: 1.2, nodPitchDelta: 8, nodSeconds: 0.8, yawnsPerMinuteAlarm: 2 };
    case 'standard':
    default:
      return DEFAULT_CONFIG;
  }
}

interface SettingsCtx {
  settings: VigilSettings;
  loaded: boolean;
  update: (patch: Partial<VigilSettings>) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VigilSettings>(DEFAULT_SETTINGS);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [rawSettings, rawOnboarding] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      if (rawSettings) {
        try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) }); } catch { /* corrupt — keep defaults */ }
      }
      setOnboardingComplete(rawOnboarding === '1');
      setLoaded(true);
    })();
  }, []);

  const update = (patch: Partial<VigilSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
    AsyncStorage.setItem(ONBOARDING_KEY, '1').catch(() => {});
  };

  return (
    <Ctx.Provider value={{ settings, loaded, update, onboardingComplete, completeOnboarding }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
