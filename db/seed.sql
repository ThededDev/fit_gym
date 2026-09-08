-- ONE FitGym Demo Data
-- PostgreSQL Seed Data

-- Helper function for password hashing (simplified for demo)
-- In production, use proper bcrypt/scrypt in application layer

-- Demo Users
INSERT INTO users (id, email, password_hash, name, role, phone, avatar_url, locale, created_at) VALUES
('client-1', 'ivan@example.com', '$2b$10$demo_hash_for_ivan', 'Иван Петров', 'client', '+7 916 420-18-34', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150', 'ru', '2024-01-15T00:00:00Z'),
('client-2', 'anna@example.com', '$2b$10$demo_hash_for_anna', 'Анна Козлова', 'client', '+7 903 118-42-07', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150', 'ru', '2024-02-10T00:00:00Z'),
('client-3', 'dmitry@example.com', '$2b$10$demo_hash_for_dmitry', 'Дмитрий Волков', 'client', '+7 925 603-74-19', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150', 'ru', '2024-03-05T00:00:00Z'),
('client-4', 'elena@example.com', '$2b$10$demo_hash_for_elena', 'Елена Соколова', 'client', '+7 926 555-66-77', 'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=150', 'ru', '2024-04-20T00:00:00Z'),
('coach-1', 'maria@example.com', '$2b$10$demo_hash_for_maria', 'Мария Смирнова', 'coach', '+7 985 712-50-16', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150', 'ru', '2023-06-01T00:00:00Z'),
('coach-2', 'alex@example.com', '$2b$10$demo_hash_for_alex', 'Алексей Николаев', 'coach', '+7 977 888-99-00', 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150', 'ru', '2023-08-15T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Client Profiles
INSERT INTO client_profiles (user_id, sex, birth_date, height_cm, weight_kg, activity_level, goal_type, coach_id, privacy) VALUES
('client-1', 'male', '1990-05-15', 180, 82.5, 'medium', 'lose', 'coach-1', '{"progressPhotosVisibleToCoach": true}'),
('client-2', 'female', '1985-08-22', 165, 58.0, 'high', 'gain', 'coach-1', '{"progressPhotosVisibleToCoach": true}'),
('client-3', 'male', '1992-11-30', 175, 78.0, 'medium', 'maintain', NULL, '{"progressPhotosVisibleToCoach": false}'),
('client-4', 'female', '1988-03-10', 170, 62.0, 'low', 'lose', NULL, '{"progressPhotosVisibleToCoach": true}')
ON CONFLICT (user_id) DO NOTHING;

-- Coach Profiles
INSERT INTO coach_profiles (user_id, bio, specialties, invite_code, is_verified) VALUES
('coach-1', 'Сертифицированный тренер с 8-летним опытом. Специализируюсь на силовых тренировках и коррекции питания.', ARRAY['Силовые тренировки', 'Похудение', 'Набор мышечной массы'], 'MARIA2024', true),
('coach-2', 'Фитнес-инструктор с опытом работы в кроссфите и функциональном тренинге. Помогу достичь ваших целей!', ARRAY['Кроссфит', 'Функциональный тренинг', 'Кардио'], 'ALEX2024', true)
ON CONFLICT (user_id) DO NOTHING;

-- Exercises
INSERT INTO exercises (id, name, muscle_groups, equipment, instructions) VALUES
('ex-1', 'Приседания со штангой', ARRAY['Квадрицепс', 'Ягодицы', 'Задняя поверхность бедра'], ARRAY['Штанга', 'Стойка'], 'Поставьте штангу на верхнюю часть трапеций, ноги на ширине плеч. Опуститесь в присед, сохраняя спину прямой, затем вернитесь в исходное положение.'),
('ex-2', 'Жим лёжа', ARRAY['Грудные', 'Трицепс', 'Передние дельты'], ARRAY['Штанга', 'Скамья'], 'Лягте на скамью, возьмите штангу хватом шире плеч. Опустите штангу к груди, затем выжмите её вверх.'),
('ex-3', 'Становая тяга', ARRAY['Спина', 'Ягодицы', 'Задняя поверхность бедра'], ARRAY['Штанга'], 'Встаньте над штангой, возьмите её хватом на ширине плеч. Поднимите штангу, выпрямляясь полностью, затем опустите.'),
('ex-4', 'Подтягивания', ARRAY['Широчайшие', 'Бицепс', 'Задние дельты'], ARRAY['Турник'], 'Повисните на турнике, подтягивайтесь до касания подбородком перекладины.'),
('ex-5', 'Отжимания', ARRAY['Грудные', 'Трицепс', 'Передние дельты'], ARRAY[], 'Примите упор лёжа, руки на ширине плеч. Опуститесь к полу, затем вернитесь в исходное положение.'),
('ex-6', 'Бёрпи', ARRAY['Все группы мышц'], ARRAY[], 'Из положения стоя опуститесь в присед, руки на пол. Перейдите в планку, сделайте отжимание, вернитесь в присед и выпрыгните вверх.'),
('ex-7', 'Планка', ARRAY['Кор', 'Плечи'], ARRAY[], 'Примите положение планки на локтях или прямых руках. Держите тело в прямой линии как можно дольше.'),
('ex-8', 'Выпады', ARRAY['Квадрицепс', 'Ягодицы'], ARRAY[], 'Сделайте шаг вперёд, опуститесь в выпад, затем вернитесь в исходное положение. Повторите на другую ногу.')
ON CONFLICT (id) DO NOTHING;

-- Workout Templates
INSERT INTO workout_templates (id, coach_id, name, estimated_duration, blocks, tags) VALUES
('wt-1', 'coach-1', 'Грудь и Трицепс', 60, 
'[{"title":"Разминка","exercises":[{"exerciseId":"ex-5","sets":2,"reps":[15,15],"weightKg":0,"restSec":60}]},{"title":"Основные упражнения","exercises":[{"exerciseId":"ex-2","sets":4,"reps":[8,6,6,8],"weightKg":80,"restSec":180}]}]', 
ARRAY['Верх', 'Силовая']),
('wt-2', 'coach-1', 'Ноги и Ягодицы', 75, 
'[{"title":"Разминка","exercises":[{"exerciseId":"ex-8","sets":2,"reps":[10,10],"weightKg":0,"restSec":60}]},{"title":"Основные упражнения","exercises":[{"exerciseId":"ex-1","sets":4,"reps":[10,10,10,10],"weightKg":100,"restSec":240},{"exerciseId":"ex-3","sets":3,"reps":[8,8,8],"weightKg":120,"restSec":300}]}]', 
ARRAY['Низ', 'Силовая']),
('wt-3', 'coach-2', 'Функциональный тренинг', 45, 
'[{"title":"Разминка","exercises":[{"exerciseId":"ex-6","sets":1,"reps":[10],"weightKg":0,"restSec":30}]},{"title":"Основная часть","exercises":[{"exerciseId":"ex-6","sets":3,"reps":[10,10,10],"weightKg":0,"restSec":60},{"exerciseId":"ex-7","sets":3,"reps":[30,30,30],"weightKg":0,"restSec":60}]}]', 
ARRAY['Функциональный', 'Кардио'])
ON CONFLICT (id) DO NOTHING;

-- Scheduled Workouts (next 2 weeks)
INSERT INTO scheduled_workouts (id, client_id, date, time, template_id, status, planned) VALUES
('sw-1', 'client-1', CURRENT_DATE + INTERVAL '1 day', '10:00', 'wt-1', 'planned', 
'[{"title":"Разминка","exercises":[{"exerciseId":"ex-5","sets":2,"reps":[15,15],"weightKg":0,"restSec":60}]},{"title":"Основные упражнения","exercises":[{"exerciseId":"ex-2","sets":4,"reps":[8,6,6,8],"weightKg":80,"restSec":180}]}]'),
('sw-2', 'client-1', CURRENT_DATE + INTERVAL '3 days', '18:30', 'wt-2', 'planned',
'[{"title":"Разминка","exercises":[{"exerciseId":"ex-8","sets":2,"reps":[10,10],"weightKg":0,"restSec":60}]},{"title":"Основные упражнения","exercises":[{"exerciseId":"ex-1","sets":4,"reps":[10,10,10,10],"weightKg":100,"restSec":240},{"exerciseId":"ex-3","sets":3,"reps":[8,8,8],"weightKg":120,"restSec":300}]}]'),
('sw-3', 'client-2', CURRENT_DATE + INTERVAL '2 days', '14:00', 'wt-1', 'planned',
'[{"title":"Разминка","exercises":[{"exerciseId":"ex-5","sets":2,"reps":[15,15],"weightKg":0,"restSec":60}]},{"title":"Основные упражнения","exercises":[{"exerciseId":"ex-2","sets":4,"reps":[8,6,6,8],"weightKg":60,"restSec":180}]}]'),
('sw-4', 'client-3', CURRENT_DATE + INTERVAL '1 day', '16:00', 'wt-3', 'planned',
'[{"title":"Разминка","exercises":[{"exerciseId":"ex-6","sets":1,"reps":[10],"weightKg":0,"restSec":30}]},{"title":"Основная часть","exercises":[{"exerciseId":"ex-6","sets":3,"reps":[10,10,10],"weightKg":0,"restSec":60},{"exerciseId":"ex-7","sets":3,"reps":[30,30,30],"weightKg":0,"restSec":60}]}]')
ON CONFLICT (id) DO NOTHING;

-- Goals
INSERT INTO goals (id, client_id, created_by, type, target_value, start_value, current_value, unit, deadline, note, status) VALUES
('goal-1', 'client-1', 'coach', 'weight', 78, 85.2, 82.5, 'kg', CURRENT_DATE + INTERVAL '2 months', 'Снизить вес до 78 кг', 'active'),
('goal-2', 'client-1', 'client', 'strength', 100, 70, 80, 'kg', CURRENT_DATE + INTERVAL '3 months', 'Жим лёжа 100 кг на 1 раз', 'active'),
('goal-3', 'client-1', 'coach', 'habit', 12, 0, 8, 'times', CURRENT_DATE + INTERVAL '1 month', 'Выполнить 12 тренировок за месяц', 'active'),
('goal-4', 'client-2', 'coach', 'weight', 60, 55, 58, 'kg', CURRENT_DATE + INTERVAL '2 months', 'Набрать мышечную массу', 'active'),
('goal-5', 'client-3', 'client', 'habit', 20, 0, 15, 'times', CURRENT_DATE + INTERVAL '2 months', 'Пробежать 20 км за месяц', 'active')
ON CONFLICT (id) DO NOTHING;

-- Progress Metrics
INSERT INTO progress_metrics (id, client_id, date, weight_kg, measurements, notes) VALUES
('pm-1', 'client-1', CURRENT_DATE - INTERVAL '2 weeks', 85.2, '{"waist": 88, "chest": 98, "hips": 102}', 'Начальные измерения'),
('pm-2', 'client-1', CURRENT_DATE - INTERVAL '1 week', 84.1, '{"waist": 87, "chest": 98, "hips": 101}', 'Хороший прогресс'),
('pm-3', 'client-1', CURRENT_DATE, 82.5, '{"waist": 86, "chest": 98, "hips": 100}', 'Продолжаем работать'),
('pm-4', 'client-2', CURRENT_DATE - INTERVAL '1 week', 57.5, '{"waist": 70, "chest": 90, "hips": 95}', 'Стабильный вес'),
('pm-5', 'client-2', CURRENT_DATE, 58.0, '{"waist": 70, "chest": 91, "hips": 96}', 'Небольшой набор')
ON CONFLICT (id) DO NOTHING;

-- Food Items
INSERT INTO food_items (id, name, calories, protein, fat, carbs, serving_size) VALUES
('food-1', 'Куриная грудка', 165, 31, 3.6, 0, '100г'),
('food-2', 'Рис басмати', 130, 2.7, 0.3, 28, '100г вареного'),
('food-3', 'Овсянка', 68, 2.4, 1.4, 12, '100г вареной'),
('food-4', 'Яйца куриные', 155, 13, 11, 1.1, '100г'),
('food-5', 'Гречка', 110, 4.2, 1.0, 23, '100г вареной'),
('food-6', 'Творог 5%', 121, 17, 5, 1.8, '100г'),
('food-7', 'Банан', 89, 1.1, 0.3, 23, '100г'),
('food-8', 'Миндаль', 579, 21, 50, 22, '100г')
ON CONFLICT (id) DO NOTHING;

-- Meal Entries
INSERT INTO meal_entries (id, client_id, date, type, items, notes) VALUES
('meal-1', 'client-1', CURRENT_DATE, 'breakfast', 
'[{"foodItemId": "food-3", "grams": 50}, {"foodItemId": "food-4", "grams": 60}]', 'Завтрак'),
('meal-2', 'client-1', CURRENT_DATE, 'lunch', 
'[{"foodItemId": "food-1", "grams": 150}, {"foodItemId": "food-2", "grams": 100}]', 'Обед'),
('meal-3', 'client-1', CURRENT_DATE, 'dinner', 
'[{"foodItemId": "food-1", "grams": 100}, {"foodItemId": "food-5", "grams": 80}]', 'Ужин'),
('meal-4', 'client-2', CURRENT_DATE, 'breakfast', 
'[{"foodItemId": "food-3", "grams": 60}, {"foodItemId": "food-6", "grams": 100}]', 'Завтрак'),
('meal-5', 'client-2', CURRENT_DATE, 'lunch', 
'[{"foodItemId": "food-1", "grams": 120}, {"foodItemId": "food-2", "grams": 80}]', 'Обед')
ON CONFLICT (id) DO NOTHING;

-- Comments
INSERT INTO comments (id, author_id, client_id, entity_type, entity_id, text, visibility) VALUES
('comment-1', 'coach-1', 'client-1', 'general', NULL, 'Отличная работа на этой неделе! Продолжайте в том же духе.', 'coach_and_client'),
('comment-2', 'coach-1', 'client-1', 'workout', 'sw-1', 'В следующий раз попробуйте увеличить вес на 2.5 кг', 'coach_and_client'),
('comment-3', 'client-1', 'client-1', 'general', NULL, 'Чувствую себя намного энергичнее!', 'coach_and_client'),
('comment-4', 'coach-1', 'client-2', 'goal', 'goal-4', 'Хороший прогресс с набором массы. Увеличим калории на 200 ккал.', 'coach_and_client')
ON CONFLICT (id) DO NOTHING;

-- Nutrition Plans
INSERT INTO nutrition_plans (id, client_id, coach_id, name, daily_calories, daily_protein, daily_fat, daily_carbs, tolerance_percent, start_date, end_date, status) VALUES
('nutrition-1', 'client-1', 'coach-1', 'План для похудения', 2200, 160, 70, 240, 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'active'),
('nutrition-2', 'client-2', 'coach-1', 'План для набора массы', 2800, 180, 90, 300, 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', 'active')
ON CONFLICT (id) DO NOTHING;