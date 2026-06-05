import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Zap, CheckCircle } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useAuthContext } from '../../context/AuthContext';

const FEATURES = [
  { icon: <Zap color={theme.colors.primary} size={20} />, title: 'AI-Powered Training', desc: 'Adaptive workout plans built around your goals' },
  { icon: <Shield color={theme.colors.secondary} size={20} />, title: 'Full System Tracking', desc: 'Sleep, screen time, workouts — all in one place' },
  { icon: <CheckCircle color={theme.colors.success} size={20} />, title: 'Quest System', desc: 'Gamified daily directives to keep you progressing' },
];

export function OnboardingScreen() {
  const { user, completeOnboarding } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    const { error } = await completeOnboarding();
    setIsLoading(false);
    if (error) {
      Alert.alert('SYSTEM ERROR', 'Could not save onboarding status. Please retry.', [{ text: 'RETRY', onPress: handleComplete }]);
    }
    // On success, AppNavigator automatically routes to MainTabs
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,240,255,0.1)', 'transparent', 'rgba(69,162,158,0.06)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.corner, styles.cTL]} /><View style={[styles.corner, styles.cTR]} />
      <View style={[styles.corner, styles.cBL]} /><View style={[styles.corner, styles.cBR]} />

      <View style={styles.content}>
        {/* Badge */}
        <View style={styles.badge}>
          <Shield color={theme.colors.primary} size={36} />
        </View>

        <Text style={styles.tagline}>WELCOME, OPERATOR</Text>
        <Text style={styles.title}>SYSTEM ONLINE</Text>
        <Text style={styles.subtitle}>
          Your account has been initialized.{'\n'}
          Activating your training protocol…
        </Text>

        <View style={styles.divider} />

        {/* Feature Cards */}
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>{f.icon}</View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {user?.email ? (
          <Text style={styles.accountNote}>Logged in as {user.email}</Text>
        ) : null}

        <Button
          title="INITIALIZE TRAINING SEQUENCE"
          onPress={handleComplete}
          isLoading={isLoading}
          style={styles.cta}
        />
        <Text style={styles.hint}>
          Full profile setup will be available in the next phase.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center' },
  corner: { position: 'absolute', width: 22, height: 22, borderColor: theme.colors.primary, opacity: 0.5 },
  cTL: { top: 22, left: 22, borderTopWidth: 2, borderLeftWidth: 2 },
  cTR: { top: 22, right: 22, borderTopWidth: 2, borderRightWidth: 2 },
  cBL: { bottom: 22, left: 22, borderBottomWidth: 2, borderLeftWidth: 2 },
  cBR: { bottom: 22, right: 22, borderBottomWidth: 2, borderRightWidth: 2 },
  content: { padding: theme.spacing.lg, alignItems: 'center' },
  badge: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.lg,
    ...theme.glow.cyan,
  },
  tagline: { fontSize: 11, color: theme.colors.secondary, letterSpacing: 3, marginBottom: theme.spacing.xs },
  title: {
    fontSize: 32, fontWeight: '900', color: theme.colors.primary, letterSpacing: 4,
    textShadowColor: theme.colors.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  subtitle: { fontSize: 14, color: theme.colors.textDimmed, textAlign: 'center', marginTop: theme.spacing.md, lineHeight: 22 },
  divider: { width: 50, height: 1.5, backgroundColor: theme.colors.primary, marginVertical: theme.spacing.lg, opacity: 0.5 },
  featureList: { alignSelf: 'stretch', gap: theme.spacing.md },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    backgroundColor: theme.colors.cardGlass, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.border.radius.md, padding: theme.spacing.md,
  },
  featureIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center',
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  featureDesc: { fontSize: 12, color: theme.colors.textDimmed },
  accountNote: { fontSize: 12, color: theme.colors.textDimmed, marginBottom: theme.spacing.md },
  cta: { alignSelf: 'stretch', marginBottom: theme.spacing.md },
  hint: { fontSize: 11, color: theme.colors.textDimmed + '80', textAlign: 'center' },
});
