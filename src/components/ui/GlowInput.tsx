import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../constants/theme';

interface GlowInputProps extends TextInputProps {
  label?: string;
  error?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function GlowInput({ label, error, secureTextEntry, style, accessibilityLabel, accessibilityHint, ...props }: GlowInputProps) {
  const [showText, setShowText] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const isPassword = !!secureTextEntry;

  const animate = (toValue: number) =>
    Animated.timing(glowAnim, { toValue, duration: 200, useNativeDriver: false }).start();

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? theme.colors.danger : theme.colors.bg.glassBorder,
      error ? theme.colors.danger : 'rgba(0,229,255,0.6)',
    ],
  });

  const shadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });
  const labelColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.text.secondary, theme.colors.primary],
  });

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Animated.Text style={[styles.label, { color: labelColor }]}>{label}</Animated.Text> : null}
      <Animated.View
        style={[
          styles.container,
          {
            borderColor,
            shadowColor: error ? theme.colors.danger : theme.colors.primary,
            shadowOpacity,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8,
          },
        ]}
      >
        <BlurView tint="dark" intensity={20} style={StyleSheet.absoluteFillObject} />
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.text.secondary + '80'}
          secureTextEntry={isPassword && !showText}
          onFocus={() => animate(1)}
          onBlur={() => animate(0)}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={accessibilityLabel || label || 'Text input'}
          accessibilityHint={accessibilityHint || (isPassword ? 'Enter your password' : 'Enter text')}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity 
            onPress={() => setShowText(!showText)} 
            style={styles.eyeBtn} 
            activeOpacity={0.7}
            accessibilityLabel={showText ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            {showText
              ? <EyeOff color={theme.colors.text.secondary} size={18} />
              : <Eye color={theme.colors.text.secondary} size={18} />}
          </TouchableOpacity>
        )}
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: theme.spacing.md },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.glass,
    borderWidth: 1,
    borderRadius: theme.border.radius.md,
    height: theme.touch.inputHeight,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '400',
    paddingHorizontal: theme.spacing.md,
  },
  eyeBtn: { padding: theme.spacing.md, marginLeft: theme.spacing.sm },
  errorText: { color: theme.colors.danger, fontSize: 12, marginTop: 4, marginLeft: 2 },
});
