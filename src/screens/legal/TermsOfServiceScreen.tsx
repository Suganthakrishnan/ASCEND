import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';

export function TermsOfServiceScreen({ navigation }: any) {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft color={theme.colors.primary} size={20} />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>TERMS OF</Text>
          <Text style={styles.titleAccent}>SERVICE</Text>
          <View style={styles.divider} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>1. ACCEPTANCE OF TERMS</Text>
          <Text style={styles.content}>
            By accessing and using SystemFit, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
          </Text>

          <Text style={styles.sectionTitle}>2. USER ACCOUNT</Text>
          <Text style={styles.content}>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. You must notify us immediately of any unauthorized use of your account or any other breach of security.
          </Text>

          <Text style={styles.sectionTitle}>3. HEALTH & FITNESS DISCLAIMER</Text>
          <Text style={styles.content}>
            SystemFit is designed for general fitness and wellness information purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or fitness program.
          </Text>

          <Text style={styles.sectionTitle}>4. USER CONDUCT</Text>
          <Text style={styles.content}>
            You agree not to use the service for any unlawful purpose or in any way that could damage the service or impair its operation. You must not attempt to gain unauthorized access to the service, its servers, or any connected systems.
          </Text>

          <Text style={styles.sectionTitle}>5. INTELLECTUAL PROPERTY</Text>
          <Text style={styles.content}>
            All content, features, and functionality of SystemFit are owned by SystemFit and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
          </Text>

          <Text style={styles.sectionTitle}>6. PRIVACY</Text>
          <Text style={styles.content}>
            Your use of SystemFit is also subject to our Privacy Policy. Please review our Privacy Policy, which also governs the service and informs users of our data collection practices.
          </Text>

          <Text style={styles.sectionTitle}>7. LIMITATION OF LIABILITY</Text>
          <Text style={styles.content}>
            To the fullest extent permitted by law, SystemFit shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
          </Text>

          <Text style={styles.sectionTitle}>8. TERMINATION</Text>
          <Text style={styles.content}>
            We reserve the right to terminate or suspend your account and access to the service at our sole discretion, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
          </Text>

          <Text style={styles.sectionTitle}>9. GOVERNING LAW</Text>
          <Text style={styles.content}>
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which SystemFit operates, without regard to its conflict of law provisions.
          </Text>

          <Text style={styles.sectionTitle}>10. CHANGES TO TERMS</Text>
          <Text style={styles.content}>
            We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page. Your continued use of the service after such modifications constitutes your acceptance of the new Terms.
          </Text>

          <Text style={styles.sectionTitle}>11. CONTACT INFORMATION</Text>
          <Text style={styles.content}>
            If you have any questions about these Terms of Service, please contact us through the support feature in the app or via email at support@systemfit.app.
          </Text>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg.base },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: theme.spacing.xl },
  backText: { color: theme.colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  header: { marginBottom: theme.spacing.xxl },
  title: { fontSize: 34, fontWeight: '900', color: theme.colors.text.primary, letterSpacing: 3, fontFamily: theme.fonts.heading },
  titleAccent: {
    fontSize: 34, fontWeight: '900', color: theme.colors.primary, letterSpacing: 3,
    textShadowColor: theme.colors.primary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
    fontFamily: theme.fonts.heading,
  },
  divider: { width: 40, height: 1.5, backgroundColor: theme.colors.primary, marginTop: theme.spacing.md, opacity: 0.6 },
  scroll: { paddingBottom: theme.spacing.xl },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  content: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
});
