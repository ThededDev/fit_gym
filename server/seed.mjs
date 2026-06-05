import { addDays, format, startOfWeek } from 'date-fns';
import { hashPassword } from './auth.mjs';

const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
const weekDate = (offset) => format(addDays(weekStart, offset), 'yyyy-MM-dd');

export function createSeedData() {
  const templates = [
    { id: 'wt-1', coachId: 'coach-1', name: 'Грудь и Трицепс', estimatedDuration: 60, tags: ['Верх', 'Силовая'], blocks: [{ title: 'Основные упражнения', exercises: [{ exerciseId: 'ex-2', sets: 4, reps: [8, 6, 6, 8], weightKg: 80, restSec: 180 }] }] },
    { id: 'wt-2', coachId: 'coach-1', name: 'Ноги и Ягодицы', estimatedDuration: 75, tags: ['Низ', 'Силовая'], blocks: [{ title: 'Основные упражнения', exercises: [{ exerciseId: 'ex-1', sets: 4, reps: 10, weightKg: 100, restSec: 240 }, { exerciseId: 'ex-3', sets: 3, reps: 8, weightKg: 120, restSec: 300 }] }] }
  ];

  return {
    users: [
      { id: 'client-1', role: 'client', email: 'ivan@example.com', passwordHash: hashPassword('demo'), phone: '+7 916 420-18-34', name: 'Иван Петров', avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150', createdAt: '2024-01-15T00:00:00Z', locale: 'ru', coachId: 'coach-1' },
      { id: 'client-2', role: 'client', email: 'anna@example.com', passwordHash: hashPassword('demo'), phone: '+7 903 118-42-07', name: 'Анна Козлова', avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150', createdAt: '2024-02-10T00:00:00Z', locale: 'ru', coachId: 'coach-1' },
      { id: 'client-3', role: 'client', email: 'dmitry@example.com', passwordHash: hashPassword('demo'), phone: '+7 925 603-74-19', name: 'Дмитрий Волков', avatarUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150', createdAt: '2024-03-05T00:00:00Z', locale: 'ru', coachId: 'coach-1' },
      { id: 'coach-1', role: 'coach', email: 'maria@example.com', passwordHash: hashPassword('demo'), phone: '+7 985 712-50-16', name: 'Мария Смирнова', avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150', createdAt: '2023-06-01T00:00:00Z', locale: 'ru' }
    ],
    exercises: [
      { id: 'ex-1', name: 'Приседания со штангой', muscleGroups: ['Квадрицепс', 'Ягодицы'], equipment: ['Штанга', 'Стойка'] },
      { id: 'ex-2', name: 'Жим лёжа', muscleGroups: ['Грудные', 'Трицепс'], equipment: ['Штанга', 'Скамья'] },
      { id: 'ex-3', name: 'Становая тяга', muscleGroups: ['Спина', 'Ягодицы'], equipment: ['Штанга'] },
      { id: 'ex-4', name: 'Подтягивания', muscleGroups: ['Широчайшие', 'Бицепс'], equipment: ['Турник'] }
    ],
    workoutTemplates: templates,
    scheduledWorkouts: [
      { id: 'sw-1', clientId: 'client-1', date: weekDate(0), time: '10:00', templateId: 'wt-1', status: 'done', planned: templates[0].blocks },
      { id: 'sw-2', clientId: 'client-1', date: weekDate(2), time: '18:30', templateId: 'wt-2', status: 'done', planned: templates[1].blocks },
      { id: 'sw-3', clientId: 'client-1', date: weekDate(4), time: '16:00', templateId: 'wt-1', status: 'planned', planned: templates[0].blocks },
      { id: 'sw-4', clientId: 'client-2', date: weekDate(2), time: '10:00', templateId: 'wt-1', status: 'planned', planned: templates[0].blocks },
      { id: 'sw-5', clientId: 'client-3', date: weekDate(2), time: '14:30', templateId: 'wt-2', status: 'planned', planned: templates[1].blocks }
    ],
    goals: [
      { id: 'goal-1', clientId: 'client-1', createdBy: 'coach', type: 'weight', targetValue: 78, startValue: 85.2, currentValue: 82.5, unit: 'kg', deadline: weekDate(55), note: 'Снизить вес до 78 кг', createdAt: weekDate(-20), status: 'active' },
      { id: 'goal-2', clientId: 'client-1', createdBy: 'client', type: 'strength', targetValue: 100, startValue: 70, currentValue: 80, unit: 'kg', deadline: weekDate(90), note: 'Жим лёжа 100 кг на 1 раз', createdAt: weekDate(-12), status: 'active' }
    ],
    nutritionPlans: [{ id: 'nutrition-1', clientId: 'client-1', coachId: 'coach-1', dailyTargets: { calories: 2200, protein: 160, fat: 70, carbs: 240 }, startDate: weekDate(0), meals: [{ title: 'Завтрак', items: [{ foodItemId: 'food-3', grams: 80 }, { foodItemId: 'food-4', grams: 120 }] }, { title: 'Обед', items: [{ foodItemId: 'food-1', grams: 180 }, { foodItemId: 'food-2', grams: 150 }] }] }],
    foodItems: [
      { id: 'food-1', name: 'Куриная грудка', calories: 165, protein: 31, fat: 3.6, carbs: 0, servingSize: '100г' },
      { id: 'food-2', name: 'Рис басмати', calories: 130, protein: 2.7, fat: 0.3, carbs: 28, servingSize: '100г вареного' },
      { id: 'food-3', name: 'Овсянка', calories: 68, protein: 2.4, fat: 1.4, carbs: 12, servingSize: '100г вареной' },
      { id: 'food-4', name: 'Яйца куриные', calories: 155, protein: 13, fat: 11, carbs: 1.1, servingSize: '100г' }
    ],
    mealEntries: [],
    comments: []
  };
}
