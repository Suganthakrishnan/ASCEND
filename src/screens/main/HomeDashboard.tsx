import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { theme } from '../../constants/theme';

export function HomeDashboard({ navigation }: any) {
  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.levelText}>LV. 1</Text>
          <Text style={styles.nameText}>PLAYER</Text>
        </View>

        <Card variant="glow" style={styles.statusCard}>
          <Text style={styles.cardTitle}>SYSTEM STATUS: <Text style={styles.statusActive}>ACTIVE</Text></Text>
          <View style={styles.healthBarContainer}>
            <View style={styles.healthBar} />
          </View>
          <Text style={styles.hpText}>HP: 100/100</Text>
        </Card>

        <View style={styles.grid}>
          <Card variant="glass" style={styles.gridCard}>
            <Text style={styles.statLabel}>STRENGTH</Text>
            <Text style={styles.statValue}>10</Text>
          </Card>
          <Card variant="glass" style={styles.gridCard}>
            <Text style={styles.statLabel}>AGILITY</Text>
            <Text style={styles.statValue}>10</Text>
          </Card>
        </View>

        <Card style={styles.dailyCard}>
           <Text style={styles.cardTitle}>DAILY QUESTS</Text>
           {/* Placeholder for list */}
           <View style={styles.questItem}><Text style={styles.questText}>Push-ups: 0/100</Text></View>
           <View style={styles.questItem}><Text style={styles.questText}>Run: 0/10km</Text></View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  levelText: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.primary,
    marginRight: theme.spacing.md,
    textShadowColor: theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  statusCard: {
    marginBottom: theme.spacing.xl,
  },
  cardTitle: {
    color: theme.colors.textDimmed,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: theme.spacing.md,
  },
  statusActive: {
    color: theme.colors.primary,
  },
  healthBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 51, 102, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  healthBar: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.danger,
    ...theme.glow.danger,
  },
  hpText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  gridCard: {
    flex: 0.48,
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statLabel: {
    color: theme.colors.textDimmed,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  dailyCard: {
    marginTop: theme.spacing.sm,
  },
  questItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  questText: {
    color: theme.colors.text,
    fontSize: 16,
  }
});
