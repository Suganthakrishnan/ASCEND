import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../constants/theme';

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color?: string;
  height?: number;
  showValues?: boolean;
  style?: object;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function StatBar({
  label,
  current,
  max,
  color = theme.colors.primary,
  height = 8,
  showValues = true,
  style,
  accessibilityLabel,
  accessibilityHint,
}: StatBarProps) {
  const animWidth = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const progress = max > 0 ? Math.min(current / max, 1) : 0;
  const accessibilityLabelText = accessibilityLabel || `${label}: ${current} out of ${max}`;
  const accessibilityHintText = accessibilityHint || `Current value is ${current} out of maximum ${max}`;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 600,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, [progress]);

  const widthPercent = animWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '200%'],
  });

  return (
    <View 
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabelText}
      accessibilityHint={accessibilityHintText}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: max,
        now: current,
        text: `${current} of ${max}`,
      }}
    >
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {showValues && (
          <Text style={[styles.valueText, { color }]} accessibilityLiveRegion="polite">
            {current}<Text style={styles.maxText}>/{max}</Text>
          </Text>
        )}
      </View>
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthPercent,
              height,
              backgroundColor: color,
              borderRadius: height / 2,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.glowDot,
            {
              left: widthPercent,
              backgroundColor: color,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 6,
              elevation: 4,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '800',
  },
  maxText: {
    color: theme.colors.text.secondary,
    fontWeight: '400',
  },
  track: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  glowDot: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
});
