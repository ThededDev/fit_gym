import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, TrendingUp, MessageCircle, Award, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const clientsData = [
  { name: 'Пн', completed: 8, planned: 10 },
  { name: 'Вт', completed: 12, planned: 15 },
  { name: 'Ср', completed: 10, planned: 12 },
  { name: 'Чт', completed: 14, planned: 16 },
  { name: 'Пт', completed: 11, planned: 14 },
  { name: 'Сб', completed: 9, planned: 11 },
  { name: 'Вс', completed: 6, planned: 8 }
];

const revenueData = [
  { month: 'Янв', revenue: 45000 },
  { month: 'Фев', revenue: 52000 },
  { month: 'Мар', revenue: 48000 },
  { month: 'Апр', revenue: 61000 },
  { month: 'Май', revenue: 58000 },
  { month: 'Июн', revenue: 67000 }
];

const clients = [
  {
    id: '1',
    name: 'Иван Петров',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'active',
    progress: 85,
    lastWorkout: '2 дня назад',
    compliance: 92
  },
  {
    id: '2',
    name: 'Анна Козлова',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'warning',
    progress: 60,
    lastWorkout: '5 дней назад',
    compliance: 78
  },
  {
    id: '3',
    name: 'Дмитрий Волков',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
    status: 'excellent',
    progress: 95,
    lastWorkout: '1 день назад',
    compliance: 98
  }
];

export default function CoachDashboard() {
  const today = new Date();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
      case 'warning':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Award className="w-4 h-4" />;
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Добро пожаловать, Мария!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {format(today, 'EEEE, d MMMM yyyy', { locale: ru })}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
            15 активных клиентов
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Всего клиентов</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">15</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">+2 за месяц</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Тренировок сегодня</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">8</p>
              <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">из 12 запланированных</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Соблюдение планов</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">89%</p>
              <p className="text-purple-600 dark:text-purple-400 text-sm mt-1">Средний показатель</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Непрочитанных</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">3</p>
              <p className="text-orange-600 dark:text-orange-400 text-sm mt-1">сообщения</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Активность за неделю
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Выполнено / Запланировано
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientsData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <Bar dataKey="planned" fill="#E5E7EB" radius={[4, 4, 4, 4]} />
                <Bar dataKey="completed" fill="#3B82F6" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Revenue Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Доходы
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Последние 6 месяцев
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `${value/1000}k`}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Client Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Обзор клиентов
          </h3>
          <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            Посмотреть всех
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={client.avatar}
                  alt={client.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {client.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {client.lastWorkout}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(client.status)}`}>
                  {getStatusIcon(client.status)}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Прогресс</span>
                    <span className="text-gray-900 dark:text-white font-medium">{client.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${client.progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Соблюдение</span>
                    <span className="text-gray-900 dark:text-white font-medium">{client.compliance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        client.compliance >= 90 
                          ? 'bg-green-500' 
                          : client.compliance >= 75 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${client.compliance}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}