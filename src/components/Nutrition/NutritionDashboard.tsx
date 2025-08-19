import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Apple, Coffee, Utensils, Cookie } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { dailyTargets, mockFoodItems, mockMealEntries } from '../../data/mockData';

const macroColors = {
  protein: '#3B82F6',
  fat: '#10B981',
  carbs: '#F59E0B',
  calories: '#8B5CF6'
};

const mealIcons = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Apple,
  snack: Cookie
};

export default function NutritionDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddFood, setShowAddFood] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  // Calculate today's totals
  const todayMeals = mockMealEntries.filter(meal => 
    meal.date === format(selectedDate, 'yyyy-MM-dd')
  );

  const dailyTotals = todayMeals.reduce((acc, meal) => {
    meal.items.forEach(item => {
      const food = mockFoodItems.find(f => f.id === item.foodItemId);
      if (food) {
        const multiplier = (item.grams || 100) / 100;
        acc.calories += food.calories * multiplier;
        acc.protein += food.protein * multiplier;
        acc.fat += food.fat * multiplier;
        acc.carbs += food.carbs * multiplier;
      }
    });
    return acc;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0 });

  const macroData = [
    { name: 'Белки', value: Math.round(dailyTotals.protein), target: dailyTargets.protein, color: macroColors.protein },
    { name: 'Жиры', value: Math.round(dailyTotals.fat), target: dailyTargets.fat, color: macroColors.fat },
    { name: 'Углеводы', value: Math.round(dailyTotals.carbs), target: dailyTargets.carbs, color: macroColors.carbs }
  ];

  const calorieProgress = (dailyTotals.calories / dailyTargets.calories) * 100;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Питание</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Отслеживайте калории и макронутриенты
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddFood(true)}
            className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить еду</span>
          </motion.button>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calories Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Калории за день
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {format(selectedDate, 'd MMMM', { locale: ru })}
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {Math.round(dailyTotals.calories)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              из {dailyTargets.calories} ккал
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(calorieProgress, 100)}%` }}
              />
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {Math.round(calorieProgress)}% от цели
            </div>
          </div>

          {/* Macro Breakdown */}
          <div className="space-y-4">
            {macroData.map((macro) => {
              const progress = (macro.value / macro.target) * 100;
              return (
                <div key={macro.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {macro.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {macro.value}г / {macro.target}г
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: macro.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Macro Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Распределение БЖУ
          </h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {macroData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.value}г
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Meals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType, index) => {
          const Icon = mealIcons[mealType];
          const mealData = todayMeals.find(meal => meal.type === mealType);
          const mealCalories = mealData ? mealData.items.reduce((acc, item) => {
            const food = mockFoodItems.find(f => f.id === item.foodItemId);
            return acc + (food ? food.calories * ((item.grams || 100) / 100) : 0);
          }, 0) : 0;

          const mealNames = {
            breakfast: 'Завтрак',
            lunch: 'Обед',
            dinner: 'Ужин',
            snack: 'Перекус'
          };

          return (
            <motion.div
              key={mealType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {mealNames[mealType]}
                  </h3>
                </div>
                <button 
                  onClick={() => {
                    setSelectedMeal(mealType);
                    setShowAddFood(true);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {mealData ? (
                  <>
                    {mealData.items.map((item, idx) => {
                      const food = mockFoodItems.find(f => f.id === item.foodItemId);
                      return food ? (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div>
                            <div className="text-gray-900 dark:text-white font-medium">
                              {food.name}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {item.grams}г
                            </div>
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {Math.round(food.calories * ((item.grams || 100) / 100))} ккал
                          </div>
                        </div>
                      ) : null;
                    })}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-900 dark:text-white">Итого</span>
                        <span className="text-gray-900 dark:text-white">
                          {Math.round(mealCalories)} ккал
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Добавьте продукты</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Add Food Modal */}
      {showAddFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Добавить продукт
              </h3>
              <button
                onClick={() => setShowAddFood(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск продуктов..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              {mockFoodItems.slice(0, 6).map((food) => (
                <div
                  key={food.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {food.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {food.calories} ккал • {food.protein}г белка
                    </div>
                  </div>
                  <button className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-md text-sm hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors">
                    Добавить
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => setShowAddFood(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => setShowAddFood(false)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition duration-200"
              >
                Сохранить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}