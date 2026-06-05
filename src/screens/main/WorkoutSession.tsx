import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, Animated, Dimensions,
} from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { Card } from '../../components/ui/Card';
import { HudContainer } from '../../components/ui/HudContainer';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { theme } from '../../constants/theme';
import { useAuthContext } from '../../context/AuthContext';
import { WorkoutPlannerService } from '../../services/workoutPlannerService';
import type { CustomWorkoutPlan, CustomExercise } from '../../services/workoutPlannerService';
import {
  Play, Pause, Square, Clock, Flame, Dumbbell, Target,
  X, ChevronRight, Zap, Timer, CheckCircle2, AlertCircle,
  Trophy, Heart, Sparkles, Coffee, Pizza, BedDouble,
  MoreVertical, Plus,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Funny motivational messages
const FUNNY_MESSAGES = {
  start: [
    "Time to earn those gains! 💪",
    "Let's get sweaty! 🔥",
    "Your future self will thank you! 🚀",
    "Pain is weakness leaving the body! 💪",
    "No pain, no gain, no excuses! 🏋️",
    "Time to turn those calories into memories! 🎯",
  ],
  pause: [
    "Taking a breather? Smart move! 😴",
    "Rest is part of the process! ☕",
    "Even superheroes need a break! 🦸",
    "Hydrate, stretch, and dominate! 💧",
    "Quick pause before the glory! 🏆",
  ],
  resume: [
    "Back in the game! 🎮",
    "Let's finish what we started! 🏁",
    "No more slacking! Let's go! ⚡",
    "Time to crush it again! 💥",
    "The beast is back! 🦁",
  ],
  complete: [
    "You did it! You absolute legend! 🏆",
    "Workout complete! Time for pizza! 🍕",
    "You crushed it! Now go sleep! 😴",
    "Gains secured! Mission accomplished! ✅",
    "You're unstoppable! Keep it up! 🔥",
    "Another workout in the books! 📚",
  ],
  exerciseStart: [
    "Let's crush this exercise! 💪",
    "Time to feel the burn! 🔥",
    "Show this exercise who's boss! 👊",
    "One rep at a time! 🎯",
    "Focus and dominate! 🧠",
  ],
  exerciseComplete: [
    "Nailed it! 🎯",
    "One down, more to go! 📊",
    "That's how it's done! ✅",
    "Keep that momentum going! 🚀",
    "You're on fire! 🔥",
  ],
};

// Funny encouragement messages during rest
const REST_MESSAGES = [
  "Rest is where the magic happens! ✨",
  "Your muscles are growing right now! 🌱",
  "Breathe in, breathe out, repeat! 🌬️",
  "Quick check: are you still alive? Yes? Good! 💀",
  "Rest now, suffer later! 😈",
  "Hydrate or diedrate! 💧",
  "Think about how good you'll look! 🤔",
  "Your future six-pack says thanks! 🎁",
  "Rest is just training in disguise! 🎭",
  "Don't let the weights win! 🏋️",
];

// ─── Component ───────────────────────────────────────────────
export function WorkoutSession({ route, navigation }: any) {
  const { user } = useAuthContext();
  const { workoutId } = route.params;
  
  // Workout state
  const [workout, setWorkout] = useState<CustomWorkoutPlan | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [workoutStatus, setWorkoutStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [timer, setTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [completedSets, setCompletedSets] = useState<Record<string, number[]>>({});
  const [userReps, setUserReps] = useState<Record<string, number>>({});
  const [userWeight, setUserWeight] = useState<Record<string, number>>({});
  const [showMessage, setShowMessage] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showExerciseOptions, setShowExerciseOptions] = useState(false);
  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = useState<CustomExercise | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageAnimation = useRef(new Animated.Value(0)).current;

  // Load workout
  useEffect(() => {
    const loadedWorkout = WorkoutPlannerService.getWorkoutById(workoutId);
    if (loadedWorkout) {
      setWorkout(loadedWorkout);
      setTotalCalories(loadedWorkout.estimatedCalories || 0);
      setTotalDuration(loadedWorkout.duration || 0);
    }
  }, [workoutId]);

  // Main timer
  useEffect(() => {
    if (workoutStatus === 'running' && !isResting) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [workoutStatus, isResting]);

  // Rest timer
  useEffect(() => {
    if (isResting && restTimer > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    }
    
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting, restTimer]);

  // Show random message
  const showMessageWithAnimation = (messages: string[]) => {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCurrentMessage(randomMessage);
    setShowMessage(true);
    
    messageAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(messageAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(messageAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMessage(false);
    });
  };

  const handleStartWorkout = () => {
    setWorkoutStatus('running');
    showMessageWithAnimation(FUNNY_MESSAGES.start);
  };

  const handlePauseWorkout = () => {
    setWorkoutStatus('paused');
    showMessageWithAnimation(FUNNY_MESSAGES.pause);
  };

  const handleResumeWorkout = () => {
    setWorkoutStatus('running');
    showMessageWithAnimation(FUNNY_MESSAGES.resume);
  };

  const handleCompleteWorkout = () => {
    setWorkoutStatus('completed');
    showMessageWithAnimation(FUNNY_MESSAGES.complete);
    
    // Save workout session
    if (user && workout) {
      // Session is tracked by the service automatically
      console.log('Workout completed:', {
        userId: user.id,
        workoutPlanId: workout.id,
        totalDuration: Math.floor(timer / 60),
        totalCalories: totalCalories,
        completedExercises: workout.exercises.length,
      });
    }
    
    setTimeout(() => {
      navigation.goBack();
    }, 3000);
  };

  const handleCompleteSet = () => {
    const currentExercise = workout?.exercises[currentExerciseIndex];
    if (!currentExercise) return;
    
    // Record completed set
    setCompletedSets(prev => ({
      ...prev,
      [currentExercise.id]: [...(prev[currentExercise.id] || []), currentSet],
    }));
    
    // Check if all sets are complete
    const totalSets = currentExercise.sets || 3;
    if (currentSet >= totalSets) {
      showMessageWithAnimation(FUNNY_MESSAGES.exerciseComplete);
      
      // Move to next exercise or complete workout
      if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        setIsResting(true);
        setRestTimer(currentExercise.restTime || 60);
        showMessageWithAnimation(REST_MESSAGES);
      } else {
        handleCompleteWorkout();
      }
    } else {
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
      setRestTimer(currentExercise.restTime || 60);
      showMessageWithAnimation(REST_MESSAGES);
    }
  };

  const handleSkipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };

  const handleUpdateReps = (exerciseId: string, reps: number) => {
    setUserReps(prev => ({ ...prev, [exerciseId]: reps }));
  };

  const handleUpdateWeight = (exerciseId: string, weight: number) => {
    setUserWeight(prev => ({ ...prev, [exerciseId]: weight }));
  };

  const handleExerciseOptions = (exercise: CustomExercise) => {
    setSelectedExerciseForEdit(exercise);
    setShowExerciseOptions(true);
  };

  const handleRemoveExercise = () => {
    if (!selectedExerciseForEdit || !workout) return;
    
    Alert.alert(
      'REMOVE EXERCISE',
      `Remove ${selectedExerciseForEdit.name} from this workout?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'REMOVE',
          style: 'destructive',
          onPress: () => {
            const updatedExercises = workout.exercises.filter(ex => ex.id !== selectedExerciseForEdit?.id);
            setWorkout({ ...workout, exercises: updatedExercises });
            setShowExerciseOptions(false);
            setSelectedExerciseForEdit(null);
          },
        },
      ]
    );
  };

  const handleModifyExercise = () => {
    setShowExerciseOptions(false);
    Alert.alert('MODIFY EXERCISE', 'Modify exercise functionality coming soon!');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = workout?.exercises[currentExerciseIndex];
  const progress = workout ? ((currentExerciseIndex + 1) / workout.exercises.length) * 100 : 0;

  if (!workout) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>LOADING WORKOUT...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        
        {/* Header with Timer */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => {
              if (workoutStatus === 'running') {
                Alert.alert(
                  'EXIT WORKOUT?',
                  'Your progress will be lost. Are you sure?',
                  [
                    { text: 'CANCEL', style: 'cancel' },
                    { text: 'EXIT', style: 'destructive', onPress: () => navigation.goBack() },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}>
              <X color={theme.colors.textDimmed} size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{workout.name}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {/* Digital Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Current Exercise Card */}
          {currentExercise && (
            <Card variant="glow" style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>EXERCISE {currentExerciseIndex + 1}</Text>
                <Text style={styles.exerciseName}>{currentExercise.name}</Text>
              </View>
              
              {/* Exercise Details */}
              <View style={styles.exerciseDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>SETS</Text>
                  <Text style={styles.detailValue}>
                    {currentSet}/{currentExercise.sets || 3}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>REPS</Text>
                  <View style={styles.detailInput}>
                    <TextInput
                      style={styles.input}
                      value={String(userReps[currentExercise.id] || currentExercise.reps || 12)}
                      onChangeText={(text) => handleUpdateReps(currentExercise.id, parseInt(text) || 12)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>WEIGHT</Text>
                  <View style={styles.detailInput}>
                    <TextInput
                      style={styles.input}
                      value={String(userWeight[currentExercise.id] || (currentExercise as any).weight || 0)}
                      onChangeText={(text) => handleUpdateWeight(currentExercise.id, parseInt(text) || 0)}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                    <Text style={styles.unit}>kg</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>REST</Text>
                  <Text style={styles.detailValue}>
                    {currentExercise.restTime || 60}s
                  </Text>
                </View>
              </View>
              
              {/* Instructions */}
              {currentExercise.instructions && (
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsTitle}>INSTRUCTIONS</Text>
                  <Text style={styles.instructionsText}>{currentExercise.instructions}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Rest Timer */}
          {isResting && (
            <Card style={styles.restCard}>
              <View style={styles.restContent}>
                <Timer color={theme.colors.primary} size={32} />
                <Text style={styles.restTitle}>REST TIME</Text>
                <Text style={styles.restTimer}>{formatTime(restTimer)}</Text>
                <TouchableOpacity
                  style={styles.skipRestBtn}
                  onPress={handleSkipRest}
                >
                  <Text style={styles.skipRestText}>SKIP REST</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Exercise List */}
          <View style={styles.exercisesList}>
            <TouchableOpacity style={styles.addExercisesBtn} onPress={() => {}}>
              <Plus color={theme.colors.primary} size={16} />
              <Text style={styles.addExercisesText}>Add Exercises</Text>
            </TouchableOpacity>
            
            {workout.exercises.map((exercise, index) => {
              const exerciseCompletedSets = completedSets[exercise.id]?.length || 0;
              const totalSets = exercise.sets || 3;
              return (
                <TouchableOpacity
                  key={exercise.id}
                  style={[
                    styles.exerciseListItem,
                    index === currentExerciseIndex && styles.exerciseListItemActive,
                  ]}
                  onPress={() => handleExerciseOptions(exercise)}
                  activeOpacity={0.7}
                >
                  <View style={styles.exerciseListItemLeft}>
                    <View style={styles.exerciseImage}>
                      <Dumbbell color={theme.colors.primary} size={20} />
                    </View>
                    <View style={styles.exerciseListItemInfo}>
                      <Text style={styles.exerciseListItemName}>{exercise.name}</Text>
                      <Text style={styles.exerciseListItemProgress}>
                        {exerciseCompletedSets}/{totalSets} done
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.exerciseMenuBtn} onPress={() => handleExerciseOptions(exercise)}>
                    <MoreVertical color={theme.colors.textDimmed} size={20} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Action Button */}
        <View style={styles.fabContainer}>
          {workoutStatus === 'idle' && (
            <TouchableOpacity style={styles.fab} onPress={handleStartWorkout}>
              <Play color={theme.colors.background} size={28} />
            </TouchableOpacity>
          )}
          
          {workoutStatus === 'running' && !isResting && (
            <TouchableOpacity style={styles.fab} onPress={handleCompleteSet}>
              <CheckCircle2 color={theme.colors.background} size={28} />
            </TouchableOpacity>
          )}
          
          {workoutStatus === 'paused' && (
            <TouchableOpacity style={styles.fab} onPress={handleResumeWorkout}>
              <Play color={theme.colors.background} size={28} />
            </TouchableOpacity>
          )}
          
          {workoutStatus === 'completed' && (
            <TouchableOpacity style={styles.fab} onPress={() => navigation.goBack()}>
              <CheckCircle2 color={theme.colors.background} size={28} />
            </TouchableOpacity>
          )}
        </View>

        {/* Funny Message Overlay */}
        {showMessage && (
          <Animated.View style={[styles.messageOverlay, { opacity: messageAnimation }]}>
            <Card style={styles.messageCard}>
              <Sparkles color={theme.colors.primary} size={24} />
              <Text style={styles.messageText}>{currentMessage}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Exercise Options Modal */}
        <Modal visible={showExerciseOptions} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowExerciseOptions(false)}
          >
            <View style={styles.optionsModalContent}>
              <TouchableOpacity style={styles.optionItem} onPress={handleModifyExercise}>
                <Text style={styles.optionItemText}>Modify Exercise</Text>
              </TouchableOpacity>
              <View style={styles.optionDivider} />
              <TouchableOpacity style={[styles.optionItem, styles.optionItemDanger]} onPress={handleRemoveExercise}>
                <Text style={[styles.optionItemText, styles.optionItemTextDanger]}>Remove Exercise</Text>
              </TouchableOpacity>
              <View style={styles.optionDivider} />
              <TouchableOpacity style={styles.optionItem} onPress={() => setShowExerciseOptions(false)}>
                <Text style={styles.optionItemText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ScreenWrapper>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textDimmed,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
  
  // Header
  header: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 2,
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 4,
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  
  // Exercise card
  exerciseCard: {
    marginBottom: theme.spacing.lg,
  },
  exerciseHeader: {
    marginBottom: theme.spacing.md,
  },
  exerciseNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 2,
    marginBottom: theme.spacing.xs,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  exerciseDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textDimmed,
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  detailInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  input: {
    width: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    paddingVertical: 2,
  },
  unit: {
    fontSize: 12,
    color: theme.colors.textDimmed,
  },
  instructionsContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  instructionsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textDimmed,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
  },
  instructionsText: {
    fontSize: 12,
    color: theme.colors.textDimmed,
    lineHeight: 18,
  },
  
  // Rest card
  restCard: {
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(109, 221, 255, 0.1)',
    borderColor: theme.colors.primary,
  },
  restContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  restTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textDimmed,
    letterSpacing: 2,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  restTimer: {
    fontSize: 48,
    fontWeight: '900',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  skipRestBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.border.radius.sm,
  },
  skipRestText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  
  // Exercise list
  exercisesList: {
    marginBottom: theme.spacing.lg,
  },
  addExercisesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.border.radius.md,
    marginBottom: theme.spacing.md,
  },
  addExercisesText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  exerciseListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.border.radius.md,
  },
  exerciseListItemActive: {
    backgroundColor: 'rgba(109, 221, 255, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  exerciseListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(109, 221, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  exerciseListItemInfo: {
    flex: 1,
  },
  exerciseListItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  exerciseListItemProgress: {
    fontSize: 12,
    color: theme.colors.textDimmed,
  },
  exerciseMenuBtn: {
    padding: theme.spacing.sm,
  },

  // Exercise Options Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  optionsModalContent: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 2,
    borderTopColor: theme.colors.primary,
    paddingBottom: theme.spacing.xxl,
  },
  optionItem: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  optionItemDanger: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
  },
  optionItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  optionItemTextDanger: {
    color: theme.colors.danger,
  },
  optionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  
  // Floating Action Button
  fabContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Message overlay
  messageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    pointerEvents: 'none',
  },
  messageCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
