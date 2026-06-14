import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';

export function PrivacyPolicyScreen({ navigation }: any) {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft color={theme.colors.primary} size={20} />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>PRIVACY</Text>
          <Text style={styles.titleAccent}>POLICY</Text>
          <View style={styles.divider} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>1. INFORMATION WE COLLECT</Text>
          <Text style={styles.content}>
            Ascend collects information you provide directly to us, including your name, email address, and fitness data such as workout logs, progress tracking, and personal preferences. We also collect automatically generated information about your use of the app, including device information and usage statistics.
          </Text>

          <Text style={styles.sectionTitle}>2. HOW WE USE YOUR INFORMATION</Text>
          <Text style={styles.content}>
            We use the information we collect to provide, maintain, and improve our services, including tracking your fitness progress, personalizing your experience, and sending you notifications about your goals and achievements. We also use your information to communicate with you about our services and for security purposes.
          </Text>

          <Text style={styles.sectionTitle}>3. DATA SECURITY</Text>
          <Text style={styles.content}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </Text>

          <Text style={styles.sectionTitle}>4. DATA RETENTION</Text>
          <Text style={styles.content}>
            We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law. You may request deletion of your account and associated data at any time through the Profile settings.
          </Text>

          <Text style={styles.sectionTitle}>5. YOUR RIGHTS</Text>
          <Text style={styles.content}>
            You have the right to access, correct, or delete your personal data. You can export all your data in JSON format through the Profile settings. You may also request deletion of your account, which will permanently remove your data from our systems. To exercise these rights, use the options provided in the Profile section of the app.
          </Text>

          <Text style={styles.sectionTitle}>6. THIRD-PARTY SERVICES</Text>
          <Text style={styles.content}>
            We use Supabase as our backend service provider to store and manage your data securely. We may also use analytics services to understand how our app is used. These third parties have access to your personal information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.
          </Text>

          <Text style={styles.sectionTitle}>7. CHILDREN'S PRIVACY</Text>
          <Text style={styles.content}>
            Ascend is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information.
          </Text>

          <Text style={styles.sectionTitle}>8. INTERNATIONAL DATA TRANSFERS</Text>
          <Text style={styles.content}>
            Your information may be transferred to and processed in countries other than your own. We ensure that your data is protected in accordance with this privacy policy and applicable data protection laws, including GDPR where applicable.
          </Text>

          <Text style={styles.sectionTitle}>9. CHANGES TO THIS PRIVACY POLICY</Text>
          <Text style={styles.content}>
            We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date. You are advised to review this privacy policy periodically for any changes.
          </Text>

          <Text style={styles.sectionTitle}>10. CONTACT US</Text>
          <Text style={styles.content}>
            If you have any questions about this privacy policy or our data practices, please contact us through the support feature in the app or via email at privacy@systemfit.app. We will respond to your inquiries within a reasonable timeframe.
          </Text>

          <Text style={styles.lastUpdated}>Last Updated: May 2026</Text>

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
  lastUpdated: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xl,
    fontStyle: 'italic',
  },
});
