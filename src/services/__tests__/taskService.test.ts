import { TaskService, XP_REWARDS, XP_PENALTIES, type DailyTask } from '../taskService';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../supabase');
jest.mock('../persistence/persistenceService');
jest.mock('@react-native-async-storage/async-storage');

describe('taskService', () => {
  const mockUserId = 'user-123';
  const mockDate = '2024-01-15';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null);
    jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue();
    jest.spyOn(AsyncStorage, 'removeItem').mockResolvedValue();
  });

  describe('XP_REWARDS and XP_PENALTIES constants', () => {
    it('should have correct XP rewards', () => {
      expect(XP_REWARDS.easy).toBe(10);
      expect(XP_REWARDS.medium).toBe(25);
      expect(XP_REWARDS.hard).toBe(50);
    });

    it('should have correct XP penalties', () => {
      expect(XP_PENALTIES.easy).toBe(5);
      expect(XP_PENALTIES.medium).toBe(12);
      expect(XP_PENALTIES.hard).toBe(25);
    });
  });

  describe('getUserTasks (read)', () => {
    it('should fetch user tasks for a specific date', async () => {
      const mockTasks: DailyTask[] = [
        {
          id: '1',
          user_id: mockUserId,
          title: 'Test Task',
          description: 'Test description',
          difficulty: 'easy',
          xp_reward: 10,
          completed: false,
          completed_at: null,
          task_date: mockDate,
          deadline_date: null,
          task_type: 'daily',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockTasks, error: null }),
            }),
          }),
        }),
      });

      const result = await TaskService.getUserTasks(mockUserId, mockDate);
      
      expect(result.data).toEqual(mockTasks);
      expect(result.error).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });

      const result = await TaskService.getUserTasks(mockUserId, mockDate);
      
      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Description',
        difficulty: 'easy' as const,
        xp_reward: 10,
        task_date: mockDate,
        deadline_date: null,
        task_type: 'daily' as const,
      };

      const mockCreatedTask: DailyTask = {
        id: '3',
        user_id: mockUserId,
        ...newTask,
        completed: false,
        completed_at: null,
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockCreatedTask, error: null }),
          }),
        }),
      });

      const result = await TaskService.createTask(mockUserId, newTask);
      
      expect(result.data).toEqual(mockCreatedTask);
      expect(supabase.from).toHaveBeenCalledWith('daily_tasks');
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const mockUpdatedTask: DailyTask = {
        id: '1',
        user_id: mockUserId,
        title: 'Updated Task',
        description: null,
        difficulty: 'medium',
        xp_reward: 25,
        completed: false,
        completed_at: null,
        task_date: mockDate,
        deadline_date: null,
        task_type: 'daily',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdatedTask, error: null }),
            }),
          }),
        }),
      });

      const result = await TaskService.updateTask('1', { title: 'Updated Task', difficulty: 'medium', xp_reward: 25 });
      
      expect(result.data).toEqual(mockUpdatedTask);
      expect(result.data?.title).toBe('Updated Task');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await TaskService.deleteTask('1', mockUserId);
      
      expect(result.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('daily_tasks');
    });
  });

  describe('completeTask', () => {
    it('should mark task as completed', async () => {
      const mockTask: DailyTask = {
        id: '1',
        user_id: mockUserId,
        title: 'Task',
        description: null,
        difficulty: 'easy',
        xp_reward: 10,
        completed: true,
        completed_at: '2024-01-15T12:00:00Z',
        task_date: mockDate,
        deadline_date: null,
        task_type: 'daily',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockTask, error: null }),
            }),
          }),
        }),
      });

      const result = await TaskService.completeTask('1', mockUserId);
      
      expect(result.data?.completed).toBe(true);
      expect(result.data?.completed_at).toBeDefined();
    });
  });
});
