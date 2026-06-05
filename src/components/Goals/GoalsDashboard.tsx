import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Flag,
  Gauge,
  Plus,
  Ruler,
  Trash2,
  X
} from 'lucide-react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { mockGoals, mockUsers } from '../../data/mockData';
import { Goal } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';
import { User } from '../../types';

type GoalFilter = 'active' | 'achieved' | 'all';

const typeLabels: Record<Goal['type'], string> = {
  weight: 'Вес',
  strength: 'Силовой показатель',
  habit: 'Регулярность',
  measure: 'Замеры'
};

const typeIcons = {
  weight: Gauge,
  strength: Dumbbell,
  habit: CalendarDays,
  measure: Ruler
};

const unitLabels: Record<NonNullable<Goal['unit']>, string> = {
  kg: 'кг',
  cm: 'см',
  reps: 'повт.',
  times: 'раз'
};

const defaultUnits: Record<Goal['type'], NonNullable<Goal['unit']>> = {
  weight: 'kg',
  strength: 'kg',
  habit: 'times',
  measure: 'cm'
};

function getGoalProgress(goal: Goal) {
  if (goal.status === 'achieved') return 100;
  if (goal.startValue === undefined || goal.currentValue === undefined || goal.targetValue === undefined) return 0;
  const total = goal.targetValue - goal.startValue;
  if (total === 0) return 100;
  return Math.min(100, Math.max(0, ((goal.currentValue - goal.startValue) / total) * 100));
}

function getDeadlineText(deadline?: string) {
  if (!deadline) return 'Без срока';
  const days = differenceInCalendarDays(parseISO(deadline), new Date());
  if (days < 0) return 'Срок истёк';
  if (days === 0) return 'Срок сегодня';
  return `${days} дн. до срока`;
}

export default function GoalsDashboard() {
  const { state } = useApp();
  const isCoach = state.user?.role === 'coach';
  const [clients, setClients] = useState<User[]>(mockUsers.filter(user => user.role === 'client'));
  const [selectedClientId, setSelectedClientId] = useState(isCoach ? 'client-1' : state.user?.id ?? 'client-1');
  const [draftClientId, setDraftClientId] = useState(isCoach ? 'client-1' : state.user?.id ?? 'client-1');
  const [goals, setGoals] = useState(mockGoals);
  const [filter, setFilter] = useState<GoalFilter>('active');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [type, setType] = useState<Goal['type']>('weight');
  const [note, setNote] = useState('');
  const [startValue, setStartValue] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    Promise.all([apiGet<User[]>('/clients'), apiGet<Goal[]>('/goals')])
      .then(([nextClients, nextGoals]) => {
        setClients(nextClients);
        setGoals(nextGoals);
      })
      .catch(console.error);
  }, []);

  const selectedClientGoals = goals.filter(goal => goal.clientId === selectedClientId);
  const visibleGoals = useMemo(() => (
    filter === 'all'
      ? goals.filter(goal => goal.clientId === selectedClientId)
      : goals.filter(goal => goal.clientId === selectedClientId && goal.status === filter)
  ), [filter, goals, selectedClientId]);

  const activeGoals = selectedClientGoals.filter(goal => goal.status === 'active');
  const averageProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, goal) => sum + getGoalProgress(goal), 0) / activeGoals.length)
    : 0;

  const resetForm = (clientId = selectedClientId) => {
    setType('weight');
    setNote('');
    setStartValue('');
    setTargetValue('');
    setDeadline('');
    setDraftClientId(clientId);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  const handleCreateGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    const initial = Number(startValue);
    const target = Number(targetValue);
    if (!note.trim() || Number.isNaN(initial) || Number.isNaN(target)) return;

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      clientId: draftClientId,
      createdBy: isCoach ? 'coach' : 'client',
      type,
      note: note.trim(),
      startValue: initial,
      currentValue: initial,
      targetValue: target,
      unit: defaultUnits[type],
      deadline: deadline || undefined,
      createdAt: format(new Date(), 'yyyy-MM-dd'),
      status: 'active'
    };

    const created = await apiPost<Goal>('/goals', goal);
    setGoals(current => [created, ...current]);
    setSelectedClientId(draftClientId);
    setIsCreateOpen(false);
    resetForm(draftClientId);
    setFilter('active');
  };

  const handleCompleteGoal = async (goalId: string) => {
    await apiPatch(`/goals/${goalId}`, { status: 'achieved' });
    setGoals(current => current.map(goal => (
      goal.id === goalId ? { ...goal, status: 'achieved' } : goal
    )));
  };

  const handleDeleteGoal = async (goalId: string) => {
    await apiDelete(`/goals/${goalId}`);
    setGoals(current => current.filter(goal => goal.id !== goalId));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Направление работы
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {isCoach ? 'Цели подопечных' : 'Мои цели'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isCoach
              ? 'Создавайте цели, привязывайте их к подопечным и отслеживайте динамику.'
              : 'Фиксируйте собственные цели и следите за ориентирами, которые поставил тренер.'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreateOpen(true)}
          className="flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <Plus className="h-4 w-4" />
          {isCoach ? 'Поставить цель' : 'Добавить цель'}
        </motion.button>
      </header>

      {isCoach && (
        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Подопечный</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Выберите клиента, чтобы посмотреть его цели и прогресс.</p>
          </div>
          <select
            value={selectedClientId}
            onChange={event => {
              setSelectedClientId(event.target.value);
              setDraftClientId(event.target.value);
            }}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 md:ml-auto dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Активные цели</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{activeGoals.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Средний прогресс</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{averageProgress}%</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Достигнуто</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{selectedClientGoals.filter(goal => goal.status === 'achieved').length}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Список целей</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Личные цели и ориентиры от тренера собраны в одном месте.</p>
          </div>
          <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-900/50">
            {([
              ['active', 'Активные'],
              ['achieved', 'Достигнутые'],
              ['all', 'Все']
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  filter === key
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {visibleGoals.map((goal, index) => {
            const Icon = typeIcons[goal.type];
            const progress = Math.round(getGoalProgress(goal));
            return (
              <motion.article
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{goal.note}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          goal.createdBy === 'coach'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {goal.createdBy === 'coach' ? 'От тренера' : 'Личная цель'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        {isCoach && <span className="font-medium text-blue-600 dark:text-blue-400">{clients.find(client => client.id === goal.clientId)?.name}</span>}
                        <span>{typeLabels[goal.type]}</span>
                        <span>{getDeadlineText(goal.deadline)}</span>
                        {goal.deadline && <span>до {format(parseISO(goal.deadline), 'd MMMM yyyy', { locale: ru })}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-72">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {goal.currentValue} / {goal.targetValue} {goal.unit ? unitLabels[goal.unit] : ''}
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{progress}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={`h-full rounded-full ${goal.status === 'achieved' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {goal.status === 'active' && (
                      <button
                        onClick={() => handleCompleteGoal(goal.id)}
                        className="rounded-xl border border-emerald-200 p-2.5 text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-900/60 dark:hover:bg-emerald-900/20"
                        aria-label="Отметить цель достигнутой"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="rounded-xl border border-red-200 p-2.5 text-red-500 transition hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-900/20"
                      aria-label="Удалить цель"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {visibleGoals.length === 0 && (
            <div className="py-16 text-center">
              <Award className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
              <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">В этом разделе пока нет целей</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Добавьте новый ориентир, чтобы отслеживать прогресс.</p>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4"
            onClick={closeCreate}
          >
            <motion.form
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onSubmit={handleCreateGoal}
              onClick={event => event.stopPropagation()}
              className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{isCoach ? 'Назначение подопечному' : 'Личная цель'}</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Новая цель</h2>
                </div>
                <button type="button" onClick={closeCreate} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isCoach && (
                <label className="mt-5 block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Подопечный</span>
                  <select
                    value={draftClientId}
                    onChange={event => setDraftClientId(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                </label>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.keys(typeLabels) as Goal['type'][]).map(goalType => {
                  const Icon = typeIcons[goalType];
                  return (
                    <button
                      key={goalType}
                      type="button"
                      onClick={() => setType(goalType)}
                      className={`rounded-xl border p-3 text-left transition ${
                        type === goalType
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="mt-2 block text-xs font-semibold">{typeLabels[goalType]}</span>
                    </button>
                  );
                })}
              </div>

              <label className="mt-5 block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Чего хотите добиться</span>
                <input
                  value={note}
                  onChange={event => setNote(event.target.value)}
                  placeholder="Например, пробежать 5 км без остановки"
                  required
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-900/40"
                />
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Текущее значение</span>
                  <input
                    type="number"
                    step="any"
                    value={startValue}
                    onChange={event => setStartValue(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Целевое значение</span>
                  <input
                    type="number"
                    step="any"
                    value={targetValue}
                    onChange={event => setTargetValue(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Срок выполнения</span>
                <input
                  type="date"
                  value={deadline}
                  onChange={event => setDeadline(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>

              <button
                type="submit"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg"
              >
                <Flag className="h-4 w-4" />
                Сохранить цель
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
