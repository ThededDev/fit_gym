import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarPlus,
  Check,
  Clock,
  Dumbbell,
  Library,
  MessageSquare,
  Plus,
  Play,
  Trash2,
  UserRound,
  X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { mockExercises, mockScheduledWorkouts, mockUsers, mockWorkoutTemplates } from '../../data/mockData';
import { Comment, Exercise, PlannedExercise, ScheduledWorkout, WorkoutTemplate } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';
import { User } from '../../types';

type WorkoutFilter = 'all' | 'templates' | 'scheduled' | 'completed';

function getExercisesCount(template: WorkoutTemplate) {
  return template.blocks.reduce((total, block) => total + block.exercises.length, 0);
}

function getTemplateName(templates: WorkoutTemplate[], templateId?: string) {
  return templates.find(template => template.id === templateId)?.name ?? 'Тренировка';
}

export default function WorkoutList() {
  const { state } = useApp();
  const isCoach = state.user?.role === 'coach';
  const [clients, setClients] = useState<User[]>(mockUsers.filter(user => user.role === 'client'));
  const [filter, setFilter] = useState<WorkoutFilter>(isCoach ? 'all' : 'scheduled');
  const [templates, setTemplates] = useState(mockWorkoutTemplates);
  const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
  const [scheduledWorkouts, setScheduledWorkouts] = useState(mockScheduledWorkouts);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isExerciseOpen, setIsExerciseOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [duration, setDuration] = useState('60');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(mockWorkoutTemplates[0]?.id ?? '');
  const [selectedClientId, setSelectedClientId] = useState('client-1');
  const [assignmentDate, setAssignmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [assignmentTime, setAssignmentTime] = useState('10:00');
  const [exerciseName, setExerciseName] = useState('');
  const [muscleGroups, setMuscleGroups] = useState('');
  const [equipment, setEquipment] = useState('');
  const [activeWorkout, setActiveWorkout] = useState<ScheduledWorkout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutComment, setWorkoutComment] = useState('');

  useEffect(() => {
    Promise.all([
      apiGet<User[]>('/clients'),
      apiGet<Exercise[]>('/exercises'),
      apiGet<WorkoutTemplate[]>('/workout-templates'),
      apiGet<ScheduledWorkout[]>('/workouts'),
      apiGet<Comment[]>('/comments?entityType=workout')
    ]).then(([nextClients, nextExercises, nextTemplates, nextWorkouts, nextComments]) => {
      setClients(nextClients);
      setExercises(nextExercises);
      setTemplates(nextTemplates);
      setScheduledWorkouts(nextWorkouts);
      setComments(nextComments);
    }).catch(console.error);
  }, []);

  const visibleScheduledWorkouts = useMemo(() => {
    const roleWorkouts = isCoach
      ? scheduledWorkouts
      : scheduledWorkouts.filter(workout => workout.clientId === state.user?.id);
    return roleWorkouts
      .filter(workout => filter === 'completed'
        ? workout.status === 'done'
        : filter === 'scheduled'
          ? workout.status === 'planned'
          : true)
      .sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`));
  }, [filter, isCoach, scheduledWorkouts, state.user?.id]);

  const openAssignModal = (templateId?: string) => {
    setSelectedTemplateId(templateId ?? templates[0]?.id ?? '');
    setIsAssignOpen(true);
  };

  const resetCreateForm = () => {
    setTemplateName('');
    setDuration('60');
    setSelectedExerciseIds([]);
  };

  const handleCreateTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!templateName.trim() || selectedExerciseIds.length === 0) return;

    const exercises: PlannedExercise[] = selectedExerciseIds.map(exerciseId => ({
      exerciseId,
      sets: 3,
      reps: 10,
      restSec: 90
    }));
    const template: WorkoutTemplate = {
      id: `wt-${Date.now()}`,
      coachId: state.user?.id,
      name: templateName.trim(),
      estimatedDuration: Number(duration),
      blocks: [{ title: 'Основные упражнения', exercises }],
      tags: ['Авторская']
    };

    const created = await apiPost<WorkoutTemplate>('/workout-templates', template);
    setTemplates(current => [created, ...current]);
    setSelectedTemplateId(created.id);
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const handleAssignWorkout = async (event: React.FormEvent) => {
    event.preventDefault();
    const template = templates.find(item => item.id === selectedTemplateId);
    if (!template) return;

    const workout: ScheduledWorkout = {
      id: `sw-${Date.now()}`,
      clientId: selectedClientId,
      date: assignmentDate,
      time: assignmentTime,
      templateId: template.id,
      planned: template.blocks,
      status: 'planned'
    };

    const created = await apiPost<ScheduledWorkout>('/workouts', workout);
    setScheduledWorkouts(current => [...current, created]);
    setIsAssignOpen(false);
    setFilter('scheduled');
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExerciseIds(current => current.includes(exerciseId)
      ? current.filter(id => id !== exerciseId)
      : [...current, exerciseId]);
  };

  const getExerciseName = (exerciseId: string) => {
    return exercises.find(exercise => exercise.id === exerciseId)?.name ?? 'Упражнение';
  };

  const handleCreateExercise = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!exerciseName.trim()) return;
    const exercise = await apiPost<Exercise>('/exercises', {
      name: exerciseName.trim(),
      muscleGroups: muscleGroups.split(',').map(item => item.trim()).filter(Boolean),
      equipment: equipment.split(',').map(item => item.trim()).filter(Boolean)
    });
    setExercises(current => [exercise, ...current]);
    setExerciseName('');
    setMuscleGroups('');
    setEquipment('');
    setIsExerciseOpen(false);
  };

  const workoutExercises = activeWorkout?.planned.flatMap(block => block.exercises) ?? [];
  const currentExercise = workoutExercises[currentExerciseIndex];

  const openWorkoutRunner = (workout: ScheduledWorkout) => {
    setActiveWorkout(workout);
    setCurrentExerciseIndex(0);
    setWorkoutComment('');
  };

  const finishWorkout = async () => {
    if (!activeWorkout || !state.user) return;
    const updated = await apiPatch<ScheduledWorkout>(`/workouts/${activeWorkout.id}`, { status: 'done' });
    setScheduledWorkouts(current => current.map(workout => workout.id === updated.id ? updated : workout));

    if (workoutComment.trim()) {
      const comment = await apiPost<Comment>('/comments', {
        authorId: state.user.id,
        clientId: activeWorkout.clientId,
        entityType: 'workout',
        entityId: activeWorkout.id,
        text: workoutComment.trim(),
        visibility: 'coach_and_client',
        createdAt: new Date().toISOString()
      });
      setComments(current => [comment, ...current]);
    }

    setActiveWorkout(null);
    setFilter('completed');
  };

  const getWorkoutComment = (workoutId: string) => {
    return comments.find(comment => comment.entityType === 'workout' && comment.entityId === workoutId);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Тренировочный процесс
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Тренировки</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isCoach
              ? 'Создавайте программы и назначайте тренировки подопечным.'
              : 'Просматривайте назначенные тренером программы и расписание.'}
          </p>
        </div>
        {isCoach && (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsExerciseOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Dumbbell className="h-4 w-4" />
              Создать упражнение
            </button>
            <button
              onClick={() => openAssignModal()}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-900/60 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
            >
              <CalendarPlus className="h-4 w-4" />
              Назначить тренировку
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Создать программу
            </motion.button>
          </div>
        )}
      </header>

      <nav className="flex overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {(isCoach ? ([
          ['all', 'Все тренировки'],
          ['templates', 'Шаблоны'],
          ['scheduled', 'Запланированные'],
          ['completed', 'Выполненные']
        ] as const) : ([
          ['scheduled', 'Предстоящие'],
          ['completed', 'Выполненные']
        ] as const)).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === key
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {isCoach && (filter === 'all' || filter === 'templates') && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Шаблоны программ</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Готовые наборы упражнений для быстрого назначения клиенту.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template, index) => (
              <motion.article
                key={template.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                    <div className="mt-3 flex gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{template.estimatedDuration} мин</span>
                      <span className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4" />{getExercisesCount(template)} упр.</span>
                    </div>
                  </div>
                  {isCoach && (
                    <button
                      onClick={async () => {
                        await apiDelete(`/workout-templates/${template.id}`);
                        setTemplates(current => current.filter(item => item.id !== template.id));
                      }}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      aria-label="Удалить шаблон"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm dark:border-gray-700">
                  {template.blocks.flatMap(block => block.exercises).map((exercise, exerciseIndex) => (
                    <p key={`${exercise.exerciseId}-${exerciseIndex}`} className="text-gray-700 dark:text-gray-300">
                      {getExerciseName(exercise.exerciseId)}
                      <span className="ml-2 text-gray-400">{exercise.sets} x {Array.isArray(exercise.reps) ? exercise.reps.join('/') : exercise.reps}</span>
                    </p>
                  ))}
                </div>
                {isCoach && (
                  <button
                    onClick={() => openAssignModal(template.id)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Назначить клиенту
                  </button>
                )}
              </motion.article>
            ))}
          </div>
        </section>
      )}

      {isCoach && (filter === 'all' || filter === 'templates') && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Библиотека упражнений</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Упражнения доступны при сборке новой программы.</p>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{exercises.length} упражнений</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {exercises.map(exercise => (
                <article key={exercise.id} className="flex items-center gap-4 p-4">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                    <Library className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{exercise.name}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{exercise.muscleGroups.join(', ') || 'Группа мышц не указана'}</p>
                  </div>
                  <p className="hidden text-sm text-gray-400 md:block">{exercise.equipment?.join(', ') || 'Без оборудования'}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {(filter === 'all' || filter === 'scheduled' || filter === 'completed') && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {filter === 'completed' ? 'Выполненные тренировки' : 'Расписание тренировок'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isCoach ? 'Назначения для подопечных с датой и временем.' : 'Ваш персональный план занятий.'}
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {visibleScheduledWorkouts.map((workout, index) => {
                const client = clients.find(item => item.id === workout.clientId);
                const comment = getWorkoutComment(workout.id);
                return (
                  <motion.article
                    key={workout.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex flex-col gap-4 p-5 md:flex-row md:items-center"
                  >
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <Dumbbell className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{getTemplateName(templates, workout.templateId)}</h3>
                      <p className="mt-1 text-sm capitalize text-gray-500 dark:text-gray-400">
                        {format(parseISO(workout.date), 'EEEE, d MMMM', { locale: ru })}, {workout.time ?? 'без времени'}
                      </p>
                      {isCoach && <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">{client?.name}</p>}
                      {isCoach && comment && (
                        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                          <p className="flex items-center gap-1.5 font-semibold">
                            <MessageSquare className="h-4 w-4" />
                            Комментарий пользователя
                          </p>
                          <p className="mt-1">{comment.text}</p>
                        </div>
                      )}
                      {!isCoach && workout.status === 'done' && comment && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Ваш комментарий: {comment.text}</p>
                      )}
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      workout.status === 'done'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : workout.status === 'planned'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {workout.status === 'done' ? 'Выполнено' : workout.status === 'planned' ? 'Запланировано' : 'Пропущено'}
                    </span>
                    {!isCoach && workout.status === 'planned' && (
                      <button
                        onClick={() => openWorkoutRunner(workout)}
                        className="flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        <Play className="h-4 w-4" />
                        Начать
                      </button>
                    )}
                    {isCoach && (
                      <button
                        onClick={async () => {
                          await apiDelete(`/workouts/${workout.id}`);
                          setScheduledWorkouts(current => current.filter(item => item.id !== workout.id));
                        }}
                        className="w-fit rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        aria-label="Удалить назначение"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </motion.article>
                );
              })}
              {visibleScheduledWorkouts.length === 0 && (
                <div className="py-14 text-center">
                  <CalendarPlus className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">В этом разделе пока нет тренировок.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <AnimatePresence>
        {activeWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4"
            onClick={() => setActiveWorkout(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onClick={event => event.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {currentExerciseIndex + 1} из {workoutExercises.length}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {getTemplateName(templates, activeWorkout.templateId)}
                  </h2>
                </div>
                <button type="button" onClick={() => setActiveWorkout(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {currentExercise ? (
                <div className="mt-6 rounded-2xl border border-gray-200 p-5 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                      <Dumbbell className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getExerciseName(currentExercise.exerciseId)}</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {currentExercise.sets} подхода · {Array.isArray(currentExercise.reps) ? currentExercise.reps.join('/') : currentExercise.reps ?? '-'} повторений
                        {currentExercise.weightKg ? ` · ${Array.isArray(currentExercise.weightKg) ? currentExercise.weightKg.join('/') : currentExercise.weightKg} кг` : ''}
                      </p>
                      {currentExercise.restSec && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Отдых: {currentExercise.restSec} сек.</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-900/20">
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">Тренировка завершена</h3>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Оставьте комментарий для тренера перед сохранением результата.</p>
                </div>
              )}

              <label className="mt-5 block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Комментарий тренеру</span>
                <textarea
                  value={workoutComment}
                  onChange={event => setWorkoutComment(event.target.value)}
                  rows={4}
                  placeholder="Например: тяжело дался последний подход, болит плечо, хочу уменьшить вес"
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {currentExerciseIndex < workoutExercises.length - 1 ? (
                  <button
                    onClick={() => setCurrentExerciseIndex(index => index + 1)}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Следующее упражнение
                  </button>
                ) : (
                  <button
                    onClick={finishWorkout}
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg"
                  >
                    Завершить тренировку
                  </button>
                )}
                {currentExerciseIndex > 0 && (
                  <button
                    onClick={() => setCurrentExerciseIndex(index => index - 1)}
                    className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Назад
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {isCoach && isExerciseOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4"
            onClick={() => setIsExerciseOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onSubmit={handleCreateExercise}
              onClick={event => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Библиотека тренера</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Создать упражнение</h2>
                </div>
                <button type="button" onClick={() => setIsExerciseOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Название</span>
                  <input value={exerciseName} onChange={event => setExerciseName(event.target.value)} required className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Группы мышц</span>
                  <input value={muscleGroups} onChange={event => setMuscleGroups(event.target.value)} placeholder="Например, Спина, Бицепс" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Оборудование</span>
                  <input value={equipment} onChange={event => setEquipment(event.target.value)} placeholder="Например, Штанга, Скамья" className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </label>
              </div>
              <button type="submit" className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg">
                Сохранить упражнение
              </button>
            </motion.form>
          </motion.div>
        )}

        {isCoach && isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4"
            onClick={() => setIsCreateOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onSubmit={handleCreateTemplate}
              onClick={event => event.stopPropagation()}
              className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Новый шаблон</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Создать программу</h2>
                </div>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_140px]">
                <label>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Название программы</span>
                  <input
                    value={templateName}
                    onChange={event => setTemplateName(event.target.value)}
                    required
                    placeholder="Например, Верх тела"
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
                <label>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Длительность</span>
                  <input
                    type="number"
                    min="10"
                    value={duration}
                    onChange={event => setDuration(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </label>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Выберите упражнения</p>
                <div className="mt-2 space-y-2">
                  {exercises.map(exercise => {
                    const selected = selectedExerciseIds.includes(exercise.id);
                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => toggleExercise(exercise.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                          selected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded border ${
                          selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">{exercise.name}</span>
                          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{exercise.muscleGroups.join(', ')}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg"
              >
                Сохранить программу
              </button>
            </motion.form>
          </motion.div>
        )}

        {isCoach && isAssignOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/45 p-4"
            onClick={() => setIsAssignOpen(false)}
          >
            <motion.form
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              onSubmit={handleAssignWorkout}
              onClick={event => event.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Расписание клиента</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Назначить тренировку</h2>
                </div>
                <button type="button" onClick={() => setIsAssignOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Программа</span>
                  <select
                    value={selectedTemplateId}
                    onChange={event => setSelectedTemplateId(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Подопечный</span>
                  <select
                    value={selectedClientId}
                    onChange={event => setSelectedClientId(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Дата</span>
                    <input
                      type="date"
                      value={assignmentDate}
                      onChange={event => setAssignmentDate(event.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                  <label>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Время</span>
                    <input
                      type="time"
                      value={assignmentTime}
                      onChange={event => setAssignmentTime(event.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg"
              >
                <UserRound className="h-4 w-4" />
                Добавить в расписание
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
