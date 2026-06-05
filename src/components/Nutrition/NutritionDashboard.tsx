import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Apple,
  CalendarDays,
  CheckCircle2,
  Coffee,
  Cookie,
  Edit3,
  Plus,
  Save,
  Salad,
  Trash2,
  Utensils,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { dailyTargets, mockFoodItems, mockMealEntries, mockUsers } from '../../data/mockData';
import { MacroTargets, NutritionPlan, PlannedMeal } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import { User } from '../../types';

const mealIcons = [Coffee, Utensils, Apple, Cookie];
const mealColors = [
  'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300',
  'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
  'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300'
];

const initialPlans: NutritionPlan[] = [
  {
    id: 'nutrition-1',
    clientId: 'client-1',
    coachId: 'coach-1',
    dailyTargets,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    meals: [
      { title: 'Завтрак', items: [{ foodItemId: 'food-3', grams: 80 }, { foodItemId: 'food-4', grams: 120 }] },
      { title: 'Обед', items: [{ foodItemId: 'food-1', grams: 180 }, { foodItemId: 'food-2', grams: 150 }] },
      { title: 'Ужин', items: [{ foodItemId: 'food-1', grams: 150 }] }
    ]
  },
  {
    id: 'nutrition-2',
    clientId: 'client-2',
    coachId: 'coach-1',
    dailyTargets: { calories: 1900, protein: 125, fat: 65, carbs: 205 },
    startDate: format(new Date(), 'yyyy-MM-dd'),
    meals: [
      { title: 'Завтрак', items: [{ foodItemId: 'food-3', grams: 70 }] },
      { title: 'Обед', items: [{ foodItemId: 'food-1', grams: 140 }, { foodItemId: 'food-2', grams: 120 }] }
    ]
  }
];

function getFood(foodItemId: string) {
  return mockFoodItems.find(food => food.id === foodItemId);
}

function getMealCalories(meal: PlannedMeal) {
  return Math.round(meal.items.reduce((total, item) => {
    const food = getFood(item.foodItemId);
    return total + (food ? food.calories * ((item.grams ?? 100) / 100) : 0);
  }, 0));
}

export default function NutritionDashboard() {
  const { state } = useApp();
  const isCoach = state.user?.role === 'coach';
  const [clients, setClients] = useState<User[]>(mockUsers.filter(user => user.role === 'client'));
  const [selectedClientId, setSelectedClientId] = useState(isCoach ? 'client-1' : state.user?.id ?? 'client-1');
  const [plans, setPlans] = useState(initialPlans);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftTargets, setDraftTargets] = useState<MacroTargets>(dailyTargets);
  const [draftMeals, setDraftMeals] = useState<PlannedMeal[]>([]);
  const [mealTitle, setMealTitle] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState(mockFoodItems[0]?.id ?? '');
  const [foodGrams, setFoodGrams] = useState('100');

  useEffect(() => {
    Promise.all([apiGet<User[]>('/clients'), apiGet<NutritionPlan[]>('/nutrition-plans')])
      .then(([nextClients, nextPlans]) => {
        setClients(nextClients);
        setPlans(nextPlans);
      })
      .catch(console.error);
  }, []);

  const selectedClient = clients.find(client => client.id === selectedClientId);
  const activePlan = plans.find(plan => plan.clientId === selectedClientId);
  const selectedDate = format(new Date(), 'yyyy-MM-dd');

  const dailyTotals = useMemo(() => {
    const clientMeals = mockMealEntries.filter(meal => meal.clientId === selectedClientId && meal.date === selectedDate);
    return clientMeals.reduce((total, meal) => {
      meal.items.forEach(item => {
        const food = getFood(item.foodItemId);
        if (!food) return;
        const multiplier = (item.grams ?? 100) / 100;
        total.calories += food.calories * multiplier;
        total.protein += food.protein * multiplier;
        total.fat += food.fat * multiplier;
        total.carbs += food.carbs * multiplier;
      });
      return total;
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  }, [selectedClientId, selectedDate]);

  const openEditor = () => {
    setDraftTargets(activePlan?.dailyTargets ?? { calories: 2000, protein: 140, fat: 70, carbs: 220 });
    setDraftMeals(activePlan?.meals ?? []);
    setIsEditorOpen(true);
  };

  const handleAddMeal = () => {
    if (!mealTitle.trim()) return;
    setDraftMeals(current => [...current, { title: mealTitle.trim(), items: [] }]);
    setMealTitle('');
  };

  const handleAddFood = (mealIndex: number) => {
    setDraftMeals(current => current.map((meal, index) => (
      index === mealIndex
        ? { ...meal, items: [...meal.items, { foodItemId: selectedFoodId, grams: Number(foodGrams) }] }
        : meal
    )));
  };

  const handleSavePlan = async () => {
    const plan: NutritionPlan = {
      id: activePlan?.id ?? `nutrition-${Date.now()}`,
      clientId: selectedClientId,
      coachId: state.user?.id,
      dailyTargets: draftTargets,
      meals: draftMeals,
      startDate: format(new Date(), 'yyyy-MM-dd')
    };

    const saved = activePlan
      ? await apiPatch<NutritionPlan>(`/nutrition-plans/${activePlan.id}`, plan)
      : await apiPost<NutritionPlan>('/nutrition-plans', plan);
    setPlans(current => [...current.filter(item => item.clientId !== selectedClientId), saved]);
    setIsEditorOpen(false);
  };

  const targetRows = [
    ['Калории', activePlan?.dailyTargets.calories ?? 0, 'ккал', 'bg-purple-500'],
    ['Белки', activePlan?.dailyTargets.protein ?? 0, 'г', 'bg-blue-500'],
    ['Жиры', activePlan?.dailyTargets.fat ?? 0, 'г', 'bg-emerald-500'],
    ['Углеводы', activePlan?.dailyTargets.carbs ?? 0, 'г', 'bg-orange-500']
  ] as const;

  const actualRows = [
    ['Калории', dailyTotals.calories, activePlan?.dailyTargets.calories ?? 0, 'ккал', 'bg-purple-500'],
    ['Белки', dailyTotals.protein, activePlan?.dailyTargets.protein ?? 0, 'г', 'bg-blue-500'],
    ['Жиры', dailyTotals.fat, activePlan?.dailyTargets.fat ?? 0, 'г', 'bg-emerald-500'],
    ['Углеводы', dailyTotals.carbs, activePlan?.dailyTargets.carbs ?? 0, 'г', 'bg-orange-500']
  ] as const;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Рацион и нормативы
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Питание</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isCoach ? 'Настраивайте КБЖУ и назначайте программу питания подопечному.' : 'Следите за назначенным рационом и дневными показателями.'}
          </p>
        </div>
        {isCoach && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openEditor}
            className="flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg"
          >
            <Edit3 className="h-4 w-4" />
            {activePlan ? 'Изменить программу' : 'Назначить программу'}
          </motion.button>
        )}
      </header>

      {isCoach && (
        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Подопечный</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Выберите клиента для просмотра или назначения плана.</p>
          </div>
          <select
            value={selectedClientId}
            onChange={event => setSelectedClientId(event.target.value)}
            className="md:ml-auto rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {targetRows.map(([label, value, unit, color]) => (
          <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className={`h-2 w-10 rounded-full ${color}`} />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{label} в сутки</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value} <span className="text-sm font-medium text-gray-400">{unit}</span></p>
          </div>
        ))}
      </section>

      {!activePlan ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <Salad className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
          <h2 className="mt-3 font-semibold text-gray-900 dark:text-white">Программа питания не назначена</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isCoach ? `Составьте КБЖУ и рацион для ${selectedClient?.name}.` : 'Тренер ещё не сформировал для вас рацион.'}
          </p>
          {isCoach && (
            <button onClick={openEditor} className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400">
              + Назначить программу
            </button>
          )}
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Программа питания</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isCoach ? `Назначена для ${selectedClient?.name}` : 'Ваш ежедневный ориентир'}
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Активна с {activePlan.startDate ? format(new Date(activePlan.startDate), 'd MMMM', { locale: ru }) : 'сегодня'}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {activePlan.meals?.map((meal, index) => {
                const Icon = mealIcons[index % mealIcons.length];
                return (
                  <article key={`${meal.title}-${index}`} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${mealColors[index % mealColors.length]}`}><Icon className="h-4 w-4" /></div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{meal.title}</h3>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{getMealCalories(meal)} ккал</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {meal.items.map((item, itemIndex) => (
                        <div key={`${item.foodItemId}-${itemIndex}`} className="flex justify-between gap-3 text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{getFood(item.foodItemId)?.name}</span>
                          <span className="text-gray-400">{item.grams} г</span>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">Факт за сегодня</h2>
              <CalendarDays className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{format(new Date(), 'd MMMM yyyy', { locale: ru })}</p>
            <div className="mt-5 space-y-4">
              {actualRows.map(([label, value, target, unit, color]) => {
                const progress = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">{label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{Math.round(value)} / {target} {unit}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      <AnimatePresence>
        {isCoach && isEditorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4"
            onClick={() => setIsEditorOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onClick={event => event.stopPropagation()}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{selectedClient?.name}</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Программа питания</h2>
                </div>
                <button onClick={() => setIsEditorOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {([
                  ['Калории', 'calories', 'ккал'],
                  ['Белки', 'protein', 'г'],
                  ['Жиры', 'fat', 'г'],
                  ['Углеводы', 'carbs', 'г']
                ] as const).map(([label, key, unit]) => (
                  <label key={key}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
                    <div className="relative mt-2">
                      <input
                        type="number"
                        value={draftTargets[key]}
                        onChange={event => setDraftTargets(current => ({ ...current, [key]: Number(event.target.value) }))}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 pr-12 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">Приёмы пищи</h3>
                <div className="mt-3 space-y-3">
                  {draftMeals.map((meal, mealIndex) => (
                    <article key={`${meal.title}-${mealIndex}`} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{meal.title}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{getMealCalories(meal)} ккал</p>
                        </div>
                        <button
                          onClick={() => setDraftMeals(current => current.filter((_, index) => index !== mealIndex))}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {meal.items.map((item, itemIndex) => (
                          <div key={`${item.foodItemId}-${itemIndex}`} className="flex justify-between text-sm">
                            <span className="text-gray-700 dark:text-gray-300">{getFood(item.foodItemId)?.name}</span>
                            <span className="text-gray-400">{item.grams} г</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <select
                          value={selectedFoodId}
                          onChange={event => setSelectedFoodId(event.target.value)}
                          className="min-w-40 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          {mockFoodItems.map(food => <option key={food.id} value={food.id}>{food.name}</option>)}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={foodGrams}
                          onChange={event => setFoodGrams(event.target.value)}
                          className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <button onClick={() => handleAddFood(mealIndex)} className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          + Продукт
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={mealTitle}
                    onChange={event => setMealTitle(event.target.value)}
                    placeholder="Например, Завтрак"
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <button onClick={handleAddMeal} className="flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700 dark:border-blue-900/60 dark:text-blue-300">
                    <Plus className="h-4 w-4" />
                    Приём пищи
                  </button>
                </div>
              </div>

              <button
                onClick={handleSavePlan}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg"
              >
                <Save className="h-4 w-4" />
                Назначить программу питания
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
