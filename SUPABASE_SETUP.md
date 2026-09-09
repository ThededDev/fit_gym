# Настройка Supabase для ONE FitGym

## 🚀 Быстрая настройка (5 минут)

### 1. Получите данные подключения из Supabase

1. Зайдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект **fitgym** (ID: kptoweyhevaasfdbwbbs)
3. Перейдите в **Settings** → **Database**
4. Найдите раздел **Connection string**
5. Скопируйте **URI** в формате:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.kptoweyhevaasfdbwbbs.supabase.co:5432/postgres
   ```

### 2. Добавьте DATABASE_URL в Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите проект **fit_gym**
3. Перейдите в **Settings** → **Environment Variables**
4. Добавьте переменную:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.kptoweyhevaasfdbwbbs.supabase.co:5432/postgres
   ```
5. Выберите все окружения: **Production**, **Preview**, **Development**
6. Нажмите **Save**

### 3. Запустите миграции базы данных

После добавления переменных окружения и завершения деплоя:

1. Сначала создайте файл `.env` локально для тестирования:
   ```bash
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.kptoweyhevaasfdbwbbs.supabase.co:5432/postgres
   ```

2. Запустите миграции локально:
   ```bash
   node db/migrate.js
   ```

Или запустите миграции через API endpoint:
```bash
curl -X POST https://onefitgym.vercel.app/api/db/migrate \
  -H "Content-Type: application/json" \
  -d '{"secret": "your_migration_secret"}'
```

### 4. Протестируйте авторизацию

После успешной миграции используйте демо данные:

**Клиенты:**
- ivan@example.com / demo
- anna@example.com / demo
- dmitry@example.com / demo
- elena@example.com / demo

**Тренеры:**
- maria@example.com / demo (инвайт код: MARIA2024)
- alex@example.com / demo (инвайт код: ALEX2024)

## 🔧 Настройка Supabase

### Включите необходимые расширения

1. В Supabase Dashboard → **Database** → **Extensions**
2. Включите следующие расширения:
   - `uuid-ossp` (для генерации UUID)
   - `pgcrypto` (для криптографических функций)

### Настройте Pool Mode

1. В Supabase Dashboard → **Database** → **Connection Pooling**
2. Установите **Transaction Mode** или **Session Mode**
3. Это улучшит производительность для Vercel serverless функций

## 📊 Структура базы данных

После миграций будут созданы таблицы:
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

### Ошибка 500 при авторизации
- Убедитесь, что DATABASE_URL добавлен в Environment Variables
- Проверьте, что пароль в строке подключения правильный
- Убедитесь, что миграции выполнены успешно

### Ошибка подключения к базе
- Проверьте правильность DATABASE_URL
- Убедитесь, что проект Supabase активен
- Проверьте настройки подключения в Supabase Dashboard

### Ошибка SSL
- SSL должен быть включен (rejectUnauthorized: false)
- Это уже настроено в api/_db.js

### Ошибка миграций
- Убедитесь, что база данных пуста
- Проверьте логи в Supabase Dashboard
- Попробуйте выполнить SQL вручную через SQL Editor

## 💡 Преимущества Supabase

- **Бесплатный план** до 500MB базы данных
- **Автоматические бэкапы**
- **Real-time подписки** (можно использовать в будущем)
- **Auth сервис** (можно заменить текущую авторизацию)
- **Storage** для файлов (фото прогресса, аватары)
- **Edge Functions** (альтернатива Vercel Functions)

## 🎯 Ваш проект Supabase

- **Project Name:** fitgym
- **Project ID:** kptoweyhevaasfdbwbbs
- **Region:** eu-central-2
- **Database URL:** `postgresql://postgres:[password]@db.kptoweyhevaasfdbwbbs.supabase.co:5432/postgres`