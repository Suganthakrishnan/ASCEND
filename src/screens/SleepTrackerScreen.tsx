import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { HudContainer } from '../components/ui/HudContainer';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { GlowInput } from '../components/ui/GlowInput';
import { theme } from '../constants/theme';
import { useAuthContext } from '../context/AuthContext';
import {
  SleepService, SleepLog, calculateSleepHours, SleepStats,
} from '../services/sleepService';
import {
  Moon, Star, Clock, TrendingUp, X, ChevronLeft, ChevronRight, Target, Lightbulb, BarChart3,
} from 'lucide-react-native';

const QUALITY_LABELS = ['Poor', 'Fair', 'OK', 'Good', 'Great'];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function SleepTrackerScreen() {
  const { user, isDemoMode } = useAuthContext();
  const today = new Date().toISOString().split('T')[0];
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [history, setHistory] = useState<SleepLog[]>([]);
  const [stats, setStats] = useState<SleepStats | null>(null);
  const [goalHours, setGoalHours] = useState(8);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('8');
  const [activeTab, setActiveTab] = useState<'log' | 'analysis' | 'recommendations'>('log');

  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState(4);
  const [notes, setNotes] = useState('');

  const previewHours = calculateSleepHours(bedtime, wakeTime);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const goal = await SleepService.getSleepGoal(user.id);
      setGoalHours(goal);
      setGoalInput(String(goal));

      const { data: logs } = await SleepService.getHistory(user.id, 14);
      setHistory(logs);
      setStats(SleepService.computeStats(logs, goal));

      const { data: dayLog } = await SleepService.getLogForDate(user.id, selectedDate);
      if (dayLog) {
        setBedtime(dayLog.bedtime);
        setWakeTime(dayLog.wake_time);
        setQuality(dayLog.quality);
        setNotes(dayLog.notes ?? '');
      }
    } catch (e) {
      console.error('[SleepTracker] load error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const next = d.toISOString().split('T')[0];
    if (next > today) return;
    setSelectedDate(next);
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('SIGN IN REQUIRED', isDemoMode ? 'Demo mode cannot save sleep logs.' : 'Please sign in to log sleep.');
      return;
    }
    if (!/^\d{1,2}:\d{2}$/.test(bedtime) || !/^\d{1,2}:\d{2}$/.test(wakeTime)) {
      Alert.alert('INVALID TIME', 'Use HH:MM format (e.g. 22:30).');
      return;
    }

    setIsSaving(true);
    const { error } = await SleepService.logSleep(user.id, {
      log_date: selectedDate,
      bedtime,
      wake_time: wakeTime,
      quality,
      notes: notes.trim() || undefined,
    });
    setIsSaving(false);

    if (error) {
      Alert.alert(
        'SAVE FAILED',
        error.message?.includes('sleep_logs')
          ? 'Run the sleep_logs migration in supabase_setup.sql.'
          : error.message ?? 'Could not save sleep log.',
      );
      return;
    }

    Alert.alert('LOGGED', `Sleep recorded: ${previewHours}h`);
    setShowLogModal(false);
    loadData();
  };

  const handleSetGoal = async () => {
    if (!user?.id) return;
    const hours = parseFloat(goalInput);
    if (isNaN(hours) || hours < 4 || hours > 12) {
      Alert.alert('INVALID', 'Goal must be between 4 and 12 hours.');
      return;
    }
    await SleepService.setSleepGoal(user.id, hours);
    setGoalHours(hours);
    setShowGoalModal(false);
    loadData();
  };

  const selectedLog = history.find(l => l.log_date === selectedDate);

  // Calculate sleep debt and consistency score
  const calculateSleepDebt = () => {
    if (!stats || stats.nightsLogged === 0) return 0;
    const totalDebt = history.reduce((sum, log) => {
      const hours = log.duration_hours;
      return sum + Math.max(0, goalHours - hours);
    }, 0);
    return Math.round(totalDebt / stats.nightsLogged * 10) / 10;
  };

  const calculateConsistencyScore = () => {
    if (history.length < 3) return 0;
    const durations = history.map(h => h.duration_hours);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 100 - (stdDev * 20));
    return Math.round(consistency);
  };

  const getRecommendations = () => {
    const recommendations = [];
    const sleepDebt = calculateSleepDebt();
    const consistency = calculateConsistencyScore();

    if (sleepDebt > 1) {
      recommendations.push({
        icon: <Moon color="#BF5AF2" size={16} />,
        title: 'Reduce Sleep Debt',
        desc: `You're averaging ${sleepDebt}h less than your goal. Try going to bed 30 minutes earlier.`,
        priority: 'high',
      });
    }

    if (consistency < 70 && history.length >= 3) {
      recommendations.push({
        icon: <Clock color="#BF5AF2" size={16} />,
        title: 'Improve Consistency',
        desc: 'Your sleep schedule varies significantly. Try to maintain the same bedtime every night.',
        priority: 'medium',
      });
    }

    if (stats && stats.avgQuality < 3.5) {
      recommendations.push({
        icon: <Star color={theme.colors.gold} size={16} />,
        title: 'Enhance Sleep Quality',
        desc: 'Your sleep quality is below average. Consider reducing screen time before bed.',
        priority: 'medium',
      });
    }

    if (stats && stats.avgDuration >= goalHours) {
      recommendations.push({
        icon: <Target color={theme.colors.success} size={16} />,
        title: 'Great Progress!',
        desc: "You're meeting your sleep goals. Keep up the excellent work!",
        priority: 'low',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        icon: <Lightbulb color={theme.colors.primary} size={16} />,
        title: 'Log More Data',
        desc: 'Log at least 3 nights of sleep to get personalized recommendations.',
        priority: 'low',
      });
    }

    return recommendations;
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>LOADING SLEEP DATA...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>SLEEP TRACKER</Text>
          <Text style={styles.subtitle}>Log rest cycles and monitor recovery</Text>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'log' && styles.tabActive]}
            onPress={() => setActiveTab('log')}
          >
            <Moon color={activeTab === 'log' ? '#BF5AF2' : theme.colors.text.secondary} size={16} />
            <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>LOG</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analysis' && styles.tabActive]}
            onPress={() => setActiveTab('analysis')}
          >
            <BarChart3 color={activeTab === 'analysis' ? '#BF5AF2' : theme.colors.text.secondary} size={16} />
            <Text style={[styles.tabText, activeTab === 'analysis' && styles.tabTextActive]}>ANALYSIS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recommendations' && styles.tabActive]}
            onPress={() => setActiveTab('recommendations')}
          >
            <Lightbulb color={activeTab === 'recommendations' ? '#BF5AF2' : theme.colors.text.secondary} size={16} />
            <Text style={[styles.tabText, activeTab === 'recommendations' && styles.tabTextActive]}>TIPS</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'log' && (
          <>
        {/* Date picker */}
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.dateBtn}>
            <ChevronLeft color={theme.colors.primary} size={20} />
          </TouchableOpacity>
          <Text style={styles.dateLabel}>
            {selectedDate === today ? 'TODAY' : formatDateLabel(selectedDate)}
          </Text>
          <TouchableOpacity
            onPress={() => shiftDate(1)}
            style={[styles.dateBtn, selectedDate >= today && styles.dateBtnDisabled]}
            disabled={selectedDate >= today}
          >
            <ChevronRight color={theme.colors.textDimmed} size={20} />
          </TouchableOpacity>
        </View>

        {/* Tonight summary */}
        <HudContainer style={styles.heroCard} accentColor="#BF5AF2">
          <View style={styles.heroTop}>
            <Moon color="#BF5AF2" size={28} />
            <View style={styles.heroStats}>
              <Text style={styles.heroHours}>
                {selectedLog ? `${selectedLog.duration_hours}h` : `${previewHours}h`}
              </Text>
              <Text style={styles.heroMeta}>
                {selectedLog
                  ? `${selectedLog.bedtime} → ${selectedLog.wake_time}`
                  : `${bedtime} → ${wakeTime} (preview)`}
              </Text>
            </View>
            {selectedLog && (
              <View style={styles.qualityBadge}>
                <Star color={theme.colors.gold} size={14} fill={theme.colors.gold} />
                <Text style={styles.qualityText}>{selectedLog.quality}/5</Text>
              </View>
            )}
          </View>
          <View style={styles.goalRow}>
            <Target color={theme.colors.text.secondary} size={14} />
            <Text style={styles.goalText}>Goal: {goalHours}h</Text>
            <TouchableOpacity onPress={() => setShowGoalModal(true)}>
              <Text style={styles.goalEdit}>EDIT</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    100,
                    ((selectedLog?.duration_hours ?? previewHours) / goalHours) * 100,
                  )}%`,
                },
              ]}
            />
          </View>
        </HudContainer>

        <Button
          title={selectedLog ? 'UPDATE SLEEP LOG' : 'LOG SLEEP'}
          onPress={() => setShowLogModal(true)}
          style={styles.logBtn}
        />

        {/* Weekly stats */}
        {stats && stats.nightsLogged > 0 && (
          <>
            <SectionHeader title="Sleep Analytics" icon={<TrendingUp color="#BF5AF2" size={14} />} />
            <View style={styles.statsRow}>
              <HudContainer style={styles.statCard}>
                <Clock color="#BF5AF2" size={16} />
                <Text style={styles.statValue}>{stats.avgDuration}h</Text>
                <Text style={styles.statLabel}>AVG SLEEP</Text>
              </HudContainer>
              <HudContainer style={styles.statCard}>
                <Star color={theme.colors.gold} size={16} />
                <Text style={styles.statValue}>{stats.avgQuality}/5</Text>
                <Text style={styles.statLabel}>AVG QUALITY</Text>
              </HudContainer>
              <HudContainer style={styles.statCard}>
                <Moon color="#BF5AF2" size={16} />
                <Text style={styles.statValue}>{stats.nightsLogged}</Text>
                <Text style={styles.statLabel}>NIGHTS</Text>
              </HudContainer>
            </View>
          </>
        )}

        {/* History */}
        <SectionHeader title="Recent Logs" icon={<Moon color="#BF5AF2" size={14} />} />
        {history.length === 0 ? (
          <HudContainer style={styles.emptyCard}>
            <Text style={styles.emptyText}>No sleep logs yet. Log your first night above.</Text>
          </HudContainer>
        ) : (
          history.map(log => (
            <TouchableOpacity
              key={log.id}
              style={styles.historyItem}
              onPress={() => setSelectedDate(log.log_date)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.historyDate}>{formatDateLabel(log.log_date)}</Text>
                <Text style={styles.historyMeta}>
                  {log.bedtime} → {log.wake_time} · {log.duration_hours}h
                </Text>
              </View>
              <View style={styles.historyStars}>
                {Array.from({ length: log.quality }).map((_, i) => (
                  <Star key={i} color={theme.colors.gold} size={12} fill={theme.colors.gold} />
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}

        <HudContainer style={styles.tipCard}>
          <Text style={styles.tipTitle}>RECOVERY TIP</Text>
          <Text style={styles.tipBody}>
            Consistent 7–9 hours improves stamina gains and quest completion. Log sleep within 30 minutes of waking for best accuracy.
          </Text>
        </HudContainer>

        <View style={{ height: 32 }} />
          </>
        )}

        {activeTab === 'analysis' && (
          <>
            <SectionHeader title="Sleep Analysis" icon={<BarChart3 color="#BF5AF2" size={14} />} />
            
            <HudContainer style={styles.analysisCard}>
              <Text style={styles.analysisLabel}>SLEEP DEBT</Text>
              <Text style={styles.analysisValue}>{calculateSleepDebt()}h</Text>
              <Text style={styles.analysisDesc}>Average hours below goal</Text>
            </HudContainer>

            <HudContainer style={styles.analysisCard}>
              <Text style={styles.analysisLabel}>CONSISTENCY SCORE</Text>
              <Text style={styles.analysisValue}>{calculateConsistencyScore()}%</Text>
              <Text style={styles.analysisDesc}>Schedule regularity</Text>
            </HudContainer>

            {stats && (
              <>
                <HudContainer style={styles.analysisCard}>
                  <Text style={styles.analysisLabel}>AVG DURATION</Text>
                  <Text style={styles.analysisValue}>{stats.avgDuration}h</Text>
                  <Text style={styles.analysisDesc}>Over {stats.nightsLogged} nights</Text>
                </HudContainer>

                <HudContainer style={styles.analysisCard}>
                  <Text style={styles.analysisLabel}>AVG QUALITY</Text>
                  <Text style={styles.analysisValue}>{stats.avgQuality}/5</Text>
                  <Text style={styles.analysisDesc}>Sleep quality rating</Text>
                </HudContainer>
              </>
            )}

            <View style={{ height: 32 }} />
          </>
        )}

        {activeTab === 'recommendations' && (
          <>
            <SectionHeader title="Personalized Tips" icon={<Lightbulb color="#BF5AF2" size={14} />} />
            
            {getRecommendations().map((rec, index) => (
              <HudContainer key={index} style={styles.recCard}>
                <View style={styles.recHeader}>
                  <View style={styles.recIcon}>{rec.icon}</View>
                  <Text style={styles.recTitle}>{rec.title}</Text>
                </View>
                <Text style={styles.recDesc}>{rec.desc}</Text>
                <View style={[styles.priorityBadge, {
                  backgroundColor: rec.priority === 'high' ? theme.colors.danger + '20' :
                                   rec.priority === 'medium' ? '#FFD93D20' :
                                   theme.colors.success + '20'
                }]}>
                  <Text style={[styles.priorityText, {
                    color: rec.priority === 'high' ? theme.colors.danger :
                           rec.priority === 'medium' ? '#FFD93D' :
                           theme.colors.success
                  }]}>
                    {rec.priority.toUpperCase()}
                  </Text>
                </View>
              </HudContainer>
            ))}

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
      </Animated.View>

      {/* Log modal */}
      <Modal visible={showLogModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>LOG SLEEP</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <X color={theme.colors.text.secondary} size={22} />
              </TouchableOpacity>
            </View>

            <GlowInput label="BEDTIME (HH:MM)" value={bedtime} onChangeText={setBedtime} placeholder="22:30" />
            <GlowInput label="WAKE TIME (HH:MM)" value={wakeTime} onChangeText={setWakeTime} placeholder="06:30" />

            <Text style={styles.previewDuration}>Duration: {previewHours} hours</Text>

            <Text style={styles.inputLabel}>SLEEP QUALITY</Text>
            <View style={styles.qualityRow}>
              {[1, 2, 3, 4, 5].map(q => (
                <TouchableOpacity
                  key={q}
                  style={[styles.qualityBtn, quality === q && styles.qualityBtnActive]}
                  onPress={() => setQuality(q)}
                >
                  <Star
                    color={q <= quality ? theme.colors.gold : theme.colors.text.secondary}
                    size={20}
                    fill={q <= quality ? theme.colors.gold : 'transparent'}
                  />
                  <Text style={styles.qualityBtnLabel}>{QUALITY_LABELS[q - 1]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <GlowInput label="NOTES (OPTIONAL)" value={notes} onChangeText={setNotes} placeholder="How did you sleep?" />

            <Button title="SAVE LOG" onPress={handleSave} isLoading={isSaving} style={{ marginTop: theme.spacing.lg }} />
          </View>
        </View>
      </Modal>

      {/* Goal modal */}
      <Modal visible={showGoalModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>SLEEP GOAL</Text>
            <GlowInput
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="decimal-pad"
              placeholder="8"
            />
            <Text style={styles.goalHint}>Hours per night (4–12)</Text>
            <Button title="SET GOAL" onPress={handleSetGoal} style={{ marginTop: theme.spacing.md }} />
            <Button title="CANCEL" variant="outline" onPress={() => setShowGoalModal(false)} style={{ marginTop: theme.spacing.sm }} />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.colors.text.secondary, letterSpacing: 2, fontSize: 12 },
  title: { fontSize: 22, fontWeight: '900', color: theme.colors.text.primary, letterSpacing: 3, fontFamily: theme.fonts.heading },
  subtitle: { fontSize: 12, color: theme.colors.text.secondary, marginBottom: theme.spacing.lg },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md, gap: theme.spacing.lg },
  dateBtn: { padding: theme.spacing.sm },
  dateBtnDisabled: { opacity: 0.3 },
  dateLabel: { fontSize: 14, fontWeight: '700', color: '#BF5AF2', letterSpacing: 2, minWidth: 140, textAlign: 'center' },
  heroCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  heroStats: { flex: 1 },
  heroHours: { fontSize: 36, fontWeight: '900', color: '#BF5AF2', fontFamily: theme.fonts.heading },
  heroMeta: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 4 },
  qualityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qualityText: { fontSize: 14, fontWeight: '700', color: theme.colors.gold },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  goalText: { flex: 1, fontSize: 12, color: theme.colors.text.secondary },
  goalEdit: { fontSize: 10, fontWeight: '700', color: '#BF5AF2', letterSpacing: 1 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#BF5AF2', borderRadius: 2 },
  logBtn: { marginBottom: theme.spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.lg },
  statCard: { width: '31%', alignItems: 'center', paddingVertical: theme.spacing.md },
  statValue: { fontSize: 18, fontWeight: '900', color: theme.colors.text.primary, marginTop: 6, fontFamily: theme.fonts.heading },
  statLabel: { fontSize: 8, color: theme.colors.text.secondary, letterSpacing: 1, marginTop: 4 },
  emptyCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.md },
  emptyText: { fontSize: 12, color: theme.colors.text.secondary, textAlign: 'center' },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.bg.glassBorder,
  },
  historyDate: { fontSize: 13, fontWeight: '600', color: theme.colors.text.primary },
  historyMeta: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
  historyStars: { flexDirection: 'row', gap: 2 },
  tipCard: { marginTop: theme.spacing.lg, padding: theme.spacing.lg },
  tipTitle: { fontSize: 11, fontWeight: '700', color: '#BF5AF2', letterSpacing: 2, marginBottom: theme.spacing.sm },
  tipBody: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 18 },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.bg.glassBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000 },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: theme.colors.bg.glassBorder,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    zIndex: 1001,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  modalTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text.primary, letterSpacing: 2 },
  previewDuration: { fontSize: 14, fontWeight: '700', color: '#BF5AF2', marginVertical: theme.spacing.md },
  inputLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.text.secondary, letterSpacing: 1.5, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  qualityRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  qualityBtn: { alignItems: 'center', padding: theme.spacing.xs, flex: 1 },
  qualityBtnActive: { backgroundColor: theme.colors.gold + '15', borderRadius: 4 },
  qualityBtnLabel: { fontSize: 7, color: theme.colors.text.secondary, marginTop: 2 },
  goalHint: { fontSize: 11, color: theme.colors.text.secondary, textAlign: 'center', marginTop: theme.spacing.sm },
  
  // Tab navigation styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bg.glass,
    borderWidth: 1,
    borderColor: theme.colors.bg.glassBorder,
    borderRadius: theme.border.radius.md,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderRadius: theme.border.radius.sm,
  },
  tabActive: {
    backgroundColor: '#BF5AF2' + '20',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#BF5AF2',
  },
  
  // Analysis styles
  analysisCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
  },
  analysisValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#BF5AF2',
    fontFamily: theme.fonts.heading,
    marginBottom: 2,
  },
  analysisDesc: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  
  // Recommendations styles
  recCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  recIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bg.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  recDesc: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.border.radius.sm,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
