import { supabase } from './supabase';
import { PreferencesService, StatsService, UserPreferences } from './statsService';

export interface OnboardingData {
  primary_goal?: string;
  fitness_level?: string;
  workout_frequency?: number;
  workout_reminders?: boolean;
  nutrition_reminders?: boolean;
  sleep_reminders?: boolean;
  achievement_notifications?: boolean;
  weight_unit?: string;
  height_unit?: string;
  distance_unit?: string;
  profile_public?: boolean;
  share_achievements?: boolean;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  character_name?: string;
  // New fields for updated onboarding
  goals?: string[];
  weight_kg?: number;
  height_cm?: number;
  notifications_enabled?: boolean;
  reminder_time?: string;
  quest_reminders_enabled?: boolean;
}

export interface ProfileSummary {
  preferences: UserPreferences | null;
  characterName: string;
  email: string;
}

/** Upsert onboarding preferences and ensure user_stats row exists with character name. */
export async function saveOnboardingData(
  userId: string,
  data: OnboardingData,
): Promise<{ error: Error | null }> {
  console.log('[Ascend] saveOnboardingData called for user:', userId, 'with data:', data);
  const { character_name, age, weight, height, gender, goals, weight_kg, height_cm, notifications_enabled, reminder_time, quest_reminders_enabled, ...prefs } = data;

  const prefPayload: Partial<UserPreferences> & { id: string } = {
    id: userId,
    ...prefs,
  };
  
  // Handle new onboarding fields
  if (goals && goals.length > 0) {
    prefPayload.goals = goals;
  }
  if (weight_kg != null) prefPayload.weight = weight_kg;
  if (height_cm != null) prefPayload.height = height_cm;
  if (notifications_enabled !== undefined) prefPayload.notifications_enabled = notifications_enabled;
  if (reminder_time) prefPayload.reminder_time = reminder_time;
  if (quest_reminders_enabled !== undefined) prefPayload.quest_reminders_enabled = quest_reminders_enabled;
  
  // Handle legacy fields for backward compatibility
  if (age != null) prefPayload.age = age;
  if (weight != null) prefPayload.weight = weight;
  if (height != null) prefPayload.height = height;
  if (gender) prefPayload.gender = gender;

  console.log('[Ascend] Calling PreferencesService.upsertUserPreferences with payload:', prefPayload);
  const { error: prefError } = await PreferencesService.upsertUserPreferences(userId, prefPayload);
  if (prefError) {
    console.log('Preferences error:', prefError);
    console.log('Preferences error message:', (prefError as any)?.message);
    // Pass the error through directly - it's already an Error object from persistedMutate
    return { error: prefError };
  }
  console.log('[Ascend] Preferences saved successfully');

  const name = character_name?.trim() || 'Agent';
  console.log('[Ascend] Calling StatsService.ensureUserStats with name:', name);
  const { error: statsError } = await StatsService.ensureUserStats(userId, name);
  if (statsError) {
    console.log('Stats error:', statsError);
    console.log('Stats error message:', (statsError as any)?.message);
    // Pass the error through directly - it's already an Error object from persistedMutate
    return { error: statsError };
  }
  console.log('[Ascend] Stats saved successfully');

  return { error: null };
}

/** Update profile fields from the edit-profile form. */
export async function updateProfile(
  userId: string,
  updates: {
    character_name?: string;
    age?: number;
    weight?: number;
    height?: number;
    gender?: string;
  },
): Promise<{ error: Error | null }> {
  if (updates.character_name?.trim()) {
    const { error } = await StatsService.ensureUserStats(userId, updates.character_name.trim());
    if (error) return { error: new Error(error.message ?? 'Failed to update name') };
  }

  const prefUpdates: Partial<UserPreferences> = {};
  if (updates.age != null) prefUpdates.age = updates.age;
  if (updates.weight != null) prefUpdates.weight = updates.weight;
  if (updates.height != null) prefUpdates.height = updates.height;
  if (updates.gender) prefUpdates.gender = updates.gender;

  if (Object.keys(prefUpdates).length > 0) {
    const { error } = await PreferencesService.updateUserPreferences(userId, prefUpdates);
    if (error) return { error: new Error(error.message ?? 'Failed to update profile') };
  }

  return { error: null };
}

/** Fetch profiles.email for display. */
export async function getProfileEmail(userId: string): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('email').eq('id', userId).single();
  return data?.email ?? null;
}
