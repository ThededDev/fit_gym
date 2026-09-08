# Настройка Vercel Postgres для ONE FitGym

## 🚀 Быстрая настройка (5 минут)

### 1. Создайте базу данных

1. Зайдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите проект `fit_gym`
3. Перейдите в **Storage** → **Create Database** → **Postgres**
4. Нажмите **Create** и выберите регион
5. Подтвердите создание

### 2. Настройте Environment Variables

1. В Vercel Dashboard перейдите в **Settings** → **Environment Variables**
2. Добавьте следующие переменные:

```
DATABASE_URL=postgres://default:xxxx@ep-xxx.us-east-1.aws.neon.tech/verceldb?sslmode=require
MIGRATION_SECRET=your_secret_key_here
```

**Как получить DATABASE_URL:**
- Откройте созданную базу данных в Storage
- Скопируйте строку из раздела **Connection Details** → **DATABASE_URL**

**MIGRATION_SECRET:**
- Создайте любой сложный пароль для защиты миграций
- Например: `my_secure_migration_key_2024`

3. Выберите все окружения: **Production**, **Preview**, **Development**
4. Нажмите **Save**

### 3. Запустите миграции базы данных

После добавления переменных окружения и завершения деплоя:

1. Откройте терминал и выполните:
```bash
curl -X POST https://your-app.vercel.app/api/db/migrate \
  -H "Content-Type: application/json" \
  -d '{"secret": "your_migration_secret"}'
```

Замените:
- `your-app.vercel.app` на ваш домен
- `your_migration_secret` на ваш MIGRATION_SECRET

2. Если всё настроено правильно, вы увидите:
```json
{
  "success": true,
  "message": "Database migration completed successfully"
}
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

## 🔧 Troubleshooting

### Ошибка 500 при авторизации
- Убедитесь, что DATABASE_URL добавлен в Environment Variables
- Проверьте, что миграции выполнены успешно
- Проверьте логи в Vercel Dashboard

### Ошибка подключения к базе
- Проверьте правильность DATABASE_URL
- Убедитесь, что база данных активна в Storage
- Попробуйте перезапустить деплой

### Ошибка миграций
- Проверьте, что MIGRATION_SECRET совпадает
- Убедитесь, что база данных пуста (при необходимости удалите таблицы)
- Проверьте логи в Vercel Dashboard

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

## 💡 Дополнительные возможности

Vercel Postgres включает:
- Автоматические бэкапы
- Репликация данных
- Мониторинг производительности
- Удобную консоль для SQL запросов

Доступ к консоли: Vercel Dashboard → Storage → ваша база → Query Console