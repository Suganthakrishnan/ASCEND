import { Exercise } from '../types/exercise';
import workoutExercises from '../../workout_exercises.json';

// ─── Comprehensive Gym Exercise Database ───────────────────────────────────────
export interface GymExercise extends Exercise {
  bodyParts: string[];
  equipmentType: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  forceType: 'push' | 'pull' | 'static';
  mechanicType: 'compound' | 'isolation';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  tips?: string[];
  variations?: string[];
  muscleGroup: string;
}

export class ComprehensiveGymDatabase {
  private static exercises: GymExercise[] = [];
  private static initialized = false;

  // Initialize the comprehensive gym exercise database
  static async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.exercises = this.loadWorkoutDatabase();
    this.initialized = true;
    
    console.log(`Loaded ${this.exercises.length} comprehensive gym exercises from database`);
  }

  // Load exercises from the workout database JSON
  private static loadWorkoutDatabase(): GymExercise[] {
    return (workoutExercises as any[]).map(ex => ({
      id: ex.id,
      name: ex.name,
      type: ex.type as 'strength' | 'cardio' | 'flexibility' | 'core',
      bodyParts: ex.bodyParts,
      equipmentType: ex.equipmentType,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      forceType: ex.forceType as 'push' | 'pull' | 'static',
      mechanicType: ex.mechanicType as 'compound' | 'isolation',
      difficultyLevel: ex.difficultyLevel as 'beginner' | 'intermediate' | 'advanced',
      sets: ex.sets,
      reps: ex.reps,
      duration: ex.duration,
      calories: ex.calories,
      instructions: ex.instructions,
      tips: ex.tips,
      variations: ex.variations,
      muscleGroup: ex.muscleGroup
    }));
  }

  // Get all exercises
  static getAllExercises(): GymExercise[] {
    return this.exercises;
  }

  // Get exercises by body part
  static getExercisesByBodyPart(bodyPart: string): GymExercise[] {
    return this.exercises.filter(ex => ex.bodyParts.includes(bodyPart));
  }

  // Get exercises by equipment type
  static getExercisesByEquipment(equipment: string): GymExercise[] {
    return this.exercises.filter(ex => ex.equipmentType === equipment);
  }

  // Get exercises by muscle group
  static getExercisesByMuscleGroup(muscleGroup: string): GymExercise[] {
    return this.exercises.filter(ex => 
      ex.muscleGroup === muscleGroup ||
      ex.primaryMuscles.includes(muscleGroup) ||
      ex.secondaryMuscles.includes(muscleGroup)
    );
  }

  // Get exercises by difficulty
  static getExercisesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): GymExercise[] {
    return this.exercises.filter(ex => ex.difficultyLevel === difficulty);
  }

  // Get exercises by force type (push/pull/static)
  static getExercisesByForceType(forceType: 'push' | 'pull' | 'static'): GymExercise[] {
    return this.exercises.filter(ex => ex.forceType === forceType);
  }

  // Get exercises by mechanic type (compound/isolation)
  static getExercisesByMechanicType(mechanicType: 'compound' | 'isolation'): GymExercise[] {
    return this.exercises.filter(ex => ex.mechanicType === mechanicType);
  }

  // Search exercises by name or muscle
  static searchExercises(query: string): GymExercise[] {
    const lowerQuery = query.toLowerCase();
    return this.exercises.filter(ex => 
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.primaryMuscles.some(muscle => muscle.toLowerCase().includes(lowerQuery)) ||
      ex.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(lowerQuery)) ||
      ex.muscleGroup.toLowerCase().includes(lowerQuery)
    );
  }

  // Get filtered exercises
  static getFilteredExercises(filters: {
    bodyPart?: string;
    equipment?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    forceType?: 'push' | 'pull' | 'static';
    mechanicType?: 'compound' | 'isolation';
    search?: string;
  }): GymExercise[] {
    let filtered = [...this.exercises];

    if (filters.bodyPart) {
      filtered = filtered.filter(ex => ex.bodyParts.includes(filters.bodyPart!));
    }

    if (filters.equipment) {
      filtered = filtered.filter(ex => ex.equipmentType === filters.equipment);
    }

    if (filters.difficulty) {
      filtered = filtered.filter(ex => ex.difficultyLevel === filters.difficulty);
    }

    if (filters.forceType) {
      filtered = filtered.filter(ex => ex.forceType === filters.forceType);
    }

    if (filters.mechanicType) {
      filtered = filtered.filter(ex => ex.mechanicType === filters.mechanicType);
    }

    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery) ||
        ex.primaryMuscles.some(muscle => muscle.toLowerCase().includes(searchQuery)) ||
        ex.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(searchQuery))
      );
    }

    return filtered;
  }

  // Get all body parts (dynamically extracted from database)
  static getAllBodyParts(): string[] {
    const allBodyParts = new Set<string>();
    this.exercises.forEach(ex => {
      ex.bodyParts.forEach(part => allBodyParts.add(part));
    });
    return Array.from(allBodyParts).sort();
  }

  // Get all equipment types (dynamically extracted from database)
  static getAllEquipmentTypes(): string[] {
    const allEquipment = new Set<string>();
    this.exercises.forEach(ex => {
      allEquipment.add(ex.equipmentType);
    });
    return Array.from(allEquipment).sort();
  }

  // Get all muscle groups (dynamically extracted from database)
  static getAllMuscleGroups(): string[] {
    const allGroups = new Set<string>();
    this.exercises.forEach(ex => {
      allGroups.add(ex.muscleGroup);
    });
    return Array.from(allGroups).sort();
  }

  // Get workout templates by body part
  static getWorkoutTemplatesByBodyPart(bodyPart: string): any[] {
    const exercises = this.getExercisesByBodyPart(bodyPart);
    return [
      {
        id: `${bodyPart}_beginner`,
        name: `Beginner ${bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1)} Workout`,
        difficulty: 'beginner',
        duration: 30,
        exercises: exercises.filter(ex => ex.difficultyLevel === 'beginner').slice(0, 4),
      },
      {
        id: `${bodyPart}_intermediate`,
        name: `Intermediate ${bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1)} Workout`,
        difficulty: 'intermediate',
        duration: 45,
        exercises: exercises.filter(ex => ex.difficultyLevel === 'intermediate').slice(0, 5),
      },
      {
        id: `${bodyPart}_advanced`,
        name: `Advanced ${bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1)} Workout`,
        difficulty: 'advanced',
        duration: 60,
        exercises: exercises.filter(ex => ex.difficultyLevel === 'advanced').slice(0, 6),
      },
    ];
  }

  // Get equipment-specific workouts
  static getEquipmentSpecificWorkouts(equipment: string): any[] {
    const exercises = this.getExercisesByEquipment(equipment);
    return [
      {
        id: `${equipment}_full_body`,
        name: `Full Body ${equipment.charAt(0).toUpperCase() + equipment.slice(1)} Workout`,
        type: 'mixed',
        duration: 45,
        exercises: exercises.slice(0, 6),
      },
    ];
  }
}
