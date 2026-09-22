import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';
import { SettingsProvider } from '../lib/settings';
import { colors, fontAssets } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="index" />
            <Stack.Screen name="watch" />
            <Stack.Screen name="drive-summary" />
            <Stack.Screen name="history" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="privacy-policy" />
            <Stack.Screen name="auth/sign-in" />
            <Stack.Screen name="auth/callback" />
          </Stack>
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
