import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, Calendar, Dumbbell, Apple, Target,
  Users, MessageSquare, LogOut, Moon, Sun
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const clientNavItems = [
  { path: '/dashboard', icon: Home, label: 'Главная' },
  { path: '/calendar', icon: Calendar, label: 'Календарь' },
  { path: '/workouts', icon: Dumbbell, label: 'Тренировки' },
  { path: '/nutrition', icon: Apple, label: 'Питание' },
  { path: '/goals', icon: Target, label: 'Цели' },
  { path: '/messages', icon: MessageSquare, label: 'Сообщения' },
];

const coachNavItems = [
  { path: '/dashboard', icon: Home, label: 'Главная' },
  { path: '/calendar', icon: Calendar, label: 'Календарь' },
  { path: '/coach/clients', icon: Users, label: 'Подопечные' },
  { path: '/workouts', icon: Dumbbell, label: 'Тренировки' },
  { path: '/nutrition', icon: Apple, label: 'Питание' },
  { path: '/goals', icon: Target, label: 'Цели' },
  { path: '/messages', icon: MessageSquare, label: 'Сообщения' },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const location = useLocation();
  
  const navItems = state.user?.role === 'coach' ? coachNavItems : clientNavItems;

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ONE FitGym</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {state.user?.role === 'coach' ? 'Тренер' : 'Пользователь'}
            </p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img
            src={state.user?.avatarUrl || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`}
            alt={state.user?.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {state.user?.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {state.user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link to={item.path}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors duration-200"
        >
          {state.theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span className="font-medium">
            {state.theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          </span>
        </button>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Выйти</span>
        </button>
      </div>
    </motion.aside>
  );
}
