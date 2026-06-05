import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'glow' | 'glass';
  style?: object;
}

export function Card({ children, variant = 'default', style, ...props }: CardProps) {
  if (variant === 'glass') {
    return (
      <LinearGradient
        colors={[theme.colors.cardGlass, 'rgba(11, 12, 16, 0.8)']}
        style={[styles.container, styles.glassContainer, style]}
        start={[0, 0]}
        end={[1, 1]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View 
      style={[
        styles.container, 
        variant === 'glow' ? styles.glowContainer : styles.defaultContainer,
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    borderRadius: theme.border.radius.lg,
    marginBottom: theme.spacing.md,
  },
  defaultContainer: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  glowContainer: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.glow.cyan,
  },
  glassContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  }
});
