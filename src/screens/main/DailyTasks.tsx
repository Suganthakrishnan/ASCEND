import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { HudContainer } from '../../components/ui/HudContainer';
import { Button } from '../../components/ui/Button';
import { StatBar } from '../../components/ui/StatBar';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { GlowInput } from '../../components/ui/GlowInput';
import { theme } from '../../constants/theme';
import { useAuthContext } from '../../context/AuthContext';
import { TaskService, DailyTask, TaskDifficulty, TaskType, XP_REWARDS } from '../../services/taskService';
import {
  Plus, CheckCircle, Circle, Trash2, X, Trophy, Calendar, Edit3, Filter,
} from 'lucide-react-native';

const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy: 'EASY',
  medium: 'INTERMEDIATE',
  hard: 'HARD',
};

export const DailyTasks = React.memo(function DailyTasks() {
  const { user } = useAuthContext();
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [deadlineTasks, setDeadlineTasks] = useState<DailyTask[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateChip, setSelectedDateChip] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'daily' | 'deadline'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Screen entry animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<TaskDifficulty>('medium');
  const [newTaskType, setNewTaskType] = useState<TaskType>('daily');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // Edit task form state
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskDifficulty, setEditTaskDifficulty] = useState<TaskDifficulty>('medium');
  const [editTaskDeadline, setEditTaskDeadline] = useState('');

  useEffect(() => {
    loadTasks();
  }, [user, selectedDate]);

  const loadTasks = async () => {
    if (!user?.id) {
      setDailyTasks([]);
      setDeadlineTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const today = new Date().toISOString().split('T')[0];
      if (selectedDate === today) {
        const { totalPenalty, error: penaltyError } = await TaskService.processOverdueTaskPenalties(user.id);
        if (penaltyError) {
          console.error('Error applying overdue penalties:', penaltyError);
        } else if (totalPenalty > 0) {
          Alert.alert('XP PENALTY APPLIED', `-${totalPenalty} XP for unfinished quests from previous day.`);
        }

        const { error: defaultTaskError } = await TaskService.ensureDefaultLoginTask(user.id, selectedDate);
        if (defaultTaskError) {
          console.error('Error ensuring default login quest:', defaultTaskError);
        }
      }

      const { data: dailyData } = await TaskService.getUserTasks(user.id, selectedDate);
      const { data: deadlineData } = await TaskService.getDeadlineTasks(user.id);
      setDailyTasks(dailyData.filter(t => t.task_type === 'daily'));
      setDeadlineTasks(deadlineData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completedDailyTasks = React.useMemo(() => dailyTasks.filter(t => t.completed), [dailyTasks]);
  const completedDailyCount = React.useMemo(() => completedDailyTasks.length, [completedDailyTasks]);
  const totalDailyXPEarned = React.useMemo(() => completedDailyTasks.reduce((sum, t) => sum + t.xp_reward, 0), [completedDailyTasks]);

  const completedDeadlineTasks = React.useMemo(() => deadlineTasks.filter(t => t.completed), [deadlineTasks]);
  const completedDeadlineCount = React.useMemo(() => completedDeadlineTasks.length, [completedDeadlineTasks]);
  const totalDeadlineXPEarned = React.useMemo(() => completedDeadlineTasks.reduce((sum, t) => sum + t.xp_reward, 0), [completedDeadlineTasks]);

  const totalCompletedCount = React.useMemo(() => completedDailyCount + completedDeadlineCount, [completedDailyCount, completedDeadlineCount]);
  const totalXPEarned = React.useMemo(() => totalDailyXPEarned + totalDeadlineXPEarned, [totalDailyXPEarned, totalDeadlineXPEarned]);

  const openTaskCompletion = React.useCallback((task: DailyTask) => {
    if (task.completed) return;
    setSelectedTask(task);
  }, []);

  const markSelectedTaskAsFinished = async () => {
    if (!user?.id || !selectedTask) return;

    try {
      await TaskService.completeTask(selectedTask.id, user.id);
      Alert.alert('QUEST COMPLETE!', `You earned +${selectedTask.xp_reward} XP!`);
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('ERROR', 'Could not mark quest as finished. Please try again.');
    }
  };

  const deleteTask = async (taskId: string) => {
    Alert.alert(
      'DELETE TASK',
      'Are you sure you want to delete this task?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            try {
              await TaskService.deleteTask(taskId, user?.id);
              loadTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('ERROR', 'Could not delete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAddTask = async () => {
    if (!user?.id || !newTaskTitle.trim()) {
      Alert.alert('ERROR', 'Please enter a task title');
      return;
    }

    if (newTaskType === 'deadline' && !newTaskDeadline) {
      Alert.alert('ERROR', 'Please select a deadline date');
      return;
    }

    try {
      const xpReward = XP_REWARDS[newTaskDifficulty];
      await TaskService.createTask(user.id, {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        difficulty: newTaskDifficulty,
        xp_reward: xpReward,
        task_date: newTaskType === 'daily' ? selectedDate : newTaskDeadline,
        deadline_date: newTaskType === 'deadline' ? newTaskDeadline : null,
        task_type: newTaskType,
      });

      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDifficulty('medium');
      setNewTaskType('daily');
      setNewTaskDeadline('');
      setShowAddModal(false);
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('ERROR', 'Could not create task. Please try again.');
    }
  };

  const getDifficultyColor = React.useCallback((difficulty: TaskDifficulty) => {
    switch (difficulty) {
      case 'easy': return theme.colors.success;
      case 'medium': return theme.colors.gold;
      case 'hard': return theme.colors.danger;
    }
  }, []);

  // Generate date chips (last 7 days)
  const getDateChips = () => {
    const chips = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      chips.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      });
    }
    return chips;
  };

  const dateChips = React.useMemo(() => getDateChips(), []);

  const openEditModal = (task: DailyTask) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskDifficulty(task.difficulty);
    setEditTaskDeadline(task.deadline_date || '');
    setShowEditModal(true);
  };

  const handleEditTask = async () => {
    if (!user?.id || !editingTask || !editTaskTitle.trim()) {
      Alert.alert('ERROR', 'Please enter a task title');
      return;
    }

    if (editingTask.task_type === 'deadline' && !editTaskDeadline) {
      Alert.alert('ERROR', 'Please select a deadline date');
      return;
    }

    try {
      const xpReward = XP_REWARDS[editTaskDifficulty];
      await TaskService.updateTask(editingTask.id, {
        title: editTaskTitle.trim(),
        description: editTaskDescription.trim() || null,
        difficulty: editTaskDifficulty,
        xp_reward: xpReward,
        deadline_date: editingTask.task_type === 'deadline' ? editTaskDeadline : null,
      }, user.id);

      setShowEditModal(false);
      setEditingTask(null);
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('ERROR', 'Could not update task. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>LOADING TASKS...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const allComplete = (dailyTasks.length > 0 && dailyTasks.every(t => t.completed)) &&
                     (deadlineTasks.length > 0 && deadlineTasks.every(t => t.completed));

  // FIX 2: Only show "All Complete" banner when no modal is open
  const showAllCompleteBanner = allComplete && !showAddModal && !showEditModal && !selectedTask;

  return (
    <ScreenWrapper>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* Date Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateChipsRow}
          >
            {dateChips.map((chip, index) => (
              <TouchableOpacity
                key={chip.date}
                style={[
                  styles.dateChip,
                  selectedDateChip === index && styles.dateChipActive,
                ]}
                onPress={() => {
                  setSelectedDateChip(index);
                  setSelectedDate(chip.date);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateChipText,
                  selectedDateChip === index && styles.dateChipTextActive,
                ]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category Filter Chips */}
          <View style={styles.categoryChipsRow}>
            {[
              { key: 'all', label: 'ALL', color: '#00E5FF' },
              { key: 'daily', label: 'DAILY', color: '#BF5AF2' },
              { key: 'deadline', label: 'DEADLINE', color: '#FF9F0A' },
            ].map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '15' },
                ]}
                onPress={() => setSelectedCategory(cat.key as any)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === cat.key && { color: cat.color },
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Progress Summary */}
          <HudContainer active style={styles.summaryHud}>
            <View style={styles.summaryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>QUESTS COMPLETED</Text>
                <Text style={styles.summaryValue}>
                  {totalCompletedCount} <Text style={styles.summaryMax}>/ {dailyTasks.length + deadlineTasks.length}</Text>
                </Text>
              </View>
              <View style={styles.xpEarned}>
                <Text style={styles.xpEarnedValue}>+{totalXPEarned}</Text>
                <Text style={styles.xpEarnedLabel}>XP</Text>
              </View>
            </View>
            <StatBar
              label="Progress"
              current={totalCompletedCount}
              max={dailyTasks.length + deadlineTasks.length || 1}
              color={theme.colors.primary}
              showValues={false}
              style={{ marginTop: theme.spacing.sm, marginBottom: 0 }}
            />
          </HudContainer>

          {/* FIX 2: All Complete State — hidden when any modal is open */}
          {showAllCompleteBanner && (
            <HudContainer style={styles.completeCard} accentColor={theme.colors.success}>
              <Trophy color={theme.colors.success} size={32} />
              <Text style={styles.completeTitle}>ALL TASKS COMPLETE</Text>
              <Text style={styles.completeSubtitle}>BONUS XP EARNED: +{Math.round(totalXPEarned * 0.2)}</Text>
            </HudContainer>
          )}

          {/* Daily Tasks Section */}
          {(selectedCategory === 'all' || selectedCategory === 'daily') && (
            <>
              <SectionHeader
                title="Daily Tasks"
                icon={<Calendar color={theme.colors.primary} size={14} />}
              />
              {dailyTasks.length > 0 ? (
                dailyTasks.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    style={{
                      opacity: fadeAnim,
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [16 * (index % 5), 0],
                        }),
                      }],
                    }}
                  >
                    <TaskCard
                      task={item}
                      onPress={() => openTaskCompletion(item)}
                      onDelete={() => deleteTask(item.id)}
                      onEdit={() => openEditModal(item)}
                      getDifficultyColor={getDifficultyColor}
                    />
                  </Animated.View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>NO DAILY TASKS</Text>
                </View>
              )}
            </>
          )}

          {/* Deadline Tasks Section */}
          {(selectedCategory === 'all' || selectedCategory === 'deadline') && (
            <>
              <SectionHeader
                title="Deadline Tasks"
                icon={<Calendar color={theme.colors.warning} size={14} />}
              />
              {deadlineTasks.length > 0 ? (
                deadlineTasks.map((item, index) => (
                  <Animated.View
                    key={item.id}
                    style={{
                      opacity: fadeAnim,
                      transform: [{
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [16 * (index % 5), 0],
                        }),
                      }],
                    }}
                  >
                    <TaskCard
                      task={item}
                      onPress={() => openTaskCompletion(item)}
                      onDelete={() => deleteTask(item.id)}
                      onEdit={() => openEditModal(item)}
                      getDifficultyColor={getDifficultyColor}
                      showDeadline
                    />
                  </Animated.View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>NO DEADLINE TASKS</Text>
                </View>
              )}
            </>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Add Task FAB */}
        <Button
          variant="fab"
          title=""
          icon={<Plus color="#080B12" size={28} />}
          onPress={() => setShowAddModal(true)}
        />

        {/* Add Task Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>NEW TASK</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <X color={theme.colors.text.secondary} size={24} />
                </TouchableOpacity>
              </View>

              <GlowInput
                label="TITLE *"
                placeholder="Enter task title"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                autoFocus
              />

              <GlowInput
                label="DESCRIPTION"
                placeholder="Optional description"
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
                multiline
                numberOfLines={3}
                style={styles.textAreaInput}
              />

              <Text style={styles.inputLabel}>TASK TYPE</Text>
              <View style={styles.optionRow}>
                {(['daily', 'deadline'] as TaskType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionBtn,
                      newTaskType === type && styles.optionBtnActive,
                    ]}
                    onPress={() => setNewTaskType(type)}
                    activeOpacity={1}
                  >
                    <Text style={[
                      styles.optionText,
                      newTaskType === type && styles.optionTextActive,
                    ]}>
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {newTaskType === 'deadline' && (
                <GlowInput
                  label="DEADLINE DATE"
                  placeholder="YYYY-MM-DD"
                  value={newTaskDeadline}
                  onChangeText={setNewTaskDeadline}
                />
              )}

              <Text style={styles.inputLabel}>DIFFICULTY</Text>
              <View style={styles.optionRow}>
                {(['easy', 'medium', 'hard'] as TaskDifficulty[]).map(diff => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.optionBtn,
                      newTaskDifficulty === diff && styles.optionBtnActive,
                      { borderColor: getDifficultyColor(diff) },
                      newTaskDifficulty === diff && { backgroundColor: getDifficultyColor(diff) + '20' },
                    ]}
                    onPress={() => setNewTaskDifficulty(diff)}
                    activeOpacity={1}
                  >
                    <Text style={[
                      styles.optionText,
                      newTaskDifficulty === diff && styles.optionTextActive,
                      { color: newTaskDifficulty === diff ? getDifficultyColor(diff) : theme.colors.text.secondary },
                    ]}>
                      {DIFFICULTY_LABELS[diff]}
                    </Text>
                    <Text style={styles.xpPreview}>+{XP_REWARDS[diff]} XP</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="CREATE TASK"
                onPress={handleAddTask}
                style={styles.createButton}
              />
            </View>
          </BlurView>
        </Modal>

        {/* FIX 4: Task Completion Modal — centered, not bottom-sheet */}
        <Modal
          visible={!!selectedTask}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedTask(null)}
        >
          <View style={[styles.modalOverlay, { justifyContent: 'center' }]}>
            <View style={styles.finishModalContent}>
              <Text style={styles.finishModalTitle}>FINISH QUEST?</Text>
              <Text style={styles.finishTaskTitle}>{selectedTask?.title}</Text>
              {!!selectedTask?.description && (
                <Text style={styles.finishTaskDescription}>{selectedTask.description}</Text>
              )}
              <Text style={styles.finishXpText}>Reward: +{selectedTask?.xp_reward ?? 0} XP</Text>

              <View style={styles.finishActions}>
                <Button
                  title="CANCEL"
                  variant="secondary"
                  onPress={() => setSelectedTask(null)}
                  style={styles.finishActionButton}
                />
                <Button
                  title="FINISHED"
                  onPress={markSelectedTaskAsFinished}
                  style={styles.finishActionButton}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Task Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>EDIT TASK</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X color={theme.colors.text.secondary} size={24} />
                </TouchableOpacity>
              </View>

              <GlowInput
                label="TITLE *"
                placeholder="Enter task title"
                value={editTaskTitle}
                onChangeText={setEditTaskTitle}
              />

              <GlowInput
                label="DESCRIPTION"
                placeholder="Optional description"
                value={editTaskDescription}
                onChangeText={setEditTaskDescription}
                multiline
                numberOfLines={3}
                style={styles.textAreaInput}
              />

              {editingTask?.task_type === 'deadline' && (
                <GlowInput
                  label="DEADLINE DATE"
                  placeholder="YYYY-MM-DD"
                  value={editTaskDeadline}
                  onChangeText={setEditTaskDeadline}
                />
              )}

              <Text style={styles.inputLabel}>DIFFICULTY</Text>
              <View style={styles.optionRow}>
                {(['easy', 'medium', 'hard'] as TaskDifficulty[]).map(diff => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.optionBtn,
                      editTaskDifficulty === diff && styles.optionBtnActive,
                      { borderColor: getDifficultyColor(diff) },
                      editTaskDifficulty === diff && { backgroundColor: getDifficultyColor(diff) + '20' },
                    ]}
                    onPress={() => setEditTaskDifficulty(diff)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.optionText,
                      editTaskDifficulty === diff && styles.optionTextActive,
                      { color: editTaskDifficulty === diff ? getDifficultyColor(diff) : theme.colors.text.secondary },
                    ]}>
                      {DIFFICULTY_LABELS[diff]}
                    </Text>
                    <Text style={styles.xpPreview}>+{XP_REWARDS[diff]} XP</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="UPDATE TASK"
                onPress={handleEditTask}
                style={styles.createButton}
              />
            </View>
          </BlurView>
        </Modal>
      </Animated.View>
    </ScreenWrapper>
  );
});

// Task Card Component
function TaskCard({
  task,
  onPress,
  onDelete,
  onEdit,
  getDifficultyColor,
  showDeadline = false,
}: {
  task: DailyTask;
  onPress: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  getDifficultyColor: (diff: TaskDifficulty) => string;
  showDeadline?: boolean;
}) {
  const difficultyColor = getDifficultyColor(task.difficulty);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <HudContainer
        blurEnabled={false}
        style={[styles.taskCard, { borderLeftWidth: 3, borderLeftColor: difficultyColor }]}
        accentColor={difficultyColor}
      >
        <View style={styles.taskCheckArea}>
          {task.completed ? (
            <CheckCircle color={theme.colors.success} size={24} />
          ) : (
            <Circle color={theme.colors.text.secondary} size={24} />
          )}
        </View>

        <View style={styles.taskBody}>
          <View style={[styles.taskTextBackground, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <View style={styles.taskTitleRow}>
              <Text
                style={[
                  styles.taskTitle,
                  task.completed && styles.taskTitleDone,
                ]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <View style={[styles.taskDifficultyBadge, { backgroundColor: difficultyColor + '20' }]}>
                <Text style={[styles.taskDifficultyText, { color: difficultyColor }]}>
                  {DIFFICULTY_LABELS[task.difficulty]}
                </Text>
              </View>
            </View>
            {task.description ? (
              <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
            ) : null}
            {showDeadline && task.deadline_date ? (
              <Text style={styles.deadlineText}>
                Due: {new Date(task.deadline_date).toLocaleDateString()}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.taskRight}>
          <View style={[styles.taskXpBadge, task.completed && { opacity: 0.4 }]}>
            <Text style={styles.taskXpText}>+{task.xp_reward}</Text>
          </View>
          {onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={onEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Edit3 color={theme.colors.primary} size={16} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Trash2 color={theme.colors.text.secondary} size={16} />
          </TouchableOpacity>
        </View>
      </HudContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.lg },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: theme.spacing.md,
  },

  // Date Chips
  dateChipsRow: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  dateChip: {
    height: theme.touch.chipHeight,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.border.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.bg.glassBorder,
    backgroundColor: theme.colors.bg.glass,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '15',
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1,
  },
  dateChipTextActive: {
    color: theme.colors.primary,
  },

  // Category Chips
  categoryChipsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    height: theme.touch.chipHeight,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.border.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.bg.glassBorder,
    backgroundColor: theme.colors.bg.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1,
  },

  // Summary HUD
  summaryHud: { marginBottom: theme.spacing.lg },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1.5,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.text.primary,
    marginTop: 2,
    fontFamily: theme.fonts.heading,
  },
  summaryMax: { color: theme.colors.text.secondary, fontWeight: '400' },
  xpEarned: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.bg.glassBorder,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.border.radius.md,
  },
  xpEarnedValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primary,
    fontFamily: theme.fonts.heading,
  },
  xpEarnedLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 2,
  },

  // Complete state
  completeCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  completeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.success,
    letterSpacing: 2,
    marginTop: theme.spacing.md,
  },
  completeSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    letterSpacing: 1,
    marginTop: theme.spacing.xs,
  },

  // FIX 1: Task Card — padding: 0 removed so HudContainer renders content correctly
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  taskCheckArea: { marginRight: theme.spacing.md },
  taskBody: { flex: 1 },
  taskTextBackground: {
    padding: theme.spacing.sm,
    borderRadius: theme.border.radius.sm,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: theme.spacing.xs,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    flex: 1,
  },
  taskTitleDone: { textDecorationLine: 'line-through', color: theme.colors.text.secondary },
  taskDesc: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 2 },
  taskRight: { alignItems: 'flex-end', marginLeft: theme.spacing.sm },
  taskXpBadge: {
    backgroundColor: theme.colors.gold + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.colors.gold + '40',
    borderRadius: 4,
  },
  taskXpText: { fontSize: 10, fontWeight: '700', color: theme.colors.gold, letterSpacing: 1 },
  taskDifficultyBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  taskDifficultyText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  deadlineText: {
    fontSize: 10,
    color: theme.colors.warning,
    marginTop: 4,
  },
  deleteButton: { marginTop: 4 },
  editButton: {
    marginTop: 4,
    marginRight: theme.spacing.xs,
  },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: theme.spacing.xxl },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // FIX 3: Modal overlay with zIndex so it always renders above background content
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 999,
    elevation: 999,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.bg.glassBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.bg.base,
    borderTopWidth: 1,
    borderTopColor: theme.colors.bg.glassBorder,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.text.primary,
    letterSpacing: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1.5,
    marginTop: theme.spacing.md,
  },
  textAreaInput: {
    minHeight: 80,
  },
  optionRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: 4 },
  optionBtn: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.bg.glassBorder,
    alignItems: 'center',
    borderRadius: theme.border.radius.md,
  },
  optionBtnActive: {
    borderWidth: 2,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    letterSpacing: 1,
  },
  optionTextActive: { fontWeight: '900' },
  xpPreview: { fontSize: 10, fontWeight: '600', color: theme.colors.text.secondary, marginTop: 2 },
  createButton: { marginTop: theme.spacing.lg },

  // FIX 4: Finish modal — centered in screen with proper margin
  finishModalContent: {
    backgroundColor: theme.colors.bg.base,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.border.radius.lg,
  },
  finishModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.text.primary,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.sm,
  },
  finishTaskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  finishTaskDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  finishXpText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.success,
    marginBottom: theme.spacing.lg,
  },
  finishActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  finishActionButton: {
    flex: 1,
  },
});