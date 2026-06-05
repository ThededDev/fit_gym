export type Role = 'client' | 'coach' | 'admin';

export interface User {
  id: string;
  role: Role;
  email: string;
  phone?: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  locale?: 'ru' | 'en';
}

export interface ClientProfile {
  userId: string;
  sex?: 'male' | 'female' | 'other';
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: 'low' | 'medium' | 'high';
  goalType?: 'lose' | 'maintain' | 'gain';
  coachId?: string;
  privacy: { progressPhotosVisibleToCoach: boolean; };
}

export interface CoachProfile {
  userId: string;
  bio?: string;
  specialties?: string[];
  inviteCode: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment?: string[];
  videoUrl?: string;
  instructions?: string;
}

export interface WorkoutTemplate {
  id: string;
  coachId?: string;
  name: string;
  blocks: WorkoutBlock[];
  tags?: string[];
  estimatedDuration?: number;
}

export interface WorkoutBlock {
  title?: string;
  exercises: PlannedExercise[];
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  reps?: number | number[];
  weightKg?: number | number[];
  tempo?: string;
  restSec?: number;
  notes?: string;
}

export interface ScheduledWorkout {
  id: string;
  clientId: string;
  date: string;
  time?: string;
  templateId?: string;
  planned: WorkoutBlock[];
  status: 'planned' | 'done' | 'skipped';
}

export interface WorkoutLog {
  id: string;
  scheduledWorkoutId: string;
  startedAt?: string;
  finishedAt?: string;
  performed: PerformedExercise[];
  rpeAvg?: number;
  notes?: string;
}

export interface PerformedExercise {
  exerciseId: string;
  sets: PerformedSet[];
}

export interface PerformedSet {
  setIndex: number;
  weightKg?: number;
  reps?: number;
  rpe?: number;
  completed: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  servingSize?: string;
  barcode?: string;
}

export interface MealEntry {
  id: string;
  clientId: string;
  date: string;
  items: MealItem[];
  notes?: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface MealItem {
  foodItemId: string;
  grams?: number;
  servings?: number;
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  coachId?: string;
  dailyTargets: MacroTargets;
  meals?: PlannedMeal[];
  startDate?: string;
  endDate?: string;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  tolerancePercent?: number;
}

export interface PlannedMeal {
  title: string;
  items: { foodItemId: string; grams?: number; }[];
}

export interface Goal {
  id: string;
  clientId: string;
  createdBy: 'client' | 'coach';
  type: 'weight' | 'strength' | 'habit' | 'measure';
  targetValue?: number;
  startValue?: number;
  currentValue?: number;
  unit?: 'kg' | 'cm' | 'reps' | 'times';
  deadline?: string;
  note?: string;
  createdAt: string;
  status: 'active' | 'achieved' | 'failed';
}

export interface ProgressMetric {
  id: string;
  clientId: string;
  date: string;
  weightKg?: number;
  measurements?: Record<string, number>;
  prByExercise?: Record<string, number>;
  photos?: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  clientId: string;
  entityType: 'workout' | 'meal' | 'goal' | 'progress' | 'general';
  entityId?: string;
  text: string;
  visibility: 'coach_and_client' | 'coach_private';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'comment' | 'plan_update';
  payload: unknown;
  read: boolean;
  createdAt: string;
}

export type Theme = 'light' | 'dark';
