# VIGIL/03 — Native Android App

React Native (Expo) version of VIGIL for Play Store distribution.
Uses **ML Kit Face Detection** via `react-native-vision-camera` instead of MediaPipe.

## Key differences from the web version

| Feature | Web (PWA) | Native (this) |
|---|---|---|
| Detection | MediaPipe (EAR/MAR) | ML Kit eye open probability |
| Camera | Browser getUserMedia | react-native-vision-camera |
| Background | Not supported (browser limit) | Possible with native service |
| Distribution | PWA / browser | Google Play Store |
| Alarm | Web Audio API | expo-av + expo-haptics |

## Setup

```bash
cp .env.example .env.local   # fill in Supabase keys
npm install
```

## Run on device

```bash
# Android (requires Android Studio + device/emulator)
npx expo run:android

# iOS (requires Xcode + Mac)
npx expo run:ios

# Expo Go (limited — vision camera won't work in Expo Go)
npx expo start
```

## Build for Play Store

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

Then submit via `eas submit` or upload the AAB manually on Google Play Console.

## Project structure

```
app/
  _layout.tsx         # Root layout + AuthProvider
  index.tsx           # Main detector screen
  stats.tsx           # Stats screen
  settings.tsx        # Settings screen
  auth/
    sign-in.tsx       # Sign in / Sign up screen
lib/
  supabase.ts         # Supabase client + event sync
  auth.tsx            # Auth context
  detector.ts         # Drowsiness algorithm (ML Kit based)
  alarm.ts            # expo-av + expo-haptics alarm
```
