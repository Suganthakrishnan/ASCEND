export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'core' | 'hiit' | 'yoga' | 'pilates';
  sets?: number;
  reps?: number;
  duration?: number;
  calories?: number;
  instructions?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'mixed' | 'custom' | 'hiit' | 'yoga' | 'pilates';
  duration: number;
  exercises: Exercise[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscles?: string[];
  estimatedCalories: number;
}

export interface CustomWorkoutPlan extends WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'strength' | 'cardio' | 'mixed' | 'custom' | 'hiit' | 'yoga' | 'pilates';
  duration: number;
  exercises: Exercise[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscles: string[];
  estimatedCalories: number;
  equipment: string[];
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  scheduledDays?: string[];
  restTime?: number;
  warmupDuration?: number;
  cooldownDuration?: number;
  notes?: string;
}

export interface ExerciseFilter {
  category?: string;
  equipment?: string;
  level?: string;
  muscle?: string;
  search?: string;
  bodyPart?: string;
  equipmentType?: string;
}

export interface CustomExercise extends Exercise {
  order: number;
  sets?: number;
  reps?: number;
  duration?: number;
  calories?: number;
  instructions?: string;
  bodyParts?: string[];
  equipmentType?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  forceType?: 'push' | 'pull' | 'static';
  mechanicType?: 'compound' | 'isolation';
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  tips?: string[];
  variations?: string[];
  muscleGroup?: string;
}

// Enhanced exercise types for comprehensive gym workouts
export type BodyPart = 
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'adductors' | 'abductors'
  | 'abdominals' | 'obliques' | 'lower_back' | 'traps' | 'lats' | 'upper_back';

export type EquipmentType = 
  | 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'smith_machine'
  | 'ez_bar' | 'dumbbells' | 'kettlebell' | 'resistance_bands'
  | 'body_only' | 'bench' | 'pull_up_bar' | 'dip_station'
  | 'leg_press' | 'hack_squat' | 'leg_curl' | 'leg_extension'
  | 'calf_raise' | 'lat_pulldown' | 'cable_crossover' | 'pec_deck'
  | 'shoulder_press' | 'lateral_raise' | 'preacher_curl' | 'triceps_pushdown';

export interface GymExercise extends Exercise {
  bodyParts: BodyPart[];
  equipmentType: EquipmentType;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  forceType: 'push' | 'pull' | 'static';
  mechanicType: 'compound' | 'isolation';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
  tips?: string[];
  variations?: string[];
  muscleGroup: string;
}
