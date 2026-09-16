import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Blueprint, Btn } from './ui';
import { colors, fonts } from '../lib/theme';

// Play's prominent-disclosure requirement: this has to be shown, in these
// words, before the OS camera permission prompt — not folded into a
// generic "allow permissions" screen.
export function PermissionDisclosure({
  visible, onAllow, onDismiss,
}: { visible: boolean; onAllow: () => void; onDismiss: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.grip} />
          <Text style={styles.title}>Vigil needs the camera — including in the background</Text>
          <Text style={styles.body}>
            To tell whether you are falling asleep, Vigil uses the front camera to look at your
            eyes, mouth and head position while you are driving.
          </Text>
          <Blueprint tint={colors.accentPalest} style={styles.callout}>
            <Text style={styles.calloutStrong}>
              This keeps running when the app is in the background and your screen is off.
            </Text>
            <Text style={styles.calloutBody}>
              Images are read on this phone and thrown away instantly. No video or photo is
              recorded, saved or uploaded — ever. A permanent notification shows you whenever
              Vigil is watching.
            </Text>
          </Blueprint>
          <Btn title="ALLOW CAMERA" variant="primary" height={58} fontSize={16} onPress={onAllow} style={{ marginBottom: 8 }} />
          <Btn title="Not now" variant="secondary" height={52} fontSize={15} onPress={onDismiss} />
          <Text style={styles.link} onPress={() => router.push('/privacy-policy')}>
            Read the full privacy policy
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(29,31,32,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 },
  grip: { width: 44, height: 3, backgroundColor: colors.accent, marginBottom: 20 },
  title: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 30, color: colors.text, marginBottom: 14 },
  body: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.text, marginBottom: 16 },
  callout: { padding: 16, marginBottom: 18 },
  calloutStrong: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, lineHeight: 19, color: colors.accentDarker, marginBottom: 8 },
  calloutBody: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: colors.textFaint },
  link: { textAlign: 'center', marginTop: 14, fontFamily: fonts.body, fontSize: 13, color: colors.accent },
});
