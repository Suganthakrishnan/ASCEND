import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, TextStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  style?: TextStyle;
  color?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1400,
  suffix = '',
  prefix = '',
  style,
  color = theme.colors.primary,
  decimals = 0,
}: AnimatedCounterProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    animValue.setValue(0);
    const listener = animValue.addListener(({ value: v }) => {
      setDisplayValue(v.toFixed(decimals));
    });

    Animated.timing(animValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => animValue.removeListener(listener);
  }, [value]);

  return (
    <Text style={[{ color, fontSize: 22, fontWeight: '900' }, style]}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
}
