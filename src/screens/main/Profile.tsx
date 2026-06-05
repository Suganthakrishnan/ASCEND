import { View, Text, StyleSheet, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { theme } from '../../constants/theme';
import { useAuthContext } from '../../context/AuthContext';
import { useState } from 'react';

export function Profile() {
  const { user, signOut } = useAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert('LOG OUT', 'Terminate current system session?', [
      { text: 'CANCEL', style: 'cancel' },
      {
        text: 'CONFIRM', style: 'destructive', onPress: async () => {
          setIsLoggingOut(true);
          await signOut();
          setIsLoggingOut(false);
          // AppNavigator reroutes to Auth automatically
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder} />
          <Text style={styles.name}>OPERATOR</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
          <Text style={styles.titleInfo}>Hunter Class: S-Rank</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>SYSTEM SETTINGS</Text>
          <Button title="Theme Configuration" variant="ghost" onPress={() => {}} style={styles.btn} textStyle={styles.btnText} />
          <Button title="Notification Preferences" variant="ghost" onPress={() => {}} style={styles.btn} textStyle={styles.btnText} />
        </Card>

        <Button
          title={isLoggingOut ? 'TERMINATING...' : 'LOG OUT'}
          variant="outline"
          onPress={handleLogout}
          isLoading={isLoggingOut}
          style={styles.logoutBtn}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg },
  header: { alignItems: 'center', marginBottom: theme.spacing.xxl },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: theme.colors.card, borderWidth: 2, borderColor: theme.colors.primary,
    ...theme.glow.cyan, marginBottom: theme.spacing.md,
  },
  name: { fontSize: 24, fontWeight: '900', color: theme.colors.text, letterSpacing: 2 },
  email: { fontSize: 13, color: theme.colors.secondary, marginTop: 2 },
  titleInfo: { color: theme.colors.textDimmed, fontSize: 13, marginTop: theme.spacing.xs },
  card: { marginBottom: theme.spacing.xl },
  cardTitle: { color: theme.colors.textDimmed, marginBottom: theme.spacing.md, fontSize: 12, letterSpacing: 1 },
  btn: { justifyContent: 'flex-start', paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', borderRadius: 0 },
  btnText: { color: theme.colors.text },
  logoutBtn: { borderColor: theme.colors.danger, ...theme.glow.danger },
});
