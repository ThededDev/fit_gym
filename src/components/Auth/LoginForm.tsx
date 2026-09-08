import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { mockUsers, mockClientProfile, mockCoachProfile } from '../../data/mockData';
import { apiPost } from '../../lib/api';
import { User } from '../../types';

interface LoginFormProps {
  onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
  const { dispatch } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await apiPost<User>('/auth/login', { email, password });
      dispatch({ type: 'SET_USER', payload: user });
      
      if (user.role === 'client') {
        dispatch({ type: 'SET_CLIENT_PROFILE', payload: mockClientProfile });
      } else if (user.role === 'coach') {
        dispatch({ type: 'SET_COACH_PROFILE', payload: mockCoachProfile });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось войти');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'client' | 'coach') => {
    const demoUser = mockUsers.find(u => u.role === role);
    if (demoUser) {
      const user = await apiPost<User>('/auth/login', { email: demoUser.email, password: 'demo' });
      dispatch({ type: 'SET_USER', payload: user });
      
      if (user.role === 'client') {
        dispatch({ type: 'SET_CLIENT_PROFILE', payload: mockClientProfile });
      } else if (user.role === 'coach') {
        dispatch({ type: 'SET_COACH_PROFILE', payload: mockCoachProfile });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/ofg-logo.svg" alt="OFG" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ONE FitGym
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Войдите в свой аккаунт
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Введите ваш email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Введите пароль"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </motion.button>
          </form>

          {/* Demo Login */}
          <div className="mt-8 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Демо-вход:
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDemoLogin('client')}
                className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
              >
                Пользователь
              </button>
              <button
                onClick={() => handleDemoLogin('coach')}
                className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 py-2 px-4 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
              >
                Тренер
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={onToggleMode}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Нет аккаунта? Зарегистрироваться
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
