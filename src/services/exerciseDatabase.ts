import { Exercise, WorkoutPlan } from '../types/exercise';

// ─── Exercise Database Types ───────────────────────────────────────
export interface DatabaseExercise {
  id: string;
  name: string;
  force: 'pull' | 'push' | 'static';
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: 'strength' | 'stretching' | 'cardio' | 'plyometrics';
  images: string[];
}

// ─── Exercise Database Service ───────────────────────────────────────
export class ExerciseDatabaseService {
  private static exercises: DatabaseExercise[] = [];
  private static initialized = false;

  // Initialize the exercise database
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load exercises from the free-exercise-db
      const response = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
      const exercises: DatabaseExercise[] = await response.json();
      
      this.exercises = exercises;
      this.initialized = true;
      
      console.log(`Loaded ${exercises.length} exercises from database`);
    } catch (error) {
      console.error('Failed to load exercise database:', error);
      // Fallback to basic exercises if API fails
      this.loadFallbackExercises();
    }
  }

  // Fallback exercises in case API fails
  private static loadFallbackExercises(): void {
    this.exercises = [
      {
        id: 'push_ups',
        name: 'Push-ups',
        force: 'push',
        level: 'beginner',
        mechanic: 'compound',
        equipment: 'body only',
        primaryMuscles: ['chest', 'shoulders', 'triceps'],
        secondaryMuscles: ['abdominals'],
        instructions: [
          'Lie face down on the floor with hands slightly wider than shoulder width.',
          'Push your body up until your arms are fully extended.',
          'Lower your body until your chest nearly touches the floor.',
          'Push back up to the starting position.'
        ],
        category: 'strength',
        images: []
      },
      {
        id: 'squats',
        name: 'Squats',
        force: 'push',
        level: 'beginner',
        mechanic: 'compound',
        equipment: 'body only',
        primaryMuscles: ['quadriceps', 'glutes'],
        secondaryMuscles: ['hamstrings', 'calves'],
        instructions: [
          'Stand with feet shoulder-width apart.',
          'Lower your body by bending your knees.',
          'Keep your back straight and chest up.',
          'Return to the starting position.'
        ],
        category: 'strength',
        images: []
      }
    ];
    this.initialized = true;
  }

  // Get all exercises
  static getAllExercises(): DatabaseExercise[] {
    return this.exercises;
  }

  // Get exercises by category
  static getExercisesByCategory(category: string): DatabaseExercise[] {
    return this.exercises.filter(ex => ex.category === category);
  }

  // Get exercises by muscle group
  static getExercisesByMuscle(muscle: string): DatabaseExercise[] {
    return this.exercises.filter(ex => 
      ex.primaryMuscles.includes(muscle) || ex.secondaryMuscles.includes(muscle)
    );
  }

  // Get exercises by equipment
  static getExercisesByEquipment(equipment: string): DatabaseExercise[] {
    return this.exercises.filter(ex => ex.equipment === equipment);
  }

  // Get exercises by difficulty level
  static getExercisesByLevel(level: string): DatabaseExercise[] {
    return this.exercises.filter(ex => ex.level === level);
  }

  // Search exercises by name
  static searchExercises(query: string): DatabaseExercise[] {
    const lowerQuery = query.toLowerCase();
    return this.exercises.filter(ex => 
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.primaryMuscles.some(muscle => muscle.toLowerCase().includes(lowerQuery)) ||
      ex.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(lowerQuery))
    );
  }

  // Get filtered exercises
  static getFilteredExercises(filters: {
    category?: string;
    equipment?: string;
    level?: string;
    muscle?: string;
    search?: string;
  }): DatabaseExercise[] {
    let filtered = [...this.exercises];

    if (filters.category) {
      filtered = filtered.filter(ex => ex.category === filters.category);
    }

    if (filters.equipment) {
      filtered = filtered.filter(ex => ex.equipment === filters.equipment);
    }

    if (filters.level) {
      filtered = filtered.filter(ex => ex.level === filters.level);
    }

    if (filters.muscle) {
      filtered = filtered.filter(ex => 
        ex.primaryMuscles.includes(filters.muscle!) || 
        ex.secondaryMuscles.includes(filters.muscle!)
      );
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

  // Get exercise by ID
  static getExerciseById(id: string): DatabaseExercise | undefined {
    return this.exercises.find(ex => ex.id === id);
  }

  // Get equipment options
  static getEquipmentOptions(): string[] {
    const equipment = [...new Set(this.exercises.map(ex => ex.equipment))];
    return equipment.sort();
  }

  // Get muscle group options
  static getMuscleOptions(): string[] {
    const muscles = [...new Set([
      ...this.exercises.flatMap(ex => ex.primaryMuscles),
      ...this.exercises.flatMap(ex => ex.secondaryMuscles)
    ])];
    return muscles.sort();
  }

  // Get pre-made workout plans
  static getPreMadeWorkouts(): WorkoutPlan[] {
    const beginnerWorkouts = this.getExercisesByLevel('beginner').slice(0, 5);
    const intermediateWorkouts = this.getExercisesByLevel('intermediate').slice(0, 6);
    const advancedWorkouts = this.getExercisesByLevel('expert').slice(0, 8);

    return [
      {
        id: 'beginner_full_body',
        name: 'Beginner Full Body',
        type: 'strength',
        duration: 30,
        exercises: beginnerWorkouts.map(ex => this.convertToExercise(ex)),
        difficulty: 'beginner',
        targetMuscles: ['chest', 'legs', 'core'],
        estimatedCalories: 200,
      },
      {
        id: 'intermediate_strength',
        name: 'Intermediate Strength',
        type: 'strength',
        duration: 45,
        exercises: intermediateWorkouts.map(ex => this.convertToExercise(ex)),
        difficulty: 'intermediate',
        targetMuscles: ['chest', 'back', 'legs', 'shoulders'],
        estimatedCalories: 350,
      },
      {
        id: 'advanced_full_body',
        name: 'Advanced Full Body',
        type: 'strength',
        duration: 60,
        exercises: advancedWorkouts.map(ex => this.convertToExercise(ex)),
        difficulty: 'advanced',
        targetMuscles: ['full_body'],
        estimatedCalories: 500,
      },
      {
        id: 'cardio_blast',
        name: 'Cardio Blast',
        type: 'cardio',
        duration: 25,
        exercises: this.getExercisesByCategory('cardio').slice(0, 5).map(ex => this.convertToExercise(ex)),
        difficulty: 'intermediate',
        targetMuscles: ['full_body'],
        estimatedCalories: 300,
      },
    ];
  }

  // Convert database exercise to app exercise format
  private static convertToExercise(dbExercise: DatabaseExercise): Exercise {
    return {
      id: dbExercise.id,
      name: dbExercise.name,
      type: dbExercise.category === 'strength' ? 'strength' : 
            dbExercise.category === 'cardio' ? 'cardio' : 
            dbExercise.category === 'stretching' ? 'flexibility' : 'core',
      sets: dbExercise.category === 'strength' ? 3 : undefined,
      reps: dbExercise.category === 'strength' ? 12 : undefined,
      duration: dbExercise.category === 'cardio' ? 60 : 
               dbExercise.category === 'stretching' ? 30 : undefined,
      calories: this.estimateCalories(dbExercise),
      instructions: dbExercise.instructions.join(' '),
    };
  }

  // Estimate calories for an exercise
  private static estimateCalories(exercise: DatabaseExercise): number {
    const baseCalories = {
      beginner: 8,
      intermediate: 12,
      expert: 16,
    };

    const categoryMultiplier = {
      strength: 1.2,
      cardio: 1.5,
      stretching: 0.5,
      plyometrics: 1.8,
    };

    return Math.round(
      (baseCalories[exercise.level] || 10) * 
      (categoryMultiplier[exercise.category] || 1)
    );
  }

  // Get workout recommendations based on user preferences
  static getRecommendedWorkouts(preferences: {
    level?: string;
    targetMuscles?: string[];
    equipment?: string;
    duration?: number;
  }): WorkoutPlan[] {
    const allWorkouts = this.getPreMadeWorkouts();
    
    return allWorkouts.filter(workout => {
      if (preferences.level && workout.difficulty !== preferences.level) {
        return false;
      }
      
      if (preferences.targetMuscles && preferences.targetMuscles.length > 0) {
        const hasTargetMuscle = preferences.targetMuscles.some(muscle => 
          workout.targetMuscles?.includes(muscle) || 
          workout.targetMuscles?.includes('full_body')
        );
        if (!hasTargetMuscle) return false;
      }
      
      if (preferences.duration && Math.abs(workout.duration - preferences.duration) > 15) {
        return false;
      }
      
      return true;
    });
  }
}
