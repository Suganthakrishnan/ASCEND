import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export function SplashLoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topLine} />
      <View style={styles.bottomLine} />
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      <View style={styles.center}>
        <Animated.Text style={[styles.logo, { opacity: pulseAnim }]}>
          SYSTEM FIT
        </Animated.Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>INITIALIZING PROTOCOLS</Text>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => <View key={i} style={[styles.dot, { opacity: 0.3 + i * 0.2 }]} />)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  topLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: theme.colors.primary, opacity: 0.4 },
  bottomLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: theme.colors.primary, opacity: 0.4 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: theme.colors.primary, opacity: 0.5 },
  cornerTL: { top: 24, left: 24, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 24, right: 24, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 24, left: 24, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 24, right: 24, borderBottomWidth: 2, borderRightWidth: 2 },
  center: { alignItems: 'center' },
  logo: {
    fontSize: 40, fontWeight: '900', color: theme.colors.primary, letterSpacing: 6,
    textShadowColor: theme.colors.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  divider: { width: 60, height: 1.5, backgroundColor: theme.colors.primary, marginVertical: theme.spacing.md, opacity: 0.5 },
  subtitle: { fontSize: 11, color: theme.colors.textDimmed, letterSpacing: 3, marginBottom: theme.spacing.lg },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
});
