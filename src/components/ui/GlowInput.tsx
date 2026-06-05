import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, TextInputProps,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { theme } from '../../constants/theme';

interface GlowInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function GlowInput({ label, error, secureTextEntry, style, ...props }: GlowInputProps) {
  const [showText, setShowText] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const isPassword = !!secureTextEntry;

  const animate = (toValue: number) =>
    Animated.timing(glowAnim, { toValue, duration: 200, useNativeDriver: false }).start();

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? theme.colors.danger : theme.colors.border,
      error ? theme.colors.danger : theme.colors.primary,
    ],
  });

  const shadowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
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
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textDimmed + '70'}
          secureTextEntry={isPassword && !showText}
          onFocus={() => animate(1)}
          onBlur={() => animate(0)}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowText(!showText)} style={styles.eyeBtn} activeOpacity={0.7}>
            {showText
              ? <EyeOff color={theme.colors.textDimmed} size={18} />
              : <Eye color={theme.colors.textDimmed} size={18} />}
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
    color: theme.colors.textDimmed,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.border.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeBtn: { padding: theme.spacing.xs, marginLeft: theme.spacing.xs },
  errorText: { color: theme.colors.danger, fontSize: 12, marginTop: 4, marginLeft: 2 },
});
