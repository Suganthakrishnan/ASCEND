import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

export function SplashLoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Ascend';

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Typewriter effect
    let index = 0;
    const typewriterInterval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typewriterInterval);
      }
    }, 150);

    return () => clearInterval(typewriterInterval);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.scanningLine, { transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] }) }] }]} />
      <View style={styles.topLine} />
      <View style={styles.bottomLine} />
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      <View style={styles.center}>
        <Animated.Text style={[styles.logo, { opacity: pulseAnim }]}>
          {displayText}
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
  container: { flex: 1, backgroundColor: theme.colors.bg.base, justifyContent: 'center', alignItems: 'center' },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary,
    opacity: 0.6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  topLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: theme.colors.primary, opacity: 0.4 },
  bottomLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: theme.colors.primary, opacity: 0.4 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: theme.colors.primary, opacity: 0.5 },
  cornerTL: { top: 24, left: 24, borderTopWidth: 2, borderLeftWidth: 2 },
  cornerTR: { top: 24, right: 24, borderTopWidth: 2, borderRightWidth: 2 },
  cornerBL: { bottom: 24, left: 24, borderBottomWidth: 2, borderLeftWidth: 2 },
  cornerBR: { bottom: 24, right: 24, borderBottomWidth: 2, borderRightWidth: 2 },
  center: { alignItems: 'center' },
  logo: {
    fontSize: 40, fontWeight: '900', color: theme.colors.primary, letterSpacing: 6, fontFamily: theme.fonts.heading,
    textShadowColor: theme.colors.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  divider: { width: 60, height: 1.5, backgroundColor: theme.colors.primary, marginVertical: theme.spacing.md, opacity: 0.5 },
  subtitle: { fontSize: 11, color: theme.colors.text.secondary, letterSpacing: 3, marginBottom: theme.spacing.lg },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
});
