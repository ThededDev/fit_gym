# Настройка Supabase SDK для ONE FitGym

## 🚀 Быстрая настройка (5 минут)

### 1. Получите ключи Supabase

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект **fitgym** (ID: kptoweyhevaasfdbwbbs.supabase.co)
3. Перейдите в **Settings** → **API**
4. Скопируйте следующие данные:
   - **Project URL**: `https://kptoweyhevaasfdbwbbs.supabase.co`
   - **anon public** ключ
   - **service_role** ключ (только для server-side)

### 2. Добавьте переменные в Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите проект **fit_gym**
3. **Settings** → **Environment Variables**
4. Добавьте следующие переменные:

```
SUPABASE_URL=https://kptoweyhevaasfdbwbbs.supabase.co
SUPABASE_ANON_KEY=ваш_anon_ключ
SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_ключ
```

5. Выберите все окружения: **Production**, **Preview**, **Development**
6. Для **SUPABASE_URL** и **SUPABASE_ANON_KEY** установите **visibility: public**
7. Для **SUPABASE_SERVICE_ROLE_KEY** установите **visibility: secret**
8. Нажмите **Save**

### 3. Создайте таблицы в Supabase

1. В Supabase Dashboard → **SQL Editor**
2. Создайте новый запрос
3. Скопируйте и выполните SQL из файла `db/schema.sql`
4. Это создаст все необходимые таблицы

### 4. Заполните демо данными

После создания таблиц выполните демо данные:

**Вариант A: Через SQL Editor**
- Скопируйте SQL из `db/seed.sql` (но без заглушек паролей)
- Выполните в SQL Editor

**Вариант B: Через API**
- Зарегистрируйте пользователей через приложение
- Они будут созданы в Supabase автоматически

### 5. Протестируйте авторизацию

Используйте демо данные:
- **Клиенты:** ivan@example.com / demo
- **Тренеры:** maria@example.com / demo

## 🔧 Преимущества Supabase SDK

- ✅ **Безопасность** - не нужен DATABASE_URL
- ✅ **Built-in Auth** - можно использовать Supabase Auth
- ✅ **Real-time** - поддержка real-time подписок
- ✅ **Storage** - для файлов и изображений
- ✅ **Edge Functions** - альтернатива Vercel Functions
- ✅ **Автоматические миграции** - через Supabase Migrations

## 📊 Структура базы данных

Таблицы создаются через SQL Editor:
- `users` - Пользователи
- `client_profiles` - Профили клиентов
- `coach_profiles` - Профили тренеров
- `exercises` - Упражнения
- `workout_templates` - Шаблоны тренировок
- `scheduled_workouts` - Запланированные тренировки
- `goals` - Цели
- `progress_metrics` - Прогресс
- `food_items` - Продукты
- `meal_entries` - Приемы пищи
- `comments` - Комментарии
- `nutrition_plans` - Питательные планы

## 🔧 Troubleshooting

### Ошибка подключения
- Проверьте что Project URL правильный
- Убедитесь что ключи (anon/service_role) верные
- Проверьте что проект Supabase активен

### Таблицы не найдены
- Выполните schema.sql в SQL Editor
- Проверьте что таблицы созданы в Table Editor

### Авторизация не работает
- Убедитесь что пользователи существуют в таблице users
- Проверьте что пароли хешируются правильно
- Используйте fallback данные если Supabase недоступен

## 💡 Следующие улучшения

- Использовать Supabase Auth вместо собственной системы
- Добавить Real-time подписки для обновлений
- Использовать Supabase Storage для аватаров и фото
- Перенести некоторые функции в Supabase Edge Functions