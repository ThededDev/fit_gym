import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Plus,
  Trash2,
  UserRound,
  X
} from 'lucide-react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { mockExercises, mockScheduledWorkouts, mockUsers, mockWorkoutTemplates } from '../../data/mockData';
import { ScheduledWorkout, WorkoutTemplate } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';
import { User } from '../../types';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const scheduleHours = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

const statusStyles: Record<ScheduledWorkout['status'], string> = {
  planned: 'bg-blue-500',
  done: 'bg-emerald-500',
  skipped: 'bg-gray-400'
};

const statusLabels: Record<ScheduledWorkout['status'], string> = {
  planned: 'Запланировано',
  done: 'Выполнено',
  skipped: 'Пропущено'
};

const statusBadgeStyles: Record<ScheduledWorkout['status'], string> = {
  planned: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  skipped: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
};

function getTemplate(workout?: ScheduledWorkout) {
  return mockWorkoutTemplates.find(template => template.id === workout?.templateId);
}

function getExerciseName(exerciseId: string) {
  return mockExercises.find(exercise => exercise.id === exerciseId)?.name ?? 'Упражнение';
}

function getExercisesCount(template?: WorkoutTemplate) {
  return template?.blocks.reduce((total, block) => total + block.exercises.length, 0) ?? 0;
}

export default function WorkoutCalendar() {
  const { state } = useApp();
  const isCoach = state.user?.role === 'coach';
  const today = startOfDay(new Date());
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [scheduledWorkouts, setScheduledWorkouts] = useState(mockScheduledWorkouts);
  const [clients, setClients] = useState<User[]>(mockUsers.filter(user => user.role === 'client'));
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(mockWorkoutTemplates[0]?.id ?? '');
  const [selectedClientId, setSelectedClientId] = useState('client-1');
  const [clientFilter, setClientFilter] = useState('all');
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [selectedDates, setSelectedDates] = useState<string[]>([format(today, 'yyyy-MM-dd')]);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 })
    });
  }, [visibleMonth]);

  useEffect(() => {
    Promise.all([apiGet<User[]>('/clients'), apiGet<ScheduledWorkout[]>('/workouts')])
      .then(([nextClients, nextWorkouts]) => {
        setClients(nextClients);
        setScheduledWorkouts(nextWorkouts);
      })
      .catch(console.error);
  }, []);
  const visibleWorkouts = isCoach
    ? scheduledWorkouts.filter(workout => clientFilter === 'all' || workout.clientId === clientFilter)
    : scheduledWorkouts.filter(workout => workout.clientId === state.user?.id);
  const selectedDayWorkouts = visibleWorkouts
    .filter(workout => isSameDay(parseISO(workout.date), selectedDate))
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const selectedWorkout = isCoach
    ? selectedDayWorkouts.find(workout => workout.id === editingWorkoutId)
    : selectedDayWorkouts[0];
  const selectedTemplate = getTemplate(selectedWorkout);
  const coach = mockUsers.find(user => user.role === 'coach');

  const upcomingWorkouts = visibleWorkouts
    .filter(workout => !isBefore(parseISO(workout.date), today) && workout.status === 'planned')
    .sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`))
    .slice(0, 4);

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    if (!isSameMonth(day, visibleMonth)) {
      setVisibleMonth(startOfMonth(day));
    }
  };

  const handleGoToday = () => {
    setSelectedDate(today);
    setVisibleMonth(startOfMonth(today));
  };

  const handleAssignWorkout = async () => {
    const template = mockWorkoutTemplates.find(item => item.id === selectedTemplateId);
    if (!template) return;

    const date = format(selectedDate, 'yyyy-MM-dd');
    const datesToAssign = editingWorkoutId ? [date] : selectedDates.length ? selectedDates : [date];
    const baseWorkout: Omit<ScheduledWorkout, 'id' | 'date'> = {
      clientId: selectedClientId,
      time: selectedTime,
      templateId: template.id,
      planned: template.blocks,
      status: 'planned'
    };

    if (selectedWorkout) {
      const saved = await apiPatch<ScheduledWorkout>(`/workouts/${selectedWorkout.id}`, { ...baseWorkout, id: selectedWorkout.id, date });
      setScheduledWorkouts(current => [...current.filter(workout => workout.id !== selectedWorkout.id), saved]);
    } else {
      const created = await Promise.all(datesToAssign.map((assignDate, index) => (
        apiPost<ScheduledWorkout>('/workouts', {
          ...baseWorkout,
          id: `sw-${Date.now()}-${index}`,
          date: assignDate
        })
      )));
      setScheduledWorkouts(current => [...current, ...created]);
    }
    setIsAssignOpen(false);
    setEditingWorkoutId(null);
  };

  const handleRemoveWorkout = async () => {
    if (!selectedWorkout) return;
    await apiDelete(`/workouts/${selectedWorkout.id}`);
    setScheduledWorkouts(current => current.filter(workout => workout.id !== selectedWorkout.id));
  };

  const handleCompleteWorkout = async () => {
    if (!selectedWorkout) return;
    await apiPatch(`/workouts/${selectedWorkout.id}`, { status: 'done' });
    setScheduledWorkouts(current => current.map(workout => (
      workout.id === selectedWorkout.id ? { ...workout, status: 'done' } : workout
    )));
  };

  const openAssignModal = (workout?: ScheduledWorkout, time?: string, day = selectedDate) => {
    const fallbackClientId = clientFilter !== 'all' ? clientFilter : clients[0]?.id ?? 'client-1';
    setSelectedDate(day);
    setEditingWorkoutId(workout?.id ?? null);
    setSelectedClientId(workout?.clientId ?? fallbackClientId);
    setSelectedTemplateId(workout?.templateId ?? mockWorkoutTemplates[0]?.id ?? '');
    setSelectedTime(workout?.time ?? time ?? '10:00');
    setSelectedDates([format(day, 'yyyy-MM-dd')]);
    setIsAssignOpen(true);
  };

  const toggleAssignDate = (date: string) => {
    setSelectedDates(current => current.includes(date)
      ? current.filter(item => item !== date)
      : [...current, date].sort());
  };

  const getClientShortName = (client?: User) => {
    if (!client) return '-';
    const [lastName, firstName] = client.name.split(' ');
    return `${lastName} ${firstName?.[0] ?? ''}.`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            План тренировок
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {isCoach ? 'Расписание тренировок' : 'Мой календарь'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isCoach
              ? 'Просматривайте записи подопечных, время тренировок и контакты для связи.'
              : `План составляет ваш тренер ${coach?.name ?? ''}. Выберите дату, чтобы посмотреть детали.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <img
              src={(isCoach ? state.user : coach)?.avatarUrl}
              alt={(isCoach ? state.user : coach)?.name}
              className="h-9 w-9 rounded-full object-cover"
            />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isCoach ? 'Активные подопечные' : 'Ваш тренер'}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{isCoach ? `${clients.length} человека` : coach?.name}</p>
            </div>
          </div>
          {isCoach && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openAssignModal()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Назначить тренировку
            </motion.button>
          )}
        </div>
      </header>

      {isCoach && (
        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Фильтр по подопечному</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Показывает записи выбранного клиента в календаре и расписании.</p>
          </div>
          <select
            value={clientFilter}
            onChange={event => setClientFilter(event.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 md:ml-auto dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Все подопечные</option>
            {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVisibleMonth(month => subMonths(month, 1))}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="min-w-44 text-center text-lg font-semibold capitalize text-gray-900 dark:text-white">
                {format(visibleMonth, 'LLLL yyyy', { locale: ru })}
              </h2>
              <button
                onClick={() => setVisibleMonth(month => addMonths(month, 1))}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label="Следующий месяц"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={handleGoToday}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Сегодня
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40">
            {weekdays.map(day => (
              <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map(day => {
              const dayWorkouts = visibleWorkouts.filter(item => isSameDay(parseISO(item.date), day));
              const workout = dayWorkouts[0];
              const template = getTemplate(workout);
              const selected = isSameDay(day, selectedDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleSelectDay(day)}
                  className={`min-h-24 border-b border-r border-gray-100 p-2 text-left transition hover:bg-blue-50/70 dark:border-gray-700/70 dark:hover:bg-blue-900/10 ${
                    selected ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 dark:bg-blue-900/20' : ''
                  } ${!isSameMonth(day, visibleMonth) ? 'bg-gray-50/60 dark:bg-gray-900/20' : ''}`}
                >
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                    isToday(day)
                      ? 'bg-blue-600 text-white'
                      : isSameMonth(day, visibleMonth)
                        ? 'text-gray-800 dark:text-gray-200'
                        : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {workout && (
                    <div className="mt-2 hidden sm:block">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusStyles[workout.status]}`} />
                        <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                          {isCoach ? `${dayWorkouts.length} ${dayWorkouts.length === 1 ? 'запись' : 'записи'}` : template?.name}
                        </p>
                      </div>
                      <p className="mt-1 truncate pl-3.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {isCoach ? dayWorkouts.map(item => item.time).join(', ') : `${template?.estimatedDuration} мин`}
                      </p>
                    </div>
                  )}
                  {workout && <span className={`mt-2 block h-1.5 w-1.5 rounded-full sm:hidden ${statusStyles[workout.status]}`} />}
                </button>
              );
            })}
          </div>
        </motion.section>

        <div className="space-y-6">
          <motion.aside
            key={format(selectedDate, 'yyyy-MM-dd')}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <p className="text-sm font-medium capitalize text-gray-500 dark:text-gray-400">
              {format(selectedDate, 'EEEE, d MMMM', { locale: ru })}
            </p>
            {isCoach ? (
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Записаны на тренировку</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {selectedDayWorkouts.length ? `${selectedDayWorkouts.length} записи на выбранный день` : 'На выбранный день записей нет'}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {selectedDayWorkouts.length}
                  </span>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  {scheduleHours.map(hour => {
                    const workout = selectedDayWorkouts.find(item => item.time === hour);
                    const workoutClient = workout ? clients.find(item => item.id === workout.clientId) : undefined;
                    const template = getTemplate(workout);
                    return (
                      <div key={hour} className="border-b border-gray-100 last:border-b-0 dark:border-gray-700">
                        <button
                          onClick={() => workout ? openAssignModal(workout) : openAssignModal(undefined, hour)}
                          className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <span className="w-14 shrink-0 font-semibold text-gray-900 dark:text-white">{hour}</span>
                          <span className={`flex-1 ${workout ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                            {workout ? getClientShortName(workoutClient) : '-'}
                          </span>
                          {workout && <span className="hidden truncate text-xs text-gray-500 sm:block">{template?.name}</span>}
                        </button>
                        {workout && (
                          <div className="space-y-1 px-3 pb-3 pl-20 text-xs text-gray-500 dark:text-gray-400">
                            <p>{workoutClient?.phone} · {workoutClient?.email}</p>
                            <div className="flex gap-2">
                              <button onClick={() => openAssignModal(workout)} className="font-semibold text-blue-600 dark:text-blue-400">Изменить</button>
                              <button
                                onClick={async () => {
                                  await apiDelete(`/workouts/${workout.id}`);
                                  setScheduledWorkouts(current => current.filter(item => item.id !== workout.id));
                                }}
                                className="font-semibold text-red-500"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => openAssignModal()}
                  className="mt-4 w-full rounded-xl border border-dashed border-blue-300 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  + Добавить запись
                </button>
              </div>
            ) : selectedWorkout && selectedTemplate ? (
              <div className="mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeStyles[selectedWorkout.status]}`}>
                      {statusLabels[selectedWorkout.status]}
                    </span>
                    <h2 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{selectedTemplate.name}</h2>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{selectedTemplate.estimatedDuration} мин</span>
                  <span className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4" />{getExercisesCount(selectedTemplate)} упр.</span>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Упражнения</p>
                  <div className="mt-3 space-y-3">
                    {selectedTemplate.blocks.flatMap(block => block.exercises).map((exercise, index) => (
                      <div key={`${exercise.exerciseId}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-800 dark:text-gray-200">{getExerciseName(exercise.exerciseId)}</span>
                        <span className="whitespace-nowrap text-gray-500 dark:text-gray-400">{exercise.sets} x {Array.isArray(exercise.reps) ? exercise.reps.join('/') : exercise.reps}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  {isCoach ? (
                    <>
                      <button
                        onClick={() => openAssignModal(selectedWorkout)}
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={handleRemoveWorkout}
                        className="rounded-xl border border-red-200 p-2.5 text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                        aria-label="Удалить тренировку"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    selectedWorkout.status === 'planned' && (
                      <button
                        onClick={handleCompleteWorkout}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <Check className="h-4 w-4" />
                        Отметить выполненной
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center">
                <CalendarDays className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
                <h2 className="mt-3 font-semibold text-gray-900 dark:text-white">Тренировка не назначена</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isCoach ? 'Выберите дату и добавьте тренировку.' : 'На этот день можно запланировать отдых.'}
                </p>
                {isCoach && (
                  <button
                  onClick={() => openAssignModal()}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    + Назначить тренировку
                  </button>
                )}
              </div>
            )}
          </motion.aside>

          <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Ближайшие тренировки</h2>
            <div className="mt-4 space-y-3">
              {upcomingWorkouts.map(workout => {
                const template = getTemplate(workout);
                const date = parseISO(workout.date);
                const workoutClient = clients.find(item => item.id === workout.clientId);
                return (
                  <button
                    key={workout.id}
                    onClick={() => handleSelectDay(date)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700/60"
                  >
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <span className="text-[10px] font-semibold uppercase">{format(date, 'LLL', { locale: ru })}</span>
                      <span className="text-base font-bold leading-none">{format(date, 'd')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {isCoach ? workoutClient?.name : template?.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {isCoach ? `${workout.time ?? 'Без времени'} · ${template?.name}` : `${workout.time ?? 'Без времени'} · ${template?.estimatedDuration} мин`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {isAssignOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4"
            onClick={() => setIsAssignOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onClick={event => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{format(selectedDate, 'd MMMM yyyy', { locale: ru })}</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Назначить тренировку</h2>
                </div>
                <button onClick={() => setIsAssignOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {isCoach && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Подопечный</span>
                    <select
                      value={selectedClientId}
                      onChange={event => setSelectedClientId(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      {clients.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Время начала</span>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={event => setSelectedTime(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
              )}

              {!editingWorkoutId && (
                <div className="mt-5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Дни назначения</span>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => {
                      const day = addDays(selectedDate, index);
                      const value = format(day, 'yyyy-MM-dd');
                      const checked = selectedDates.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleAssignDate(value)}
                          className={`rounded-xl border px-3 py-2 text-sm transition ${
                            checked
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {format(day, 'dd.MM EEEEEE', { locale: ru })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-3">
                {mockWorkoutTemplates.map(template => (
                  <label
                    key={template.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                      selectedTemplateId === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplateId === template.id}
                      onChange={event => setSelectedTemplateId(event.target.value)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{template.name}</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{template.estimatedDuration} мин · {getExercisesCount(template)} упражнения</p>
                    </div>
                    <UserRound className="h-4 w-4 text-gray-400" />
                  </label>
                ))}
              </div>

              <button
                onClick={handleAssignWorkout}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg"
              >
                {selectedWorkout ? 'Сохранить изменения' : 'Добавить в план'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
