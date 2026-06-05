import { cacheKey } from './cache';

export const CacheKeys = {
  tasks: (userId: string, date: string) => cacheKey('tasks', userId, date),
  tasksPrefix: (userId: string) => cacheKey('tasks', userId),
  sleepHistory: (userId: string, days: number) => cacheKey('sleep', userId, 'history', String(days)),
  sleepDay: (userId: string, date: string) => cacheKey('sleep', userId, date),
  sleepPrefix: (userId: string) => cacheKey('sleep', userId),
  screenHistory: (userId: string, days: number) => cacheKey('screen', userId, 'history', String(days)),
  screenDay: (userId: string, date: string) => cacheKey('screen', userId, date),
  screenPrefix: (userId: string) => cacheKey('screen', userId),
  userStats: (userId: string) => cacheKey('stats', userId),
  userPreferences: (userId: string) => cacheKey('preferences', userId),
  dailyProgress: (userId: string, date: string) => cacheKey('progress', userId, date),
  progressPrefix: (userId: string) => cacheKey('progress', userId),
  workouts: (userId: string) => cacheKey('workouts', userId),
  workoutSessions: (userId: string) => cacheKey('workout_sessions', userId),
};
