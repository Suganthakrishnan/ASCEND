import { View, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { theme } from '../../constants/theme';

export function WorkoutProgress() {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>COMBAT LOGS</Text>

        <Card variant="glass" style={styles.card}>
          <Text style={styles.cardTitle}>PHYSICAL CONDITIONING</Text>
          <View style={styles.graphPlaceholder}>
            <Text style={styles.graphText}>[ CHART DATA RENDERING ]</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>RECENT CLEARANCES</Text>
          <Text style={styles.item}>- E-Rank Dungeon (Leg Day)</Text>
          <Text style={styles.item}>- Daily Quest Completed</Text>
        </Card>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    letterSpacing: 2,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    letterSpacing: 1,
  },
  graphPlaceholder: {
    height: 150,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.border.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphText: {
    color: theme.colors.textDimmed,
    fontSize: 12,
    letterSpacing: 2,
  },
  item: {
    color: theme.colors.text,
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  }
});
