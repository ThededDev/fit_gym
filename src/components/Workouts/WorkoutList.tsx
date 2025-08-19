import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Dumbbell, Play, Edit3, Trash2, Filter } from 'lucide-react';
import { mockWorkoutTemplates, mockScheduledWorkouts, mockExercises } from '../../data/mockData';
import { useApp } from '../../contexts/AppContext';

export default function WorkoutList() {
  const { state } = useApp();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getExerciseName = (exerciseId: string) => {
    return mockExercises.find(ex => ex.id === exerciseId)?.name || 'Упражнение';
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Тренировки</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Управляйте тренировочными планами и шаблонами
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Фильтр</span>
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Создать тренировку</span>
          </motion.button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {[
          { key: 'all', label: 'Все тренировки' },
          { key: 'templates', label: 'Шаблоны' },
          { key: 'scheduled', label: 'Запланированные' },
          { key: 'completed', label: 'Выполненные' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workout Templates */}
      {(filter === 'all' || filter === 'templates') && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Шаблоны тренировок</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockWorkoutTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <div className="flex space-x-2">
                    <button className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{template.estimatedDuration} мин</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Dumbbell className="w-4 h-4" />
                    <span>{template.blocks.reduce((acc, block) => acc + block.exercises.length, 0)} упражнений</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Упражнения:</p>
                  <div className="space-y-1">
                    {template.blocks[0]?.exercises.slice(0, 2).map((exercise, idx) => (
                      <div key={idx} className="text-sm text-gray-900 dark:text-white">
                        • {getExerciseName(exercise.exerciseId)}
                      </div>
                    ))}
                    {template.blocks[0]?.exercises.length > 2 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        и ещё {template.blocks[0].exercises.length - 2}...
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Начать</span>
                  </motion.button>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Детали
                  </button>
                </div>

                {template.tags && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Workouts */}
      {(filter === 'all' || filter === 'scheduled') && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Запланированные тренировки</h2>
          <div className="space-y-4">
            {mockScheduledWorkouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {mockWorkoutTemplates.find(t => t.id === workout.templateId)?.name || 'Тренировка'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {new Date(workout.date).toLocaleDateString('ru-RU', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      workout.status === 'planned' 
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                        : workout.status === 'done'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400'
                    }`}>
                      {workout.status === 'planned' ? 'Запланировано' : 
                       workout.status === 'done' ? 'Выполнено' : 'Пропущено'}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-medium flex items-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Начать</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}