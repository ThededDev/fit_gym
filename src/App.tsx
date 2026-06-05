import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Layout/Sidebar';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import ClientDashboard from './components/Dashboard/ClientDashboard';
import CoachDashboard from './components/Dashboard/CoachDashboard';
import WorkoutList from './components/Workouts/WorkoutList';
import NutritionDashboard from './components/Nutrition/NutritionDashboard';
import WorkoutCalendar from './components/Calendar/WorkoutCalendar';
import GoalsDashboard from './components/Goals/GoalsDashboard';
import CoachClients from './components/Clients/CoachClients';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  return isLogin ? 
    <LoginForm onToggleMode={() => setIsLogin(false)} /> : 
    <RegisterForm onToggleMode={() => setIsLogin(true)} />;
}

function AppContent() {
  const { state } = useApp();
  
  if (!state.user) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 ml-72 overflow-y-auto">
        <Routes>
          <Route 
            path="/dashboard" 
            element={
              state.user.role === 'coach' ? <CoachDashboard /> : <ClientDashboard />
            } 
          />
          <Route path="/workouts" element={<WorkoutList />} />
          <Route path="/nutrition" element={<NutritionDashboard />} />
          <Route path="/calendar" element={<WorkoutCalendar />} />
          <Route path="/goals" element={<GoalsDashboard />} />
          <Route path="/progress" element={<div className="p-6"><h1 className="text-2xl font-bold">Прогресс (В разработке)</h1></div>} />
          <Route path="/coach/clients" element={<CoachClients />} />
          <Route path="/library" element={<div className="p-6"><h1 className="text-2xl font-bold">Библиотека (В разработке)</h1></div>} />
          <Route path="/messages" element={<div className="p-6"><h1 className="text-2xl font-bold">Сообщения (В разработке)</h1></div>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;
