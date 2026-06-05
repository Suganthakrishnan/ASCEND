import { GymExercise, BodyPart, EquipmentType } from '../types/exercise';

// ─── Simple Exercise Interface for Database ───────────────────────────────────────
interface SimpleGymExercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'core' | 'hiit' | 'yoga' | 'pilates';
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
  sets?: number;
  reps?: number;
  duration?: number;
  calories: number;
}

// ─── Comprehensive Gym Exercise Database ───────────────────────────────────────
export class GymExerciseDatabase {
  private static exercises: SimpleGymExercise[] = [];
  private static initialized = false;

  // Initialize the comprehensive gym exercise database
  static async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.exercises = this.createComprehensiveGymExercises();
    this.initialized = true;
    
    console.log(`Loaded ${this.exercises.length} comprehensive gym exercises`);
  }

  // Get all exercises
  static getAllExercises(): SimpleGymExercise[] {
    return this.exercises;
  }

  // Get exercises by body part
  static getExercisesByBodyPart(bodyPart: BodyPart): SimpleGymExercise[] {
    return this.exercises.filter(ex => ex.bodyParts.includes(bodyPart));
  }

  // Get exercises by equipment type
  static getExercisesByEquipment(equipment: EquipmentType): SimpleGymExercise[] {
    return this.exercises.filter(ex => ex.equipmentType === equipment);
  }

  // Get exercises by muscle group
  static getExercisesByMuscleGroup(muscleGroup: string): SimpleGymExercise[] {
    return this.exercises.filter(ex => 
      ex.muscleGroup === muscleGroup ||
      ex.primaryMuscles.includes(muscleGroup) ||
      ex.secondaryMuscles.includes(muscleGroup)
    );
  }

  // Get exercises by difficulty
  static getExercisesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): SimpleGymExercise[] {
    return this.exercises.filter(ex => ex.difficultyLevel === difficulty);
  }

  // Get exercises by force type (push/pull/static)
  static getExercisesByForceType(forceType: 'push' | 'pull' | 'static'): SimpleGymExercise[] {
    return this.exercises.filter(ex => ex.forceType === forceType);
  }

  // Get exercises by mechanic type (compound/isolation)
  static getExercisesByMechanicType(mechanicType: 'compound' | 'isolation'): SimpleGymExercise[] {
    return this.exercises.filter(ex => ex.mechanicType === mechanicType);
  }

  // Search exercises by name or muscle
  static searchExercises(query: string): SimpleGymExercise[] {
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
    bodyPart?: BodyPart;
    equipment?: EquipmentType;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    forceType?: 'push' | 'pull' | 'static';
    mechanicType?: 'compound' | 'isolation';
    search?: string;
  }): SimpleGymExercise[] {
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

  // Get all body parts
  static getAllBodyParts(): BodyPart[] {
    return [
      'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
      'quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors',
      'abdominals', 'obliques', 'lower_back', 'traps', 'lats'
    ];
  }

  // Get all equipment types
  static getAllEquipmentTypes(): EquipmentType[] {
    return [
      'barbell', 'dumbbell', 'machine', 'cable', 'smith_machine',
      'ez_bar', 'dumbbells', 'kettlebell', 'resistance_bands',
      'body_only', 'bench', 'pull_up_bar', 'dip_station',
      'leg_press', 'hack_squat', 'leg_curl', 'leg_extension',
      'calf_raise', 'lat_pulldown', 'cable_crossover', 'pec_deck',
      'shoulder_press', 'lateral_raise', 'preacher_curl', 'triceps_pushdown'
    ];
  }

  // Create comprehensive gym exercise database
  private static createComprehensiveGymExercises(): SimpleGymExercise[] {
    return [
      // CHEST EXERCISES
      {
        id: 'barbell_bench_press',
        name: 'Barbell Bench Press',
        type: 'strength',
        bodyParts: ['chest', 'triceps', 'shoulders'],
        equipmentType: 'barbell',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps', 'anterior_deltoids'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 4,
        reps: 8,
        duration: undefined,
        calories: 25,
        instructions: 'Lie on bench with feet flat on floor. Grip bar slightly wider than shoulder width. Lower bar to chest with controlled movement. Press bar up until arms are fully extended.',
        tips: [
          'Keep back flat against bench',
          'Control eccentric (lowering) phase',
          'Don\'t bounce bar off chest'
        ],
        variations: ['Close Grip', 'Wide Grip', 'Incline', 'Decline'],
        muscleGroup: 'chest'
      },
      {
        id: 'dumbbell_bench_press',
        name: 'Dumbbell Bench Press',
        type: 'strength',
        bodyParts: ['chest', 'triceps', 'shoulders'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['triceps', 'anterior_deltoids'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 10,
        duration: undefined,
        calories: 20,
        instructions: 'Lie on bench holding dumbbells at chest level. Press dumbbells up until arms are extended. Lower dumbbells with controlled movement. Maintain slight bend in elbows at bottom.',
        tips: [
          'Keep wrists straight',
          'Bring dumbbells together at top',
          'Full range of motion'
        ],
        variations: ['Incline', 'Decline', 'Neutral Grip'],
        muscleGroup: 'chest'
      },
      {
        id: 'incline_dumbbell_press',
        name: 'Incline Dumbbell Press',
        type: 'strength',
        bodyParts: ['chest', 'shoulders', 'triceps'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['upper_chest'],
        secondaryMuscles: ['anterior_deltoids', 'triceps'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 22,
        instructions: 'Set bench to 30-45 degree incline. Press dumbbells up focusing on upper chest. Lower with controlled movement. Keep elbows slightly flared.',
        tips: [
          'Don\'t arch lower back',
          'Focus on upper chest contraction',
          'Control the negative'
        ],
        variations: ['Barbell', 'Machine'],
        muscleGroup: 'chest'
      },
      {
        id: 'decline_bench_press',
        name: 'Decline Bench Press',
        type: 'strength',
        bodyParts: ['chest', 'triceps'],
        equipmentType: 'barbell',
        primaryMuscles: ['lower_chest'],
        secondaryMuscles: ['triceps'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'advanced',
        sets: 3,
        reps: 8,
        duration: undefined,
        calories: 24,
        instructions: 'Set bench to 15-30 degree decline. Grip bar slightly wider than shoulders. Lower to lower chest area. Press up focusing on lower chest.',
        tips: [
          'Secure feet at high end',
          'Control movement throughout',
          'Focus on lower chest contraction'
        ],
        variations: ['Dumbbell', 'Machine'],
        muscleGroup: 'chest'
      },
      {
        id: 'dumbbell_flyes',
        name: 'Dumbbell Flyes',
        type: 'strength',
        bodyParts: ['chest'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['anterior_deltoids'],
        forceType: 'push',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 15,
        instructions: 'Lie on bench with dumbbells overhead. Lower arms out to sides with slight elbow bend. Feel stretch in chest. Bring dumbbells together above chest.',
        tips: [
          'Keep slight bend in elbows',
          'Don\'t go too deep',
          'Focus on chest contraction'
        ],
        variations: ['Cable Crossover', 'Machine Fly'],
        muscleGroup: 'chest'
      },
      {
        id: 'cable_crossover',
        name: 'Cable Crossover',
        type: 'strength',
        bodyParts: ['chest'],
        equipmentType: 'cable',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['anterior_deltoids'],
        forceType: 'push',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 15,
        duration: undefined,
        calories: 18,
        instructions: 'Set pulleys to chest height. Stand in center with arms extended. Bring hands together in front of chest. Slowly return to starting position.',
        tips: [
          'Keep chest up',
          'Control negative movement',
          'Squeeze chest at peak contraction'
        ],
        variations: ['High to Low', 'Low to High'],
        muscleGroup: 'chest'
      },
      {
        id: 'pec_deck_machine',
        name: 'Pec Deck Machine',
        type: 'strength',
        bodyParts: ['chest'],
        equipmentType: 'machine',
        primaryMuscles: ['chest'],
        secondaryMuscles: ['anterior_deltoids'],
        forceType: 'push',
        mechanicType: 'isolation',
        difficultyLevel: 'beginner',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 16,
        instructions: 'Sit with back against pad. Place forearms on pads. Bring pads together. Slowly return to starting position.',
        tips: [
          'Keep shoulders back',
          'Control movement',
          'Don\'t use momentum'
        ],
        variations: ['Dumbbell Flyes', 'Cable Crossover'],
        muscleGroup: 'chest'
      },

      // BACK EXERCISES
      {
        id: 'deadlifts',
        name: 'Deadlifts',
        type: 'strength',
        bodyParts: ['back', 'glutes', 'hamstrings', 'traps'],
        equipmentType: 'barbell',
        primaryMuscles: ['lower_back', 'glutes', 'hamstrings'],
        secondaryMuscles: ['traps', 'upper_back'],
        forceType: 'pull',
        mechanicType: 'compound',
        difficultyLevel: 'advanced',
        sets: 4,
        reps: 6,
        duration: undefined,
        calories: 35,
        instructions: 'Stand with feet hip-width apart. Grip bar with overhand or mixed grip. Lift by extending hips and knees. Keep back straight throughout movement.',
        tips: [
          'Keep bar close to body',
          'Don\'t round lower back',
          'Drive through heels'
        ],
        variations: ['Romanian Deadlift', 'Sumo Deadlift'],
        muscleGroup: 'back'
      },
      {
        id: 'pull_ups',
        name: 'Pull-ups',
        type: 'strength',
        bodyParts: ['back', 'biceps'],
        equipmentType: 'pull_up_bar',
        primaryMuscles: ['lats', 'upper_back'],
        secondaryMuscles: ['biceps', 'forearms'],
        forceType: 'pull',
        mechanicType: 'compound',
        difficultyLevel: 'advanced',
        sets: 3,
        reps: 8,
        duration: undefined,
        calories: 20,
        instructions: 'Hang from bar with overhand grip. Pull body up until chin clears bar. Lower with controlled movement. Keep core tight throughout.',
        tips: [
          'Full range of motion',
          'Don\'t kip or swing',
          'Focus on back contraction'
        ],
        variations: ['Chin-ups', 'Wide Grip', 'Close Grip'],
        muscleGroup: 'back'
      },
      {
        id: 'lat_pulldowns',
        name: 'Lat Pulldowns',
        type: 'strength',
        bodyParts: ['back', 'biceps'],
        equipmentType: 'lat_pulldown',
        primaryMuscles: ['lats'],
        secondaryMuscles: ['biceps', 'upper_back'],
        forceType: 'pull',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 10,
        duration: undefined,
        calories: 22,
        instructions: 'Sit with thighs secured. Grip bar wider than shoulders. Pull bar to upper chest. Slowly return to starting position.',
        tips: [
          'Lean back slightly',
          'Squeeze shoulder blades',
          'Control negative movement'
        ],
        variations: ['Close Grip', 'Reverse Grip', 'Wide Grip'],
        muscleGroup: 'back'
      },
      {
        id: 'bent_over_rows',
        name: 'Bent Over Rows',
        type: 'strength',
        bodyParts: ['back', 'biceps'],
        equipmentType: 'barbell',
        primaryMuscles: ['upper_back', 'lats'],
        secondaryMuscles: ['biceps', 'traps'],
        forceType: 'pull',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 10,
        duration: undefined,
        calories: 25,
        instructions: 'Bend at hips with slight knee bend. Grip bar with overhand grip. Pull bar to lower chest. Keep back straight throughout.',
        tips: [
          'Keep back parallel to floor',
          'Pull elbows back',
          'Squeeze shoulder blades'
        ],
        variations: ['Dumbbell Rows', 'T-Bar Rows'],
        muscleGroup: 'back'
      },
      {
        id: 'dumbbell_rows',
        name: 'Dumbbell Rows',
        type: 'strength',
        bodyParts: ['back', 'biceps'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['lats', 'upper_back'],
        secondaryMuscles: ['biceps', 'traps'],
        forceType: 'pull',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 20,
        instructions: [
          'Place one knee and hand on bench',
          'Hold dumbbell in opposite hand',
          'Pull dumbbell to hip level',
          'Lower with controlled movement'
        ],
        tips: [
          'Keep back straight',
          'Pull elbow high and back',
          'Squeeze back muscles'
        ],
        variations: ['Two-arm Dumbbell Rows', 'Cable Rows'],
        muscleGroup: 'back'
      },
      {
        id: 'seated_cable_rows',
        name: 'Seated Cable Rows',
        type: 'strength',
        bodyParts: ['back', 'biceps'],
        equipmentType: 'cable',
        primaryMuscles: ['upper_back', 'lats'],
        secondaryMuscles: ['biceps', 'traps'],
        forceType: 'pull',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 18,
        instructions: [
          'Sit with feet on platform',
          'Grip handle with both hands',
          'Pull handle to abdomen',
          'Keep back straight throughout'
        ],
        tips: [
          'Sit upright',
          'Squeeze shoulder blades',
          'Control negative movement'
        ],
        variations: ['Wide Grip', 'Close Grip', 'V-Bar'],
        muscleGroup: 'back'
      },
      {
        id: 'face_pulls',
        name: 'Face Pulls',
        type: 'strength',
        bodyParts: ['shoulders', 'upper_back'],
        equipmentType: 'cable',
        primaryMuscles: ['rear_deltoids', 'upper_back'],
        secondaryMuscles: ['traps', 'rotator_cuff'],
        forceType: 'pull',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 15,
        duration: undefined,
        calories: 12,
        instructions: [
          'Set pulley at chest height',
          'Use rope attachment',
          'Pull rope to face level',
          'Separate hands at end of movement'
        ],
        tips: [
          'Keep elbows high',
          'Focus on rear delt contraction',
          'Don\'t use momentum'
        ],
        variations: ['Band Face Pulls', 'Machine Reverse Fly'],
        muscleGroup: 'back'
      },

      // SHOULDER EXERCISES
      {
        id: 'overhead_press',
        name: 'Overhead Press',
        type: 'strength',
        bodyParts: ['shoulders', 'triceps'],
        equipmentType: 'barbell',
        primaryMuscles: ['shoulders'],
        secondaryMuscles: ['triceps', 'traps'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 8,
        duration: undefined,
        calories: 22,
        instructions: [
          'Stand with feet shoulder-width apart',
          'Grip bar slightly wider than shoulders',
          'Press bar overhead until arms extended',
          'Lower bar to collarbone level'
        ],
        tips: [
          'Keep core tight',
          'Don\'t arch lower back',
          'Full range of motion'
        ],
        variations: ['Dumbbell Press', 'Seated Press', 'Machine Press'],
        muscleGroup: 'shoulders'
      },
      {
        id: 'dumbbell_shoulder_press',
        name: 'Dumbbell Shoulder Press',
        type: 'strength',
        bodyParts: ['shoulders', 'triceps'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['shoulders'],
        secondaryMuscles: ['triceps', 'traps'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 10,
        duration: undefined,
        calories: 20,
        instructions: [
          'Sit or stand with dumbbells at shoulder level',
          'Press dumbbells overhead',
          'Don\'t let dumbbells touch at top',
          'Control negative movement'
        ],
        tips: [
          'Keep back straight',
          'Press through full range',
          'Don\'t lock elbows at top'
        ],
        variations: ['Seated', 'Arnold Press', 'Neutral Grip'],
        muscleGroup: 'shoulders'
      },
      {
        id: 'lateral_raises',
        name: 'Lateral Raises',
        type: 'strength',
        bodyParts: ['shoulders'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['medial_deltoids'],
        secondaryMuscles: ['anterior_deltoids'],
        forceType: 'push',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 15,
        instructions: [
          'Stand with dumbbells at sides',
          'Raise arms to shoulder height',
          'Keep slight bend in elbows',
          'Lower with controlled movement'
        ],
        tips: [
          'Don\'t use momentum',
          'Lead with elbows',
          'Stop at shoulder level'
        ],
        variations: ['Cable Lateral Raises', 'Machine Lateral Raises'],
        muscleGroup: 'shoulders'
      },
      {
        id: 'front_raises',
        name: 'Front Raises',
        type: 'strength',
        bodyParts: ['shoulders'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['anterior_deltoids'],
        secondaryMuscles: ['traps'],
        forceType: 'push',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 14,
        instructions: [
          'Stand with dumbbells at sides',
          'Raise one arm forward to shoulder height',
          'Lower and repeat with other arm',
          'Alternate arms or raise both together'
        ],
        tips: [
          'Control movement',
          'Don\'t swing',
          'Keep core tight'
        ],
        variations: ['Barbell Front Raises', 'Cable Front Raises'],
        muscleGroup: 'shoulders'
      },
      {
        id: 'reverse_flyes',
        name: 'Reverse Flyes',
        type: 'strength',
        bodyParts: ['shoulders', 'upper_back'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['rear_deltoids'],
        secondaryMuscles: ['traps', 'upper_back'],
        forceType: 'pull',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 16,
        instructions: [
          'Bend at hips with flat back',
          'Raise arms out to sides',
          'Keep slight bend in elbows',
          'Focus on rear delt contraction'
        ],
        tips: [
          'Don\'t use momentum',
          'Control negative movement',
          'Keep neck neutral'
        ],
        variations: ['Cable Reverse Flyes', 'Machine Reverse Fly'],
        muscleGroup: 'shoulders'
      },
      {
        id: 'upright_rows',
        name: 'Upright Rows',
        type: 'strength',
        bodyParts: ['shoulders', 'traps'],
        equipmentType: 'barbell',
        primaryMuscles: ['traps', 'shoulders'],
        secondaryMuscles: ['biceps'],
        forceType: 'pull',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 10,
        duration: undefined,
        calories: 18,
        instructions: [
          'Stand with bar in front of thighs',
          'Pull bar up to chest level',
          'Keep elbows high and wide',
          'Lower with controlled movement'
        ],
        tips: [
          'Keep bar close to body',
          'Lead with elbows',
          'Don\'t shrug excessively'
        ],
        variations: ['Dumbbell Upright Rows', 'Cable Upright Rows'],
        muscleGroup: 'shoulders'
      },

      // BICEPS EXERCISES
      {
        id: 'barbell_curls',
        name: 'Barbell Curls',
        type: 'strength',
        bodyParts: ['biceps'],
        equipmentType: 'barbell',
        primaryMuscles: ['biceps'],
        secondaryMuscles: ['forearms'],
        forceType: 'pull',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 10,
        duration: undefined,
        calories: 12,
        instructions: [
          'Stand with feet shoulder-width apart',
          'Grip bar with underhand grip',
          'Curl bar to chest level',
          'Lower with controlled movement'
        ],
        tips: [
          'Keep elbows at sides',
          'Don\'t swing or use momentum',
          'Full range of motion'
        ],
        variations: ['EZ Bar Curls', 'Preacher Curls'],
        muscleGroup: 'biceps'
      },
      {
        id: 'dumbbell_curls',
        name: 'Dumbbell Curls',
        type: 'strength',
        bodyParts: ['biceps'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['biceps'],
        secondaryMuscles: ['forearms'],
        forceType: 'pull',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 14,
        instructions: [
          'Stand with dumbbells at sides',
          'Curl one dumbbell at a time',
          'Supinate wrist at top',
          'Alternate arms or curl both'
        ],
        tips: [
          'Keep elbows at sides',
          'Control negative movement',
          'Full contraction at top'
        ],
        variations: ['Hammer Curls', 'Concentration Curls'],
        muscleGroup: 'biceps'
      },
      {
        id: 'hammer_curls',
        name: 'Hammer Curls',
        type: 'strength',
        bodyParts: ['biceps', 'forearms'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['biceps', 'brachialis'],
        secondaryMuscles: ['forearms'],
        forceType: 'pull',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 14,
        instructions: [
          'Stand with dumbbells at sides',
          'Use neutral grip (palms facing)',
          'Curl dumbbells to shoulder level',
          'Lower with controlled movement'
        ],
        tips: [
          'Keep palms facing each other',
          'Don\'t swing',
          'Focus on brachialis'
        ],
        variations: ['Rope Hammer Curls', 'Cable Hammer Curls'],
        muscleGroup: 'biceps'
      },
      {
        id: 'preacher_curls',
        name: 'Preacher Curls',
        type: 'strength',
        bodyParts: ['biceps'],
        equipmentType: 'preacher_curl',
        primaryMuscles: ['biceps'],
        secondaryMuscles: ['forearms'],
        forceType: 'pull',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 16,
        instructions: [
          'Sit at preacher curl bench',
          'Place arms on angled pad',
          'Curl weight to shoulder level',
          'Lower with controlled movement'
        ],
        tips: [
          'Full range of motion',
          'Don\'t bounce at bottom',
          'Focus on biceps contraction'
        ],
        variations: ['Dumbbell Preacher Curls', 'Machine Preacher Curls'],
        muscleGroup: 'biceps'
      },
      {
        id: 'concentration_curls',
        name: 'Concentration Curls',
        type: 'strength',
        bodyParts: ['biceps'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['biceps'],
        secondaryMuscles: ['forearms'],
        forceType: 'pull',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 12,
        instructions: [
          'Sit on bench with legs spread',
          'Rest elbow on inner thigh',
          'Curl dumbbell to shoulder level',
          'Lower with controlled movement'
        ],
        tips: [
          'Isolate biceps',
          'Don\'t swing',
          'Full contraction'
        ],
        variations: ['Cable Concentration Curls'],
        muscleGroup: 'biceps'
      },
      {
        id: 'incline_dumbbell_curls',
        name: 'Incline Dumbbell Curls',
        type: 'strength',
        bodyParts: ['biceps'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['biceps'],
        secondaryMuscles: ['forearms'],
        forceType: 'pull',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 16,
        instructions: [
          'Set bench to 45-60 degree incline',
          'Sit back on bench with dumbbells',
          'Let arms hang straight down',
          'Curl dumbbells to shoulder level'
        ],
        tips: [
          'Full stretch at bottom',
          'Don\'t swing',
          'Control negative movement'
        ],
        variations: ['Flat Bench Curls', 'Decline Curls'],
        muscleGroup: 'biceps'
      },

      // TRICEPS EXERCISES
      {
        id: 'close_grip_bench_press',
        name: 'Close Grip Bench Press',
        type: 'strength',
        bodyParts: ['triceps', 'chest'],
        equipmentType: 'barbell',
        primaryMuscles: ['triceps'],
        secondaryMuscles: ['chest', 'shoulders'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 8,
        duration: undefined,
        calories: 20,
        instructions: [
          'Lie on bench with close grip on bar',
          'Lower bar to lower chest',
          'Press bar up focusing on triceps',
          'Keep elbows tucked in'
        ],
        tips: [
          'Hands 6-12 inches apart',
          'Don\'t flare elbows',
          'Focus on triceps contraction'
        ],
        variations: ['Dumbbell Close Grip Press'],
        muscleGroup: 'triceps'
      },
      {
        id: 'skull_crushers',
        name: 'Skull Crushers',
        type: 'strength',
        bodyParts: ['triceps'],
        equipmentType: 'ez_bar',
        primaryMuscles: ['triceps'],
        secondaryMuscles: ['chest'],
        forceType: 'isolation',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 16,
        instructions: [
          'Lie on bench holding EZ bar',
          'Extend arms overhead',
          'Lower bar to forehead',
          'Extend arms back up'
        ],
        tips: [
          'Keep upper arms stationary',
          'Control negative movement',
          'Don\'t hit forehead'
        ],
        variations: ['Dumbbell Skull Crushers', 'Cable Skull Crushers'],
        muscleGroup: 'triceps'
      },
      {
        id: 'triceps_pushdowns',
        name: 'Triceps Pushdowns',
        type: 'strength',
        bodyParts: ['triceps'],
        equipmentType: 'triceps_pushdown',
        primaryMuscles: ['triceps'],
        secondaryMuscles: ['chest'],
        forceType: 'isolation',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 15,
        duration: undefined,
        calories: 14,
        instructions: [
          'Stand at cable pulldown machine',
          'Grip bar with overhand grip',
          'Push bar down until arms extended',
          'Slowly return to starting position'
        ],
        tips: [
          'Keep elbows at sides',
          'Don\'t lean forward',
          'Full range of motion'
        ],
        variations: ['Rope Pushdowns', 'V-Bar Pushdowns'],
        muscleGroup: 'triceps'
      },
      {
        id: 'overhead_triceps_extension',
        name: 'Overhead Triceps Extension',
        type: 'strength',
        bodyParts: ['triceps'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['triceps'],
        secondaryMuscles: ['shoulders'],
        forceType: 'isolation',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 14,
        instructions: [
          'Stand with dumbbell overhead',
          'Lower dumbbell behind head',
          'Extend arms back up',
          'Keep upper arms stationary'
        ],
        tips: [
          'Control negative movement',
          'Don\'t arch lower back',
          'Full stretch at bottom'
        ],
        variations: ['Cable Overhead Extension', 'Barbell Overhead Extension'],
        muscleGroup: 'triceps'
      },
      {
        id: 'dips',
        name: 'Dips',
        type: 'strength',
        bodyParts: ['triceps', 'chest'],
        equipmentType: 'dip_station',
        primaryMuscles: ['triceps'],
        secondaryMuscles: ['chest', 'shoulders'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'advanced',
        sets: 3,
        reps: 8,
        duration: undefined,
        calories: 18,
        instructions: [
          'Hold dip bars with straight arms',
          'Lower body until elbows are 90 degrees',
          'Push back up to starting position',
          'Keep body upright for triceps focus'
        ],
        tips: [
          'Keep chest up',
          'Don\'t lean too far forward',
          'Full range of motion'
        ],
        variations: ['Bench Dips', 'Weighted Dips'],
        muscleGroup: 'triceps'
      },

      // LEG EXERCISES
      {
        id: 'squats',
        name: 'Squats',
        type: 'strength',
        bodyParts: ['quads', 'glutes', 'hamstrings'],
        equipmentType: 'barbell',
        primaryMuscles: ['quads', 'glutes'],
        secondaryMuscles: ['hamstrings', 'lower_back'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'advanced',
        sets: 4,
        reps: 8,
        duration: undefined,
        calories: 30,
        instructions: [
          'Place bar on upper back',
          'Stand with feet shoulder-width apart',
          'Lower until thighs are parallel to floor',
          'Push through heels to starting position'
        ],
        tips: [
          'Keep chest up',
          'Don\'t round lower back',
          'Knees track over feet'
        ],
        variations: ['Front Squats', 'Hack Squats', 'Goblet Squats'],
        muscleGroup: 'legs'
      },
      {
        id: 'leg_press',
        name: 'Leg Press',
        type: 'strength',
        bodyParts: ['quads', 'glutes', 'hamstrings'],
        equipmentType: 'leg_press',
        primaryMuscles: ['quads', 'glutes'],
        secondaryMuscles: ['hamstrings'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 25,
        instructions: [
          'Sit in leg press machine',
          'Place feet on platform shoulder-width apart',
          'Lower platform until knees are 90 degrees',
          'Press platform back up'
        ],
        tips: [
          'Don\'t lock knees at top',
          'Control negative movement',
          'Full range of motion'
        ],
        variations: ['Wide Stance', 'Close Stance', 'Single Leg'],
        muscleGroup: 'legs'
      },
      {
        id: 'lunges',
        name: 'Lunges',
        type: 'strength',
        bodyParts: ['quads', 'glutes', 'hamstrings'],
        equipmentType: 'dumbbell',
        primaryMuscles: ['quads', 'glutes'],
        secondaryMuscles: ['hamstrings'],
        forceType: 'push',
        mechanicType: 'compound',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 10,
        duration: undefined,
        calories: 18,
        instructions: [
          'Stand with dumbbells at sides',
          'Step forward with one leg',
          'Lower until both knees are 90 degrees',
          'Push back to starting position'
        ],
        tips: [
          'Keep torso upright',
          'Front knee doesn\'t go past toes',
          'Control movement'
        ],
        variations: ['Walking Lunges', 'Reverse Lunges', 'Side Lunges'],
        muscleGroup: 'legs'
      },
      {
        id: 'leg_extensions',
        name: 'Leg Extensions',
        type: 'strength',
        bodyParts: ['quads'],
        equipmentType: 'leg_extension',
        primaryMuscles: ['quads'],
        secondaryMuscles: ['glutes'],
        forceType: 'isolation',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 16,
        instructions: [
          'Sit in leg extension machine',
          'Place shins behind pad',
          'Extend legs until straight',
          'Slowly return to starting position'
        ],
        tips: [
          'Don\'t snap knees at top',
          'Control negative movement',
          'Full contraction'
        ],
        variations: ['Single Leg Extensions'],
        muscleGroup: 'legs'
      },
      {
        id: 'leg_curls',
        name: 'Leg Curls',
        type: 'strength',
        bodyParts: ['hamstrings'],
        equipmentType: 'leg_curl',
        primaryMuscles: ['hamstrings'],
        secondaryMuscles: ['glutes'],
        forceType: 'isolation',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 16,
        instructions: [
          'Lie face down on leg curl machine',
          'Place heels under pad',
          'Curl legs toward glutes',
          'Slowly return to starting position'
        ],
        tips: [
          'Control negative movement',
          'Don\'t arch lower back',
          'Full range of motion'
        ],
        variations: ['Seated Leg Curls', 'Single Leg Curls'],
        muscleGroup: 'legs'
      },
      {
        id: 'calf_raises',
        name: 'Calf Raises',
        type: 'strength',
        bodyParts: ['calves'],
        equipmentType: 'calf_raise',
        primaryMuscles: ['calves'],
        secondaryMuscles: [],
        forceType: 'isolation',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 4,
        reps: 15,
        duration: undefined,
        calories: 12,
        instructions: [
          'Stand in calf raise machine',
          'Place shoulders under pads',
          'Raise up onto toes',
          'Lower heels below platform'
        ],
        tips: [
          'Full range of motion',
          'Don\'t bounce',
          'Control negative movement'
        ],
        variations: ['Seated Calf Raises', 'Donkey Calf Raises'],
        muscleGroup: 'legs'
      },

      // ABS EXERCISES
      {
        id: 'crunches',
        name: 'Crunches',
        type: 'strength',
        bodyParts: ['abdominals'],
        equipmentType: 'body_only',
        primaryMuscles: ['abdominals'],
        secondaryMuscles: ['obliques'],
        forceType: 'static',
        mechanicType: 'isolation',
        difficultyLevel: 'beginner',
        sets: 3,
        reps: 15,
        duration: undefined,
        calories: 8,
        instructions: [
          'Lie on back with knees bent',
          'Place hands behind head',
          'Lift shoulders off floor',
          'Lower with controlled movement'
        ],
        tips: [
          'Don\'t pull on neck',
          'Focus on ab contraction',
          'Control negative movement'
        ],
        variations: ['Cable Crunches', 'Machine Crunches'],
        muscleGroup: 'abs'
      },
      {
        id: 'leg_raises',
        name: 'Leg Raises',
        type: 'strength',
        bodyParts: ['abdominals'],
        equipmentType: 'body_only',
        primaryMuscles: ['lower_abs'],
        secondaryMuscles: ['hip_flexors'],
        forceType: 'static',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 12,
        duration: undefined,
        calories: 10,
        instructions: [
          'Lie on back with hands under hips',
          'Lift legs until perpendicular to floor',
          'Lower with controlled movement',
          'Keep lower back pressed to floor'
        ],
        tips: [
          'Don\'t arch lower back',
          'Control negative movement',
          'Focus on lower abs'
        ],
        variations: ['Hanging Leg Raises', 'Cable Leg Raises'],
        muscleGroup: 'abs'
      },
      {
        id: 'plank',
        name: 'Plank',
        type: 'strength',
        bodyParts: ['abdominals'],
        equipmentType: 'body_only',
        primaryMuscles: ['abdominals'],
        secondaryMuscles: ['shoulders', 'lower_back'],
        forceType: 'static',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: undefined,
        reps: undefined,
        duration: 60,
        calories: 8,
        instructions: [
          'Hold push-up position',
          'Keep body in straight line',
          'Engage core throughout',
          'Maintain steady breathing'
        ],
        tips: [
          'Don\'t let hips sag',
          'Keep neck neutral',
          'Focus on core engagement'
        ],
        variations: ['Side Plank', 'Plank with Leg Lift'],
        muscleGroup: 'abs'
      },
      {
        id: 'russian_twists',
        name: 'Russian Twists',
        type: 'strength',
        bodyParts: ['abdominals', 'obliques'],
        equipmentType: 'body_only',
        primaryMuscles: ['obliques'],
        secondaryMuscles: ['abdominals'],
        forceType: 'static',
        mechanicType: 'isolation',
        difficultyLevel: 'intermediate',
        sets: 3,
        reps: 20,
        duration: undefined,
        calories: 12,
        instructions: [
          'Sit with knees bent and feet off floor',
          'Lean back slightly',
          'Twist torso from side to side',
          'Keep core engaged throughout'
        ],
        tips: [
          'Don\'t round lower back',
          'Control movement',
          'Focus on oblique contraction'
        ],
        variations: ['Weighted Russian Twists', 'Cable Russian Twists'],
        muscleGroup: 'abs'
      }
    ];
  }

  // Get workout templates by body part
  static getWorkoutTemplatesByBodyPart(bodyPart: BodyPart): any[] {
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
  static getEquipmentSpecificWorkouts(equipment: EquipmentType): any[] {
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
