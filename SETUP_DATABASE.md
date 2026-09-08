# Настройка базы данных PostgreSQL для ONE FitGym

## Варианты развертывания PostgreSQL

### Вариант 1: Vercel Postgres (Рекомендуется для продакшена)

1. **Создайте проект Vercel Postgres:**
   - Зайдите в [Vercel Dashboard](https://vercel.com/dashboard)
   - Перейдите в Storage → Create Database → Postgres
   - Выберите ваш проект

2. **Получите строку подключения:**
   - В настройках базы данных скопируйте `DATABASE_URL`
   - Добавьте её в Environment Variables вашего проекта в Vercel

3. **Запустите миграции:**
   ```bash
   npm run db:migrate
   ```

### Вариант 2: Supabase (Бесплатный вариант)

1. **Создайте проект Supabase:**
   - Зайдите на [supabase.com](https://supabase.com)
   - Создайте новый проект
   - Получите строку подключения из Settings → Database

2. **Настройте переменные окружения:**
   ```bash
   DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
   ```

3. **Запустите миграции:**
   ```bash
   npm run db:migrate
   ```

### Вариант 3: Локальный PostgreSQL

1. **Установите PostgreSQL:**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql
   sudo systemctl start postgresql
   ```

2. **Создайте базу данных:**
   ```bash
   createdb fit_gym
   ```

3. **Настройте переменные окружения:**
   ```bash
   DATABASE_URL=postgresql://postgres@localhost:5432/fit_gym
   ```

4. **Запустите миграции:**
   ```bash
   npm run db:migrate
   ```

## Структура базы данных

### Основные таблицы:
- **users** - Пользователи (клиенты и тренеры)
- **client_profiles** - Профили клиентов с настройками привязки к тренерам
- **coach_profiles** - Профили тренеров с инвайт кодами
- **exercises** - База упражнений
- **workout_templates** - Шаблоны тренировок от тренеров
- **scheduled_workouts** - Запланированные тренировки
- **goals** - Цели клиентов
- **progress_metrics** - Прогресс клиентов
- **food_items** - База продуктов питания
- **meal_entries** - Записи о приемах пищи
- **comments** - Комментарии и заметки
- **nutrition_plans** - Питательные планы

## Демо данные

После миграций будут созданы следующие демо пользователи:

### Клиенты:
- **ivan@example.com** / demo (Иван Петров) - работает с тренером Maria
- **anna@example.com** / demo (Анна Козлова) - работает с тренером Maria  
- **dmitry@example.com** / demo (Дмитрий Волков) - без тренера
- **elena@example.com** / demo (Елена Соколова) - без тренера

### Тренеры:
- **maria@example.com** / demo (Мария Смирнова) - инвайт код: MARIA2024
- **alex@example.com** / demo (Алексей Николаев) - инвайт код: ALEX2024

## API endpoints для работы с тренерами

### Привязка клиента к тренеру:
```http
POST /api/clients/{clientId}/assign-coach
Content-Type: application/json

{
  "coachId": "coach-1"  // или "inviteCode": "MARIA2024"
}
```

### Удаление привязки к тренеру:
```http
DELETE /api/clients/{clientId}/assign-coach
```

### Получение списка клиентов тренера:
```http
GET /api/clients?coachId=coach-1
```

## Самостоятельное использование

Клиенты могут:
1. Регистрироваться без тренера
2. Создавать свои тренировки
3. Отслеживать прогресс
4. Вести дневник питания
5. Ставить собственные цели

Привязка к тренеру:
- Клиент может привязаться к тренеру через инвайт код
- Тренер может привязать к себе клиента, если у того нет тренера
- Клиент может удалить привязку к тренеру в любой момент

## Безопасность

- Пароли хешируются с использованием scrypt
- В продакшене используйте SSL соединения
- Инвайт коды уникальны для каждого тренера
- Проверка прав доступа на уровне API

## Переменные окружения

Добавьте в `.env` файл или в Vercel Environment Variables:

```env
DATABASE_URL=your_postgresql_connection_string
```

## Troubleshooting

### Ошибка подключения к базе данных:
- Проверьте правильность `DATABASE_URL`
- Убедитесь, что база данных доступна
- Проверьте настройки SSL для облачных баз данных

### Ошибка миграций:
- Убедитесь, что у вас есть права на создание таблиц
- Проверьте, что база данных пуста или используйте `DROP TABLE` при необходимости

### API ошибки:
- Проверьте, что миграции выполнены успешно
- Убедитесь, что переменные окружения настроены правильно
- Проверьте логи сервера для деталей ошибок