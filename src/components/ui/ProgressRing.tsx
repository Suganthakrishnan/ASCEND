import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 1
  color?: string;
  trackColor?: string;
  label?: string;
  value?: string;
  sublabel?: string;
  animated?: boolean;
  accessibilityLabel?: string;
  accessibilityValue?: { min?: number; max?: number; now?: number; text?: string };
}

export function ProgressRing({
  size = 100,
  strokeWidth = 8,
  progress,
  color = theme.colors.primary,
  trackColor = 'rgba(255,255,255,0.06)',
  label,
  value,
  sublabel,
  animated = true,
  accessibilityLabel,
  accessibilityValue,
}: ProgressRingProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    if (animated) {
      Animated.timing(animValue, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      animValue.setValue(progress);
    }
  }, [progress]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const accessibilityLabelText = accessibilityLabel || `${label || 'Progress'}: ${Math.round(progress * 100)}%`;
  const accessibilityValueText = accessibilityValue?.text || `${Math.round(progress * 100)} percent`;

  return (
    <View 
      style={[styles.container, { width: size, height: size }]}
      accessible={true}
      accessibilityLabel={accessibilityLabelText}
      accessibilityHint={`Current progress is ${Math.round(progress * 100)} percent`}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: accessibilityValue?.min || 0,
        max: accessibilityValue?.max || 100,
        now: accessibilityValue?.now || Math.round(progress * 100),
        text: accessibilityValueText,
      }}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Glow arc behind */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth + 4}
          fill="none"
          strokeOpacity={0.3}
          strokeLinecap="round"
        />
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.labelContainer}>
        {value && <Text style={[styles.value, { color }]} accessibilityLabel={label}>{value}</Text>}
        {label && <Text style={styles.label}>{label}</Text>}
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sublabel: {
    fontSize: 8,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
});
