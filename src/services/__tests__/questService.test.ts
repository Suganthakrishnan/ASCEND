import { QuestService, type Quest, type UserQuest } from '../questService';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('../supabase');
jest.mock('../statsService');
jest.mock('@react-native-async-storage/async-storage');

describe('questService', () => {
  const mockUserId = 'user-123';
  const mockUserLevel = 5;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AsyncStorage, 'getItem').mockResolvedValue(null);
    jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue();
    jest.spyOn(AsyncStorage, 'removeItem').mockResolvedValue();
  });

  describe('getAvailableQuests - quest generation', () => {
    it('should return quests with correct categories', async () => {
      const mockQuests: Quest[] = [
        {
          id: '1',
          title: 'Daily Workout',
          description: 'Complete a workout',
          category: 'fitness',
          difficulty: 'easy',
          xp_reward: 10,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
        {
          id: '2',
          title: 'Eat Healthy',
          description: 'Eat a healthy meal',
          category: 'nutrition',
          difficulty: 'medium',
          xp_reward: 25,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
        {
          id: '3',
          title: 'Sleep 8 Hours',
          description: 'Get a good night sleep',
          category: 'sleep',
          difficulty: 'easy',
          xp_reward: 10,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockQuests, error: null }),
            }),
          }),
        }),
      });

      const result = await QuestService.getAvailableQuests(mockUserId, mockUserLevel);
      
      expect(result.data).toHaveLength(3);
      expect(result.data[0].category).toBe('fitness');
      expect(result.data[1].category).toBe('nutrition');
      expect(result.data[2].category).toBe('sleep');
    });

    it('should return quests with correct XP values based on difficulty', async () => {
      const mockQuests: Quest[] = [
        {
          id: '1',
          title: 'Easy Quest',
          description: 'An easy task',
          category: 'fitness',
          difficulty: 'easy',
          xp_reward: 10,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
        {
          id: '2',
          title: 'Medium Quest',
          description: 'A medium task',
          category: 'fitness',
          difficulty: 'medium',
          xp_reward: 25,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
        {
          id: '3',
          title: 'Hard Quest',
          description: 'A hard task',
          category: 'fitness',
          difficulty: 'hard',
          xp_reward: 50,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
        {
          id: '4',
          title: 'Epic Quest',
          description: 'An epic task',
          category: 'fitness',
          difficulty: 'epic',
          xp_reward: 100,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockQuests, error: null }),
            }),
          }),
        }),
      });

      const result = await QuestService.getAvailableQuests(mockUserId, mockUserLevel);
      
      expect(result.data[0].xp_reward).toBe(10);
      expect(result.data[1].xp_reward).toBe(25);
      expect(result.data[2].xp_reward).toBe(50);
      expect(result.data[3].xp_reward).toBe(100);
    });

    it('should filter quests by required level', async () => {
      const mockQuests: Quest[] = [
        {
          id: '1',
          title: 'Level 1 Quest',
          description: 'For beginners',
          category: 'fitness',
          difficulty: 'easy',
          xp_reward: 10,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
        {
          id: '2',
          title: 'Level 10 Quest',
          description: 'For advanced users',
          category: 'fitness',
          difficulty: 'hard',
          xp_reward: 50,
          required_level: 10,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockQuests, error: null }),
            }),
          }),
        }),
      });

      const result = await QuestService.getAvailableQuests(mockUserId, mockUserLevel);
      
      expect(result.data).toHaveLength(1); // Only quest with required_level <= 5
      expect(result.data[0].id).toBe('1');
    });

    it('should filter out seasonal quests not currently active', async () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');

      const mockQuests: Quest[] = [
        {
          id: '1',
          title: 'Active Seasonal Quest',
          description: 'Currently active seasonal quest',
          category: 'fitness',
          difficulty: 'medium',
          xp_reward: 25,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: true,
          season_start_date: pastDate.toISOString(),
          season_end_date: futureDate.toISOString(),
        },
        {
          id: '2',
          title: 'Expired Seasonal Quest',
          description: 'Expired seasonal quest',
          category: 'fitness',
          difficulty: 'medium',
          xp_reward: 25,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: true,
          season_start_date: '2020-01-01',
          season_end_date: '2020-12-31',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockQuests, error: null }),
            }),
          }),
        }),
      });

      const result = await QuestService.getAvailableQuests(mockUserId, mockUserLevel);
      
      expect(result.data).toHaveLength(1); // Only the currently active seasonal quest
      expect(result.data[0].id).toBe('1');
    });
  });

  describe('assignQuest', () => {
    it('should assign a quest to user', async () => {
      const mockQuest: Quest = {
        id: 'quest-1',
        title: 'Test Quest',
        description: 'Test description',
        category: 'fitness',
        difficulty: 'easy',
        xp_reward: 10,
        required_level: 1,
        quest_type: 'daily',
        target_value: 5,
        is_active: true,
        is_seasonal: false,
      };

      const mockUserQuest: UserQuest = {
        id: '1',
        user_id: mockUserId,
        quest_id: 'quest-1',
        current_progress: 0,
        target_progress: 5,
        status: 'assigned',
        assigned_at: '2024-01-15T00:00:00Z',
        xp_granted: 0,
        quest: mockQuest,
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockQuest, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUserQuest, error: null }),
            }),
          }),
        });

      const result = await QuestService.assignQuest(mockUserId, 'quest-1');
      
      expect(result.data).toEqual(mockUserQuest);
    });
  });

  describe('updateQuestProgress', () => {
    it('should update quest progress and grant XP on completion', async () => {
      const mockCurrentQuest: UserQuest = {
        id: '1',
        user_id: mockUserId,
        quest_id: 'quest-1',
        current_progress: 3,
        target_progress: 10,
        status: 'in_progress',
        assigned_at: '2024-01-15T00:00:00Z',
        xp_granted: 0,
        quest: {
          id: 'quest-1',
          title: 'Test Quest',
          description: 'Test',
          category: 'fitness',
          difficulty: 'easy',
          xp_reward: 10,
          required_level: 1,
          quest_type: 'daily',
          is_active: true,
          is_seasonal: false,
        },
      };

      const mockUpdatedQuest: UserQuest = {
        ...mockCurrentQuest,
        current_progress: 10,
        status: 'completed',
        xp_granted: 10,
        completed_at: expect.any(String),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockCurrentQuest, error: null }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockUpdatedQuest, error: null }),
                }),
              }),
            }),
          }),
        });

      const result = await QuestService.updateQuestProgress(mockUserId, 'quest-1', 10);
      
      expect(result.data?.current_progress).toBe(10);
      expect(result.xpGranted).toBe(10);
    });
  });
});
