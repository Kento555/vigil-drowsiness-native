import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle, type TextStyle } from 'react-native';
import { colors, fonts } from '../lib/theme';

// Four little tick marks at the corners of a bordered frame — the recurring
// "blueprint" motif of the redesign. Requires the parent to allow overflow.
export function Corners({ color = 'rgba(29,31,32,0.55)' }: { color?: string }) {
  const spots: StyleProp<ViewStyle>[] = [
    { top: -6, left: -6 },
    { top: -6, right: -6 },
    { bottom: -6, left: -6 },
    { bottom: -6, right: -6 },
  ];
  return (
    <>
      {spots.map((pos, i) => (
        <View key={i} style={[styles.corner, pos]} pointerEvents="none">
          <View style={[styles.cornerV, { backgroundColor: color }]} />
          <View style={[styles.cornerH, { backgroundColor: color }]} />
        </View>
      ))}
    </>
  );
}

export function Blueprint({
  children, style, tint, cornerColor,
}: { children?: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: string; cornerColor?: string }) {
  return (
    <View style={[styles.blueprint, tint ? { backgroundColor: tint } : null, style]}>
      <Corners color={cornerColor} />
      {children}
    </View>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'plain' | 'danger';

export function Btn({
  title, onPress, variant = 'plain', height = 52, fontSize = 15, corners = false,
  disabled, style, textStyle, icon, testID,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  height?: number;
  fontSize?: number;
  corners?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  testID?: string;
}) {
  const variantStyle = VARIANT_STYLES[variant];
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { height },
        variantStyle.container,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
        style,
      ]}
    >
      {corners && <Corners color={variant === 'primary' ? 'rgba(242,242,243,0.6)' : undefined} />}
      {icon}
      <Text style={[styles.btnText, { fontSize }, variantStyle.text, textStyle]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const VARIANT_STYLES: Record<BtnVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: { container: { backgroundColor: colors.accent, borderColor: colors.accent }, text: { color: colors.bg } },
  secondary: { container: { backgroundColor: 'transparent', borderColor: colors.divider }, text: { color: colors.text } },
  ghost: { container: { backgroundColor: 'transparent', borderColor: 'transparent' }, text: { color: colors.accent } },
  danger: { container: { backgroundColor: 'transparent', borderColor: colors.alarm }, text: { color: colors.alarm } },
  plain: { container: { backgroundColor: 'transparent', borderColor: 'transparent' }, text: { color: colors.muted } },
};

export type Preset = 'relaxed' | 'standard' | 'strict';

export const PRESET_COPY: Record<Preset, string> = {
  relaxed: 'Wakes you only when you are clearly gone. Fewest false alarms — best for stop-start city driving.',
  standard: 'Wakes you after about two seconds of closed eyes. Right for most drivers, most of the time.',
  strict: 'Wakes you at the first sign of drifting. Use it on night drives and long motorway stretches.',
};

export function PresetSegmented({
  value, onChange, height = 54, fontSize = 13,
}: { value: Preset; onChange: (p: Preset) => void; height?: number; fontSize?: number }) {
  const items: { key: Preset; label: string }[] = [
    { key: 'relaxed', label: 'Relaxed' },
    { key: 'standard', label: 'Standard' },
    { key: 'strict', label: 'Strict' },
  ];
  return (
    <View style={styles.seg}>
      {items.map((it, i) => {
        const active = value === it.key;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={[
              styles.segOpt,
              { height, backgroundColor: active ? colors.text : 'transparent' },
              i > 0 && styles.segDivider,
            ]}
          >
            <Text style={[styles.segText, { fontSize, color: active ? colors.bg : colors.muted }]}>
              {it.label.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({
  value, onValueChange, dark = false, disabled = false,
}: { value: boolean; onValueChange: () => void; dark?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onValueChange}
      disabled={disabled}
      style={[
        styles.track,
        {
          backgroundColor: value ? colors.accent : 'transparent',
          borderColor: dark ? colors.onDarkDivider : colors.dividerStrong,
          justifyContent: value ? 'flex-end' : 'flex-start',
          opacity: disabled ? 0.4 : 1,
        },
      ]}
    >
      <View style={[styles.knob, { backgroundColor: value ? colors.bg : colors.mutedSoft }]} />
    </Pressable>
  );
}

export function Kicker({ children, color = colors.muted, style }: { children: React.ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.kicker, { color }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', width: 11, height: 11 },
  cornerV: { position: 'absolute', left: 5, top: 0, width: 1, height: 11 },
  cornerH: { position: 'absolute', top: 5, left: 0, width: 11, height: 1 },
  blueprint: { borderWidth: 1, borderColor: colors.divider },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, paddingHorizontal: 18,
  },
  btnText: { fontFamily: fonts.heading, letterSpacing: 1 },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.4 },
  seg: { flexDirection: 'row', borderWidth: 1, borderColor: colors.divider },
  segOpt: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segDivider: { borderLeftWidth: 1, borderLeftColor: colors.divider },
  segText: { fontFamily: fonts.heading, letterSpacing: 1.5 },
  track: { width: 56, height: 30, borderWidth: 1, padding: 3, flexDirection: 'row', alignItems: 'center' },
  knob: { width: 24, height: 24 },
  kicker: { fontFamily: fonts.heading, fontSize: 11, letterSpacing: 3 },
});
