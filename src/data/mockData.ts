import { User, ClientProfile, CoachProfile, Exercise, WorkoutTemplate, ScheduledWorkout, FoodItem, MealEntry, Goal, ProgressMetric, Comment } from '../types';

export const mockUsers: User[] = [
  {
    id: 'client-1',
    role: 'client',
    email: 'ivan@example.com',
    name: 'Иван Петров',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2024-01-15T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'coach-1',
    role: 'coach',
    email: 'maria@example.com',
    name: 'Мария Смирнова',
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2023-06-01T00:00:00Z',
    locale: 'ru'
  }
];

export const mockClientProfile: ClientProfile = {
  userId: 'client-1',
  sex: 'male',
  birthDate: '1990-05-15',
  heightCm: 180,
  weightKg: 82.5,
  activityLevel: 'medium',
  goalType: 'lose',
  coachId: 'coach-1',
  privacy: { progressPhotosVisibleToCoach: true }
};

export const mockCoachProfile: CoachProfile = {
  userId: 'coach-1',
  bio: 'Сертифицированный тренер с 8-летним опытом. Специализируюсь на силовых тренировках и коррекции питания.',
  specialties: ['Силовые тренировки', 'Похудение', 'Набор мышечной массы'],
  inviteCode: 'MARIA2024'
};

export const mockExercises: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Приседания со штангой',
    muscleGroups: ['Квадрицепс', 'Ягодицы', 'Задняя поверхность бедра'],
    equipment: ['Штанга', 'Стойка'],
    instructions: 'Поставьте штангу на верхнюю часть трапеций, ноги на ширине плеч'
  },
  {
    id: 'ex-2',
    name: 'Жим лёжа',
    muscleGroups: ['Грудные', 'Трицепс', 'Передние дельты'],
    equipment: ['Штанга', 'Скамья'],
    instructions: 'Лягте на скамью, возьмите штангу хватом шире плеч'
  },
  {
    id: 'ex-3',
    name: 'Становая тяга',
    muscleGroups: ['Спина', 'Ягодицы', 'Задняя поверхность бедра'],
    equipment: ['Штанга'],
    instructions: 'Встаньте над штангой, возьмите её хватом на ширине плеч'
  },
  {
    id: 'ex-4',
    name: 'Подтягивания',
    muscleGroups: ['Широчайшие', 'Бицепс', 'Задние дельты'],
    equipment: ['Турник'],
    instructions: 'Повисните на турнике, подтягивайтесь до касания подбородком'
  }
];

export const mockWorkoutTemplates: WorkoutTemplate[] = [
  {
    id: 'wt-1',
    coachId: 'coach-1',
    name: 'Грудь и Трицепс',
    estimatedDuration: 60,
    blocks: [
      {
        title: 'Основные упражнения',
        exercises: [
          {
            exerciseId: 'ex-2',
            sets: 4,
            reps: [8, 6, 6, 8],
            weightKg: 80,
            restSec: 180
          }
        ]
      }
    ],
    tags: ['Верх', 'Силовая']
  },
  {
    id: 'wt-2',
    coachId: 'coach-1',
    name: 'Ноги и Ягодицы',
    estimatedDuration: 75,
    blocks: [
      {
        title: 'Основные упражнения',
        exercises: [
          {
            exerciseId: 'ex-1',
            sets: 4,
            reps: 10,
            weightKg: 100,
            restSec: 240
          },
          {
            exerciseId: 'ex-3',
            sets: 3,
            reps: 8,
            weightKg: 120,
            restSec: 300
          }
        ]
      }
    ],
    tags: ['Низ', 'Силовая']
  }
];

export const mockScheduledWorkouts: ScheduledWorkout[] = [
  {
    id: 'sw-1',
    clientId: 'client-1',
    date: '2025-01-16',
    templateId: 'wt-1',
    status: 'planned',
    planned: mockWorkoutTemplates[0].blocks
  },
  {
    id: 'sw-2',
    clientId: 'client-1',
    date: '2025-01-18',
    templateId: 'wt-2',
    status: 'planned',
    planned: mockWorkoutTemplates[1].blocks
  }
];

export const mockFoodItems: FoodItem[] = [
  {
    id: 'food-1',
    name: 'Куриная грудка',
    calories: 165,
    protein: 31,
    fat: 3.6,
    carbs: 0,
    servingSize: '100г'
  },
  {
    id: 'food-2',
    name: 'Рис басмати',
    calories: 130,
    protein: 2.7,
    fat: 0.3,
    carbs: 28,
    servingSize: '100г вареного'
  },
  {
    id: 'food-3',
    name: 'Овсянка',
    calories: 68,
    protein: 2.4,
    fat: 1.4,
    carbs: 12,
    servingSize: '100г вареной'
  },
  {
    id: 'food-4',
    name: 'Яйца куриные',
    calories: 155,
    protein: 13,
    fat: 11,
    carbs: 1.1,
    servingSize: '100г'
  }
];

export const mockMealEntries: MealEntry[] = [
  {
    id: 'meal-1',
    clientId: 'client-1',
    date: '2025-01-16',
    type: 'breakfast',
    items: [
      { foodItemId: 'food-3', grams: 50 },
      { foodItemId: 'food-4', grams: 60 }
    ],
    notes: 'Завтрак'
  },
  {
    id: 'meal-2',
    clientId: 'client-1',
    date: '2025-01-16',
    type: 'lunch',
    items: [
      { foodItemId: 'food-1', grams: 150 },
      { foodItemId: 'food-2', grams: 100 }
    ],
    notes: 'Обед'
  }
];

export const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    clientId: 'client-1',
    type: 'weight',
    targetValue: 78,
    currentValue: 82.5,
    unit: 'kg',
    deadline: '2025-04-01',
    note: 'Снизить вес до 78 кг',
    status: 'active'
  },
  {
    id: 'goal-2',
    clientId: 'client-1',
    type: 'strength',
    targetValue: 100,
    currentValue: 80,
    unit: 'kg',
    note: 'Жим лёжа 100 кг на 1 раз',
    status: 'active'
  }
];

export const mockProgressMetrics: ProgressMetric[] = [
  {
    id: 'pm-1',
    clientId: 'client-1',
    date: '2025-01-01',
    weightKg: 85.2,
    measurements: { waist: 88, chest: 98 }
  },
  {
    id: 'pm-2',
    clientId: 'client-1',
    date: '2025-01-08',
    weightKg: 84.1,
    measurements: { waist: 87, chest: 98 }
  },
  {
    id: 'pm-3',
    clientId: 'client-1',
    date: '2025-01-15',
    weightKg: 82.5,
    measurements: { waist: 86, chest: 98 }
  }
];

export const mockComments: Comment[] = [
  {
    id: 'comment-1',
    authorId: 'coach-1',
    clientId: 'client-1',
    entityType: 'general',
    text: 'Отличная работа на этой неделе! Продолжайте в том же духе.',
    visibility: 'coach_and_client',
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'comment-2',
    authorId: 'coach-1',
    clientId: 'client-1',
    entityType: 'workout',
    entityId: 'sw-1',
    text: 'В следующий раз попробуйте увеличить вес на 2.5 кг',
    visibility: 'coach_and_client',
    createdAt: '2025-01-16T15:30:00Z'
  }
];

export const dailyTargets = {
  calories: 2200,
  protein: 160,
  fat: 70,
  carbs: 240,
  tolerancePercent: 10
};