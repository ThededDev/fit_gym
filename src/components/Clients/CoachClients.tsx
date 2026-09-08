import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { mockScheduledWorkouts, mockUsers, mockWorkoutTemplates } from '../../data/mockData';
import { MacroTargets, NutritionPlan, ScheduledWorkout, User } from '../../types';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';

type ClientFilter = 'all' | 'active' | 'attention';

interface ClientMeta {
  status: 'active' | 'attention';
  goal: string;
  weight: string;
  progress: number;
  lastActivity: string;
}

const clientMeta: Record<string, ClientMeta> = {
  'client-1': {
    status: 'active',
    goal: 'Снизить вес до 78 кг',
    weight: '82.5 кг',
    progress: 68,
    lastActivity: 'Тренировка выполнена вчера'
  },
  'client-2': {
    status: 'attention',
    goal: 'Вернуться к регулярным тренировкам',
    weight: '64.2 кг',
    progress: 42,
    lastActivity: 'Последняя тренировка 5 дней назад'
  },
  'client-3': {
    status: 'active',
    goal: 'Увеличить силовые показатели',
    weight: '91.7 кг',
    progress: 84,
    lastActivity: 'Тренировка выполнена сегодня'
  }
};

const statusStyles: Record<ClientMeta['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  attention: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
};

const statusLabels: Record<ClientMeta['status'], string> = {
  active: 'Активный план',
  attention: 'Требует внимания'
};

function getTemplateName(templateId?: string) {
  return mockWorkoutTemplates.find(template => template.id === templateId)?.name ?? 'Тренировка';
}

function formatWorkoutDate(date: string) {
  if (!date) return '—';
  return format(parseISO(date), 'd MMMM, EEEEEE', { locale: ru });
}

export default function CoachClients() {
  const today = startOfDay(new Date());
  const [clients, setClients] = useState<User[]>(mockUsers.filter(user => user.role === 'client'));
  const [selectedClientId, setSelectedClientId] = useState('client-1');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);
  const [isNutritionOpen, setIsNutritionOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });
  const [workouts, setWorkouts] = useState<ScheduledWorkout[]>(mockScheduledWorkouts);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [workoutTemplateId, setWorkoutTemplateId] = useState(mockWorkoutTemplates[0]?.id ?? '');
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workoutTime, setWorkoutTime] = useState('10:00');
  const [nutritionTargets, setNutritionTargets] = useState<MacroTargets>({ calories: 2200, protein: 160, fat: 70, carbs: 240 });

  useEffect(() => {
    Promise.all([
      apiGet<User[]>('/clients'),
      apiGet<ScheduledWorkout[]>('/workouts'),
      apiGet<NutritionPlan[]>('/nutrition-plans')
    ]).then(([nextClients, nextWorkouts, nextPlans]) => {
      setClients(nextClients);
      setWorkouts(nextWorkouts);
      setNutritionPlans(nextPlans);
    }).catch(console.error);
  }, []);

  const visibleClients = useMemo(() => clients.filter(client => {
    const meta = clientMeta[client.id];
    const matchesSearch = `${client.name} ${client.email} ${client.phone ?? ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || meta?.status === filter;
    return matchesSearch && matchesFilter;
  }), [clients, filter, search]);

  const selectedClient = clients.find(client => client.id === selectedClientId) ?? clients[0];
  const selectedMeta = selectedClient ? clientMeta[selectedClient.id] : undefined;
  const selectedNutritionPlan = selectedClient ? nutritionPlans.find(plan => plan.clientId === selectedClient.id) : undefined;
  const selectedWorkouts = selectedClient
    ? workouts
        .filter(workout => workout.clientId === selectedClient.id && workout.date && !isBefore(parseISO(workout.date), today))
        .sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`))
    : [];

  useEffect(() => {
    if (!selectedClient) return;
    setHeightCm(String(selectedClient.heightCm ?? 180));
    setWeightKg(String(selectedClient.weightKg ?? selectedMeta?.weight?.replace(' кг', '') ?? 80));
  }, [selectedClient, selectedMeta]);

  const handleAddClient = async (event: React.FormEvent) => {
    event.preventDefault();
    const client: User = {
      id: `client-${Date.now()}`,
      role: 'client',
      name: newClient.name.trim(),
      email: newClient.email.trim(),
      phone: newClient.phone.trim(),
      createdAt: new Date().toISOString(),
      locale: 'ru'
    };

    const created = await apiPost<User>('/clients', client);
    setClients(current => [created, ...current]);
    setSelectedClientId(created.id);
    setNewClient({ name: '', email: '', phone: '' });
    setIsAddOpen(false);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    await apiDelete(`/clients/${selectedClient.id}`);
    const nextClients = clients.filter(client => client.id !== selectedClient.id);
    setClients(nextClients);
    setSelectedClientId(nextClients[0]?.id ?? '');
  };

  const handleSaveParams = async () => {
    if (!selectedClient) return;
    const updated = await apiPatch<User>(`/clients/${selectedClient.id}`, {
      heightCm: Number(heightCm),
      weightKg: Number(weightKg)
    });
    setClients(current => current.map(client => client.id === updated.id ? updated : client));
  };

  const handleAssignWorkout = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClient) return;
    const template = mockWorkoutTemplates.find(item => item.id === workoutTemplateId);
    if (!template) return;
    const workout = await apiPost<ScheduledWorkout>('/workouts', {
      clientId: selectedClient.id,
      date: workoutDate,
      time: workoutTime,
      templateId: template.id,
      planned: template.blocks,
      status: 'planned'
    });
    setWorkouts(current => [...current, workout]);
    setIsWorkoutOpen(false);
  };

  const handleSaveNutrition = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedClient) return;
    const payload: NutritionPlan = {
      id: selectedNutritionPlan?.id ?? `nutrition-${Date.now()}`,
      clientId: selectedClient.id,
      coachId: 'coach-1',
      dailyTargets: nutritionTargets,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      meals: selectedNutritionPlan?.meals ?? []
    };
    const saved = selectedNutritionPlan
      ? await apiPatch<NutritionPlan>(`/nutrition-plans/${selectedNutritionPlan.id}`, payload)
      : await apiPost<NutritionPlan>('/nutrition-plans', payload);
    setNutritionPlans(current => [...current.filter(plan => plan.clientId !== selectedClient.id), saved]);
    setIsNutritionOpen(false);
  };

  const openNutritionEditor = () => {
    setNutritionTargets(selectedNutritionPlan?.dailyTargets ?? { calories: 2200, protein: 160, fat: 70, carbs: 240 });
    setIsNutritionOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Работа с клиентами
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Подопечные</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Контакты, текущие цели и ближайшие тренировки ваших клиентов.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddOpen(true)}
          className="flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <UserPlus className="h-4 w-4" />
          Добавить подопечного
        </motion.button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Всего подопечных</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Активные планы</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {clients.filter(client => clientMeta[client.id]?.status === 'active').length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Требуют внимания</p>
          <p className="mt-2 text-3xl font-bold text-orange-600 dark:text-orange-400">
            {clients.filter(client => clientMeta[client.id]?.status === 'attention').length}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Поиск по имени, телефону или email"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-gray-700 dark:bg-gray-900/40 dark:text-white"
              />
            </div>
            <div className="mt-3 flex gap-2">
              {([
                ['all', 'Все'],
                ['active', 'Активные'],
                ['attention', 'Требуют внимания']
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    filter === key
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {visibleClients.map((client, index) => {
              const meta = clientMeta[client.id];
              const isSelected = selectedClient?.id === client.id;
              return (
                <motion.button
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`flex w-full items-center gap-4 p-5 text-left transition ${
                    isSelected ? 'bg-blue-50/80 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <img src={client.avatarUrl} alt={client.name} className="h-12 w-12 rounded-full bg-gray-100 object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">{client.name}</p>
                      {meta && (
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[meta.status]}`}>
                          {statusLabels[meta.status]}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{meta?.goal ?? 'Новый подопечный'}</p>
                    <p className="mt-1 text-xs text-gray-400">{meta?.lastActivity ?? 'План ещё не сформирован'}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{meta?.progress ?? 0}%</p>
                    <p className="mt-1 text-xs text-gray-400">прогресс</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </motion.button>
              );
            })}

            {visibleClients.length === 0 && (
              <div className="py-16 text-center">
                <Users className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">Подопечные не найдены</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Измените поисковый запрос или добавьте нового клиента.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          {selectedClient ? (
            <>
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start gap-4">
                  <img src={selectedClient.avatarUrl} alt={selectedClient.name} className="h-16 w-16 rounded-full bg-gray-100 object-cover" />
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.name}</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Подопечный с {selectedClient.createdAt ? format(parseISO(selectedClient.createdAt), 'd MMMM yyyy', { locale: ru }) : '—'}</p>
                    {selectedMeta && (
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[selectedMeta.status]}`}>
                        {statusLabels[selectedMeta.status]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm">
                  <a href={`tel:${selectedClient.phone}`} className="flex items-center gap-2 rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Phone className="h-4 w-4" />
                    {selectedClient.phone || 'Телефон не указан'}
                  </a>
                  <a href={`mailto:${selectedClient.email}`} className="flex items-center gap-2 rounded-lg p-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    <Mail className="h-4 w-4" />
                    {selectedClient.email}
                  </a>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a href={`mailto:${selectedClient.email}`} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                    <MessageSquare className="h-4 w-4" />
                    Написать
                  </a>
                  <button
                    onClick={handleDeleteClient}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Параметры клиента</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Рост</span>
                    <input value={heightCm} onChange={event => setHeightCm(event.target.value)} type="number" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                  </label>
                  <label>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Вес</span>
                    <input value={weightKg} onChange={event => setWeightKg(event.target.value)} type="number" step="0.1" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                  </label>
                </div>
                <button onClick={handleSaveParams} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Сохранить параметры</button>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Программа питания</h2>
                  <button onClick={openNutritionEditor} className="text-sm font-semibold text-blue-600 dark:text-blue-400">Изменить</button>
                </div>
                {selectedNutritionPlan ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <p>Ккал: <b>{selectedNutritionPlan.dailyTargets.calories}</b></p>
                    <p>Белки: <b>{selectedNutritionPlan.dailyTargets.protein} г</b></p>
                    <p>Жиры: <b>{selectedNutritionPlan.dailyTargets.fat} г</b></p>
                    <p>Углеводы: <b>{selectedNutritionPlan.dailyTargets.carbs} г</b></p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Программа питания не назначена.</p>
                )}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Текущий ориентир</h2>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{selectedMeta?.goal ?? 'Цель ещё не определена'}</p>
                <div className="mt-4 flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Прогресс</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedMeta?.progress ?? 0}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${selectedMeta?.progress ?? 0}%` }} />
                </div>
                {selectedMeta && <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Текущий вес: {selectedMeta.weight}</p>}
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Календарь тренировок</h2>
                  <button onClick={() => setIsWorkoutOpen(true)} className="text-sm font-semibold text-blue-600 dark:text-blue-400">+ Создать</button>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  {selectedWorkouts.map(workout => (
                    <div key={workout.id} className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 border-b border-gray-100 px-3 py-3 last:border-b-0 dark:border-gray-700">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {workout.time ?? '--:--'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{getTemplateName(workout.templateId)}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatWorkoutDate(workout.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {selectedWorkouts.length === 0 && (
                    <p className="p-3 text-sm text-gray-500 dark:text-gray-400">Нет предстоящих тренировок.</p>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-gray-200 bg-white py-16 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <CheckCircle2 className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Добавьте первого подопечного.</p>
            </section>
          )}
        </aside>
      </div>

      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4"
            onClick={() => setIsAddOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onSubmit={handleAddClient}
              onClick={event => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Новый клиент</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Добавить подопечного</h2>
                </div>
                <button type="button" onClick={() => setIsAddOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Имя и фамилия</span>
                  <input
                    value={newClient.name}
                    onChange={event => setNewClient(current => ({ ...current, name: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={event => setNewClient(current => ({ ...current, email: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Телефон</span>
                  <input
                    value={newClient.phone}
                    onChange={event => setNewClient(current => ({ ...current, phone: event.target.value }))}
                    required
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Добавить в список
              </button>
            </motion.form>
          </motion.div>
        )}

        {isWorkoutOpen && selectedClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4" onClick={() => setIsWorkoutOpen(false)}>
            <motion.form initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} onSubmit={handleAssignWorkout} onClick={event => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div><p className="text-sm font-medium text-blue-600">{selectedClient.name}</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Создать тренировку</h2></div>
                <button type="button" onClick={() => setIsWorkoutOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <div className="mt-5 space-y-4">
                <select value={workoutTemplateId} onChange={event => setWorkoutTemplateId(event.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">{mockWorkoutTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={workoutDate} onChange={event => setWorkoutDate(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                  <input type="time" value={workoutTime} onChange={event => setWorkoutTime(event.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <button type="submit" className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white">Назначить тренировку</button>
            </motion.form>
          </motion.div>
        )}

        {isNutritionOpen && selectedClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4" onClick={() => setIsNutritionOpen(false)}>
            <motion.form initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} onSubmit={handleSaveNutrition} onClick={event => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div><p className="text-sm font-medium text-blue-600">{selectedClient.name}</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Программа питания</h2></div>
                <button type="button" onClick={() => setIsNutritionOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {(['calories', 'protein', 'fat', 'carbs'] as const).map(key => (
                  <label key={key}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{key === 'calories' ? 'Ккал' : key === 'protein' ? 'Белки' : key === 'fat' ? 'Жиры' : 'Углеводы'}</span>
                    <input type="number" value={nutritionTargets[key]} onChange={event => setNutritionTargets(current => ({ ...current, [key]: Number(event.target.value) }))} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                  </label>
                ))}
              </div>
              <button type="submit" className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white">Сохранить питание</button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
