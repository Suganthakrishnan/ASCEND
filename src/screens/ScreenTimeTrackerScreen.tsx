import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Card } from '../components/ui/Card';
import { HudContainer } from '../components/ui/HudContainer';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { GlowInput } from '../components/ui/GlowInput';
import { theme } from '../constants/theme';
import { useAuthContext } from '../context/AuthContext';
import {
  ScreenTimeService,
  ScreenTimeLog,
  ScreenTimeStats,
  ScreenTimeCategory,
  SCREEN_TIME_CATEGORIES,
} from '../services/screenTimeService';
import { DailyProgressService } from '../services/statsService';
import {
  Smartphone, Target, TrendingUp, Timer, X, ChevronLeft, ChevronRight,
  Play, Pause, RotateCcw, Lightbulb,
} from 'lucide-react-native';

const WELLNESS_TIPS = [
  'Enable Do Not Disturb during focus blocks.',
  'Keep phones out of the bedroom for better sleep quality.',
  'Use app limits for social feeds — small cuts add up.',
  'Take a 5-minute screen break every hour.',
  'Batch notifications to 2–3 check-ins per day.',
];

const FOCUS_PRESETS = [15, 25, 45];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function ScreenTimeTrackerScreen() {
  const { user, isDemoMode } = useAuthContext();
  const today = new Date().toISOString().split('T')[0];

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [dayLogs, setDayLogs] = useState<ScreenTimeLog[]>([]);
  const [history, setHistory] = useState<ScreenTimeLog[]>([]);
  const [stats, setStats] = useState<ScreenTimeStats | null>(null);
  const [limitHours, setLimitHours] = useState(4);
  const [focusHoursToday, setFocusHoursToday] = useState(0);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInput, setLimitInput] = useState('4');

  const [logCategory, setLogCategory] = useState<ScreenTimeCategory>('social');
  const [logHours, setLogHours] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(0);
  const [focusRunning, setFocusRunning] = useState(false);
  const focusRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const daySummary = ScreenTimeService.summarizeDay(
    dayLogs.map(l => ({ ...l, log_date: selectedDate })),
    selectedDate,
  );
  const weeklySummaries = ScreenTimeService.buildWeeklySummaries(history, 7);
  const limitPercent = Math.min(100, (daySummary.totalHours / Math.max(limitHours, 0.1)) * 100);
  const overLimit = daySummary.totalHours > limitHours;

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const limit = await ScreenTimeService.getDailyLimit(user.id);
      setLimitHours(limit);
      setLimitInput(String(limit));

      const { data: progress } = await DailyProgressService.getTodayProgress(user.id);
      setFocusHoursToday(progress?.focus_time_hours ?? 0);

      const [{ data: logs }, { data: hist }] = await Promise.all([
        ScreenTimeService.getLogsForDate(user.id, selectedDate),
        ScreenTimeService.getHistory(user.id, 7),
      ]);
      setDayLogs(logs);
      setHistory(hist);
      setStats(ScreenTimeService.computeStats(hist, limit));
    } catch (e) {
      console.error('[ScreenTime] load error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (focusRef.current) clearInterval(focusRef.current);
    };
  }, []);

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    const next = d.toISOString().split('T')[0];
    if (next > today) return;
    setSelectedDate(next);
  };

  const handleSaveLog = async () => {
    if (!user?.id) {
      Alert.alert('SIGN IN REQUIRED', isDemoMode ? 'Demo mode cannot save screen time.' : 'Please sign in to log screen time.');
      return;
    }
    const hours = parseFloat(logHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      Alert.alert('INVALID', 'Enter hours between 0 and 24.');
      return;
    }

    setIsSaving(true);
    const { error } = await ScreenTimeService.logCategoryTime(user.id, {
      log_date: selectedDate,
      category: logCategory,
      hours,
      notes: logNotes.trim() || undefined,
    });
    setIsSaving(false);

    if (error) {
      Alert.alert(
        'SAVE FAILED',
        error.message?.includes('screen_time_logs')
          ? 'Run the screen_time_logs migration in supabase_setup.sql.'
          : error.message ?? 'Could not save.',
      );
      return;
    }

    setShowLogModal(false);
    setLogHours('');
    setLogNotes('');
    loadData();
  };

  const handleSetLimit = async () => {
    if (!user?.id) return;
    const hours = parseFloat(limitInput);
    if (isNaN(hours) || hours < 1 || hours > 16) {
      Alert.alert('INVALID', 'Limit must be between 1 and 16 hours.');
      return;
    }
    await ScreenTimeService.setDailyLimit(user.id, hours);
    setLimitHours(hours);
    setShowLimitModal(false);
    loadData();
  };

  const startFocus = () => {
    if (focusRunning) return;
    setFocusSecondsLeft(focusMinutes * 60);
    setFocusRunning(true);
    focusRef.current = setInterval(() => {
      setFocusSecondsLeft(prev => {
        if (prev <= 1) {
          if (focusRef.current) clearInterval(focusRef.current);
          setFocusRunning(false);
          onFocusComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseFocus = () => {
    if (focusRef.current) clearInterval(focusRef.current);
    setFocusRunning(false);
  };

  const resetFocus = () => {
    if (focusRef.current) clearInterval(focusRef.current);
    setFocusRunning(false);
    setFocusSecondsLeft(focusMinutes * 60);
  };

  const onFocusComplete = async () => {
    Alert.alert('FOCUS COMPLETE', `Great work — ${focusMinutes} minutes of deep focus logged.`);
    if (user?.id) {
      await ScreenTimeService.addFocusTime(user.id, focusMinutes);
      loadData();
    }
  };

  const formatFocusTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const openLogForCategory = (cat: ScreenTimeCategory) => {
    const existing = dayLogs.find(l => l.category === cat);
    setLogCategory(cat);
    setLogHours(existing ? String(existing.hours) : '');
    setLogNotes(existing?.notes ?? '');
    setShowLogModal(true);
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>LOADING SCREEN TIME...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>SCREEN TIME</Text>
        <Text style={styles.subtitle}>Track usage, set limits, and run focus sessions</Text>

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

        <HudContainer style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Smartphone color={theme.colors.primary} size={28} />
            <View style={styles.heroStats}>
              <Text style={[styles.heroHours, overLimit && styles.heroOver]}>
                {daySummary.totalHours}h
              </Text>
              <Text style={styles.heroMeta}>
                {overLimit ? 'OVER DAILY LIMIT' : `${limitHours - daySummary.totalHours > 0 ? (limitHours - daySummary.totalHours).toFixed(1) : 0}h remaining`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowLimitModal(true)} style={styles.limitBadge}>
              <Target color={theme.colors.primary} size={14} />
              <Text style={styles.limitText}>{limitHours}h limit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                overLimit && styles.progressOver,
                { width: `${limitPercent}%` },
              ]}
            />
          </View>
        </HudContainer>

        <SectionHeader title="By Category" icon={<Smartphone color={theme.colors.primary} size={14} />} />
        <View style={styles.categoryGrid}>
          {SCREEN_TIME_CATEGORIES.map(cat => {
            const hours = daySummary.byCategory[cat.id];
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => openLogForCategory(cat.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={[styles.categoryHours, { color: cat.color }]}>
                  {hours > 0 ? `${hours}h` : '—'}
                </Text>
                <Text style={styles.categoryTap}>TAP TO LOG</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionHeader title="Focus Mode" icon={<Timer color={theme.colors.primary} size={14} />} />
        <Card style={styles.focusCard}>
          <View style={styles.focusPresets}>
            {FOCUS_PRESETS.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.presetBtn, focusMinutes === m && styles.presetBtnActive]}
                onPress={() => {
                  if (!focusRunning) {
                    setFocusMinutes(m);
                    setFocusSecondsLeft(m * 60);
                  }
                }}
              >
                <Text style={[styles.presetText, focusMinutes === m && styles.presetTextActive]}>{m}m</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.focusTimer}>
            {formatFocusTime(focusRunning || focusSecondsLeft > 0 ? focusSecondsLeft : focusMinutes * 60)}
          </Text>
          <Text style={styles.focusLogged}>Focus logged today: {focusHoursToday.toFixed(1)}h</Text>
          <View style={styles.focusActions}>
            {!focusRunning ? (
              <TouchableOpacity style={styles.focusPlayBtn} onPress={startFocus}>
                <Play color={theme.colors.background} size={20} fill={theme.colors.background} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.focusPauseBtn} onPress={pauseFocus}>
                <Pause color={theme.colors.primary} size={20} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.focusResetBtn} onPress={resetFocus}>
              <RotateCcw color={theme.colors.textDimmed} size={18} />
            </TouchableOpacity>
          </View>
        </Card>

        {stats && stats.daysLogged > 0 && (
          <>
            <SectionHeader title="Weekly Trends" icon={<TrendingUp color={theme.colors.primary} size={14} />} />
            <Card style={styles.trendCard}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.avgDailyHours}h</Text>
                  <Text style={styles.statLabel}>AVG / DAY</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.daysLogged}</Text>
                  <Text style={styles.statLabel}>DAYS LOGGED</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stats.topCategory
                      ? SCREEN_TIME_CATEGORIES.find(c => c.id === stats.topCategory)?.label.slice(0, 6) ?? '—'
                      : '—'}
                  </Text>
                  <Text style={styles.statLabel}>TOP CAT.</Text>
                </View>
              </View>
              {weeklySummaries.map(day => (
                <View key={day.date} style={styles.trendRow}>
                  <Text style={styles.trendDate}>
                    {day.date === today ? 'Today' : formatDateLabel(day.date).slice(0, 6)}
                  </Text>
                  <View style={styles.trendBarTrack}>
                    <View
                      style={[
                        styles.trendBarFill,
                        {
                          width: `${Math.min(100, (day.totalHours / Math.max(limitHours, 1)) * 100)}%`,
                          backgroundColor: day.totalHours > limitHours ? theme.colors.danger : theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendHours}>{day.totalHours}h</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Lightbulb color={theme.colors.warning} size={16} />
            <Text style={styles.tipTitle}>DIGITAL WELLNESS</Text>
          </View>
          <Text style={styles.tipBody}>{WELLNESS_TIPS[new Date().getDay() % WELLNESS_TIPS.length]}</Text>
        </Card>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={showLogModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>LOG SCREEN TIME</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <X color={theme.colors.textDimmed} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>CATEGORY</Text>
            <View style={styles.categoryPickRow}>
              {SCREEN_TIME_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryPick, logCategory === cat.id && styles.categoryPickActive]}
                  onPress={() => setLogCategory(cat.id)}
                >
                  <Text style={[styles.categoryPickText, logCategory === cat.id && { color: cat.color }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <GlowInput
              label="HOURS"
              value={logHours}
              onChangeText={setLogHours}
              placeholder="e.g. 2.5"
              keyboardType="decimal-pad"
            />
            <GlowInput label="NOTES (OPTIONAL)" value={logNotes} onChangeText={setLogNotes} placeholder="Which apps?" />

            <Button title="SAVE" onPress={handleSaveLog} isLoading={isSaving} style={{ marginTop: theme.spacing.lg }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showLimitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>DAILY LIMIT</Text>
            <TextInput
              style={styles.limitInput}
              value={limitInput}
              onChangeText={setLimitInput}
              keyboardType="decimal-pad"
              placeholder="4"
              placeholderTextColor={theme.colors.textDimmed}
            />
            <Text style={styles.limitHint}>Max screen hours per day (1–16)</Text>
            <Button title="SET LIMIT" onPress={handleSetLimit} style={{ marginTop: theme.spacing.md }} />
            <Button title="CANCEL" variant="outline" onPress={() => setShowLimitModal(false)} style={{ marginTop: theme.spacing.sm }} />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.colors.textDimmed, letterSpacing: 2, fontSize: 12 },
  title: { fontSize: 22, fontWeight: '900', color: theme.colors.text.primary, letterSpacing: 3 },
  subtitle: { fontSize: 12, color: theme.colors.textDimmed, marginBottom: theme.spacing.lg },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md, gap: theme.spacing.lg },
  dateBtn: { padding: theme.spacing.sm },
  dateBtnDisabled: { opacity: 0.3 },
  dateLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, letterSpacing: 2, minWidth: 140, textAlign: 'center' },
  heroCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  heroStats: { flex: 1 },
  heroHours: { fontSize: 36, fontWeight: '900', color: theme.colors.primary },
  heroOver: { color: theme.colors.danger },
  heroMeta: { fontSize: 12, color: theme.colors.textDimmed, marginTop: 4 },
  limitBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.colors.ghostBorder, paddingHorizontal: 8, paddingVertical: 4 },
  limitText: { fontSize: 10, fontWeight: '700', color: theme.colors.primary },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 2 },
  progressOver: { backgroundColor: theme.colors.danger },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: theme.spacing.lg },
  categoryCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginBottom: theme.spacing.xs },
  categoryLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.textDimmed, letterSpacing: 1 },
  categoryHours: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  categoryTap: { fontSize: 8, color: theme.colors.textDimmed, marginTop: 4, letterSpacing: 1 },
  focusCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.lg, alignItems: 'center' },
  focusPresets: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  presetBtn: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  presetBtnActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(109, 221, 255, 0.1)' },
  presetText: { fontSize: 12, fontWeight: '700', color: theme.colors.textDimmed },
  presetTextActive: { color: theme.colors.primary },
  focusTimer: { fontSize: 48, fontWeight: '900', color: theme.colors.primary, letterSpacing: 2 },
  focusLogged: { fontSize: 11, color: theme.colors.textDimmed, marginBottom: theme.spacing.md },
  focusActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg },
  focusPlayBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
    ...theme.glow.cyan,
  },
  focusPauseBtn: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  focusResetBtn: { padding: theme.spacing.sm },
  trendCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: theme.spacing.lg },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: theme.colors.text.primary },
  statLabel: { fontSize: 8, color: theme.colors.textDimmed, letterSpacing: 1, marginTop: 4 },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, gap: theme.spacing.sm },
  trendDate: { width: 44, fontSize: 10, color: theme.colors.textDimmed },
  trendBarTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3 },
  trendBarFill: { height: '100%', borderRadius: 3 },
  trendHours: { width: 32, fontSize: 11, fontWeight: '700', color: theme.colors.text.primary, textAlign: 'right' },
  tipCard: { padding: theme.spacing.lg },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  tipTitle: { fontSize: 11, fontWeight: '700', color: theme.colors.warning, letterSpacing: 2 },
  tipBody: { fontSize: 12, color: theme.colors.textDimmed, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end', zIndex: 1000 },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    zIndex: 1001,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  modalTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text.primary, letterSpacing: 2 },
  inputLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textDimmed, letterSpacing: 1.5, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  categoryPickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  categoryPick: { paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: theme.colors.border },
  categoryPickActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(109, 221, 255, 0.08)' },
  categoryPickText: { fontSize: 10, fontWeight: '600', color: theme.colors.textDimmed },
  limitInput: {
    borderBottomWidth: 1, borderBottomColor: theme.colors.primary,
    color: theme.colors.text.primary, fontSize: 32, fontWeight: '900', textAlign: 'center', paddingVertical: theme.spacing.md,
  },
  limitHint: { fontSize: 11, color: theme.colors.textDimmed, textAlign: 'center', marginTop: theme.spacing.sm },
});
