import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../constants/theme';

interface HudContainerProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  active?: boolean;
  accentColor?: string;
  blurEnabled?: boolean;
}

export function HudContainer({ children, intensity = 20, active = false, accentColor = theme.colors.primary, blurEnabled = true, style, ...props }: HudContainerProps) {
  return (
    <View style={[styles.wrapper, style]} {...props}>
      {blurEnabled && <BlurView tint="dark" intensity={intensity} style={StyleSheet.absoluteFillObject} />}
      {/* Top accent line */}
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
      <View style={[styles.content, active && styles.contentActive]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.bg.glassBorder,
    borderRadius: theme.border.radius.lg,
  },
  accentLine: {
    height: 2,
    width: '100%',
  },
  content: {
    padding: theme.spacing.md,
  },
  contentActive: {
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
});
