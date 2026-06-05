import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { GlowInput } from '../../components/ui/GlowInput';
import { Button } from '../../components/ui/Button';
import { useAuthContext } from '../../context/AuthContext';

export function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; general?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Minimum 8 characters.';
    if (password !== confirm) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setIsLoading(true);
    const { data, error } = await signUp(email.trim(), password);
    setIsLoading(false);
    if (error) { setErrors({ general: error.message || 'Registration failed.' }); return; }
    if (!data.session) {
      // Email confirmation required
      Alert.alert(
        'VERIFY EMAIL',
        'A verification link has been sent to your email. Confirm to activate your system access.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
    // If session exists, AppNavigator routes to Onboarding automatically
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <LinearGradient colors={['rgba(0,240,255,0.07)', 'transparent']} style={styles.gradientTop} />
        <View style={[styles.corner, styles.cTL]} /><View style={[styles.corner, styles.cTR]} />
        <View style={[styles.corner, styles.cBL]} /><View style={[styles.corner, styles.cBR]} />

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color={theme.colors.primary} size={20} />
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>INITIALIZE</Text>
            <Text style={styles.titleAccent}>ACCOUNT</Text>
            <Text style={styles.subtitle}>Create your operator profile to begin</Text>
            <View style={styles.divider} />
          </View>

          {errors.general ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {errors.general}</Text>
            </View>
          ) : null}

          <GlowInput
            label="EMAIL ADDRESS"
            placeholder="operator@system.fit"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
            keyboardType="email-address"
            textContentType="emailAddress"
            error={errors.email}
          />
          <GlowInput
            label="ACCESS CODE"
            placeholder="Minimum 8 characters"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
            secureTextEntry
            textContentType="newPassword"
            error={errors.password}
          />
          <GlowInput
            label="CONFIRM ACCESS CODE"
            placeholder="Repeat your password"
            value={confirm}
            onChangeText={(t) => { setConfirm(t); setErrors(e => ({ ...e, confirm: undefined })); }}
            secureTextEntry
            textContentType="newPassword"
            error={errors.confirm}
          />

          <Button title="INITIALIZE ACCOUNT" onPress={handleSignUp} isLoading={isLoading} style={styles.submitBtn} />

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.linkPrompt}>ALREADY REGISTERED? </Text>
            <Text style={styles.linkAction}>ENTER SYSTEM</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  gradientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 240 },
  corner: { position: 'absolute', width: 22, height: 22, borderColor: theme.colors.primary, opacity: 0.5 },
  cTL: { top: 22, left: 22, borderTopWidth: 2, borderLeftWidth: 2 },
  cTR: { top: 22, right: 22, borderTopWidth: 2, borderRightWidth: 2 },
  cBL: { bottom: 22, left: 22, borderBottomWidth: 2, borderLeftWidth: 2 },
  cBR: { bottom: 22, right: 22, borderBottomWidth: 2, borderRightWidth: 2 },
  scroll: { flexGrow: 1, padding: theme.spacing.lg, paddingTop: theme.spacing.xl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: theme.spacing.xl },
  backText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  header: { marginBottom: theme.spacing.xxl },
  title: { fontSize: 34, fontWeight: '900', color: theme.colors.text, letterSpacing: 3 },
  titleAccent: {
    fontSize: 34, fontWeight: '900', color: theme.colors.primary, letterSpacing: 3,
    textShadowColor: theme.colors.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  subtitle: { fontSize: 13, color: theme.colors.textDimmed, marginTop: theme.spacing.sm },
  divider: { width: 40, height: 1.5, backgroundColor: theme.colors.primary, marginTop: theme.spacing.md, opacity: 0.6 },
  errorBox: {
    backgroundColor: 'rgba(255,51,102,0.1)', borderWidth: 1, borderColor: theme.colors.danger,
    borderRadius: theme.border.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md,
  },
  errorText: { color: theme.colors.danger, fontSize: 13, fontWeight: '600' },
  submitBtn: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: theme.spacing.sm },
  linkPrompt: { color: theme.colors.textDimmed, fontSize: 13, letterSpacing: 1 },
  linkAction: { color: theme.colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});
