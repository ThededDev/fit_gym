import { User, ClientProfile, CoachProfile, Exercise, WorkoutTemplate, ScheduledWorkout, FoodItem, MealEntry, Goal, ProgressMetric, Comment } from '../types';
import { addDays, format, startOfWeek } from 'date-fns';

const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
const getCurrentWeekDate = (dayOffset: number) => format(addDays(currentWeekStart, dayOffset), 'yyyy-MM-dd');

export const mockUsers: User[] = [
  {
    id: 'client-1',
    role: 'client',
    email: 'ivan@example.com',
    phone: '+7 916 420-18-34',
    name: 'Иван Петров',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2024-01-15T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'client-2',
    role: 'client',
    email: 'anna@example.com',
    phone: '+7 903 118-42-07',
    name: 'Анна Козлова',
    avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2024-02-10T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'client-3',
    role: 'client',
    email: 'dmitry@example.com',
    phone: '+7 925 603-74-19',
    name: 'Дмитрий Волков',
    avatarUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2024-03-05T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'client-4',
    role: 'client',
    email: 'elena@example.com',
    phone: '+7 926 555-66-77',
    name: 'Елена Соколова',
    avatarUrl: 'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2024-04-20T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'coach-1',
    role: 'coach',
    email: 'maria@example.com',
    phone: '+7 985 712-50-16',
    name: 'Мария Смирнова',
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2023-06-01T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'coach-2',
    role: 'coach',
    email: 'alex@example.com',
    phone: '+7 977 888-99-00',
    name: 'Алексей Николаев',
    avatarUrl: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2023-08-15T00:00:00Z',
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
    date: getCurrentWeekDate(0),
    time: '10:00',
    templateId: 'wt-1',
    status: 'done',
    planned: mockWorkoutTemplates[0].blocks
  },
  {
    id: 'sw-2',
    clientId: 'client-1',
    date: getCurrentWeekDate(2),
    time: '18:30',
    templateId: 'wt-2',
    status: 'done',
    planned: mockWorkoutTemplates[1].blocks
  },
  {
    id: 'sw-3',
    clientId: 'client-1',
    date: getCurrentWeekDate(4),
    time: '16:00',
    templateId: 'wt-1',
    status: 'planned',
    planned: mockWorkoutTemplates[0].blocks
  },
  {
    id: 'sw-4',
    clientId: 'client-1',
    date: getCurrentWeekDate(6),
    time: '11:00',
    templateId: 'wt-2',
    status: 'planned',
    planned: mockWorkoutTemplates[1].blocks
  },
  {
    id: 'sw-5',
    clientId: 'client-1',
    date: getCurrentWeekDate(9),
    time: '19:00',
    templateId: 'wt-1',
    status: 'planned',
    planned: mockWorkoutTemplates[0].blocks
  },
  {
    id: 'sw-6',
    clientId: 'client-2',
    date: getCurrentWeekDate(2),
    time: '10:00',
    templateId: 'wt-1',
    status: 'planned',
    planned: mockWorkoutTemplates[0].blocks
  },
  {
    id: 'sw-7',
    clientId: 'client-3',
    date: getCurrentWeekDate(2),
    time: '14:30',
    templateId: 'wt-2',
    status: 'planned',
    planned: mockWorkoutTemplates[1].blocks
  },
  {
    id: 'sw-8',
    clientId: 'client-2',
    date: getCurrentWeekDate(4),
    time: '12:00',
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
    createdBy: 'coach',
    type: 'weight',
    targetValue: 78,
    startValue: 85.2,
    currentValue: 82.5,
    unit: 'kg',
    deadline: getCurrentWeekDate(55),
    note: 'Снизить вес до 78 кг',
    createdAt: getCurrentWeekDate(-20),
    status: 'active'
  },
  {
    id: 'goal-2',
    clientId: 'client-1',
    createdBy: 'client',
    type: 'strength',
    targetValue: 100,
    startValue: 70,
    currentValue: 80,
    unit: 'kg',
    note: 'Жим лёжа 100 кг на 1 раз',
    deadline: getCurrentWeekDate(90),
    createdAt: getCurrentWeekDate(-12),
    status: 'active'
  },
  {
    id: 'goal-3',
    clientId: 'client-1',
    createdBy: 'coach',
    type: 'habit',
    targetValue: 12,
    startValue: 0,
    currentValue: 8,
    unit: 'times',
    note: 'Выполнить 12 тренировок за месяц',
    deadline: getCurrentWeekDate(28),
    createdAt: getCurrentWeekDate(-4),
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
