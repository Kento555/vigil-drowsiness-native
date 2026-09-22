import type { ExpoConfig, ConfigContext } from 'expo/config';

// Only the "production" EAS build profile (eas.json) should ever produce the
// real com.vigil.drowsiness identity that's registered with the Play Store.
// Everything else — including unset APP_VARIANT from a bare `expo start` /
// `npm run android` — is treated as dev, so a stray local build can never
// silently overwrite a tester's or developer's real prod install.
const APP_VARIANT = process.env.APP_VARIANT;
const IS_PROD = APP_VARIANT === 'production';
const IS_QA = APP_VARIANT === 'qa';

const BASE_ID = 'com.vigil.drowsiness';
const identifier = IS_PROD ? BASE_ID : IS_QA ? `${BASE_ID}.qa` : `${BASE_ID}.dev`;
const nameSuffix = IS_PROD ? '' : IS_QA ? ' (QA)' : ' (Dev)';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: `VIGIL${nameSuffix}`,
  slug: 'vigil-drowsiness',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: identifier,
    infoPlist: {
      NSCameraUsageDescription: 'VIGIL uses the camera to detect drowsiness.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0e0d',
    },
    package: identifier,
    permissions: ['android.permission.CAMERA', 'android.permission.VIBRATE', 'android.permission.WAKE_LOCK'],
  },
  plugins: [
    'expo-router',
    [
      'react-native-vision-camera',
      {
        cameraPermissionText: 'VIGIL uses the camera to detect drowsiness.',
        enableMicrophonePermission: false,
      },
    ],
    'expo-font',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
        },
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundPlayback: false,
      },
    ],
    'expo-asset',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#f2f2f3',
      },
    ],
    'expo-status-bar',
    '@react-native-google-signin/google-signin',
  ],
  scheme: 'vigil',
  extra: {
    router: {},
    eas: {
      projectId: 'cf393eed-f5ca-4c9c-9e4b-67335762511e',
    },
  },
  owner: 'kento89',
});
