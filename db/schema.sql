-- ONE FitGym Database Schema
-- PostgreSQL Schema for Fitness App

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('client', 'coach')),
    phone VARCHAR(50),
    avatar_url TEXT,
    locale VARCHAR(10) DEFAULT 'ru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client profiles
CREATE TABLE IF NOT EXISTS client_profiles (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    sex VARCHAR(10) CHECK (sex IN ('male', 'female')),
    birth_date DATE,
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    activity_level VARCHAR(20) CHECK (activity_level IN ('low', 'medium', 'high')),
    goal_type VARCHAR(20) CHECK (goal_type IN ('lose', 'maintain', 'gain')),
    coach_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    privacy JSONB DEFAULT '{"progressPhotosVisibleToCoach": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coach profiles
CREATE TABLE IF NOT EXISTS coach_profiles (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    specialties TEXT[],
    invite_code VARCHAR(50) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercises
CREATE TABLE IF NOT EXISTS exercises (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    muscle_groups TEXT[],
    equipment TEXT[],
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout templates
CREATE TABLE IF NOT EXISTS workout_templates (
    id VARCHAR(255) PRIMARY KEY,
    coach_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    estimated_duration INTEGER, -- in minutes
    blocks JSONB NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled workouts
CREATE TABLE IF NOT EXISTS scheduled_workouts (
    id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time VARCHAR(10),
    template_id VARCHAR(255) REFERENCES workout_templates(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'missed', 'cancelled')),
    planned JSONB,
    actual JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
    id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    created_by VARCHAR(50) CHECK (created_by IN ('client', 'coach')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('weight', 'strength', 'habit', 'custom')),
    target_value DECIMAL(10,2),
    start_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    unit VARCHAR(20),
    deadline DATE,
    note TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Progress metrics
CREATE TABLE IF NOT EXISTS progress_metrics (
    id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight_kg DECIMAL(5,2),
    measurements JSONB,
    photos TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Food items
CREATE TABLE IF NOT EXISTS food_items (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories DECIMAL(10,2),
    protein DECIMAL(10,2),
    fat DECIMAL(10,2),
    carbs DECIMAL(10,2),
    serving_size VARCHAR(50)
);

-- Meal entries
CREATE TABLE IF NOT EXISTS meal_entries (
    id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    items JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(255) PRIMARY KEY,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    text TEXT NOT NULL,
    visibility VARCHAR(50) DEFAULT 'coach_and_client' CHECK (visibility IN ('coach_only', 'client_only', 'coach_and_client')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition plans
CREATE TABLE IF NOT EXISTS nutrition_plans (
    id VARCHAR(255) PRIMARY KEY,
    client_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    coach_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255),
    daily_calories INTEGER,
    daily_protein DECIMAL(10,2),
    daily_fat DECIMAL(10,2),
    daily_carbs DECIMAL(10,2),
    tolerance_percent INTEGER DEFAULT 10,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_client_profiles_coach_id ON client_profiles(coach_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_client_id ON scheduled_workouts(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_date ON scheduled_workouts(date);
CREATE INDEX IF NOT EXISTS idx_goals_client_id ON goals(client_id);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_client_id ON progress_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_meal_entries_client_id ON meal_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_comments_client_id ON comments(client_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_profiles_updated_at BEFORE UPDATE ON coach_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON workout_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_workouts_updated_at BEFORE UPDATE ON scheduled_workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_plans_updated_at BEFORE UPDATE ON nutrition_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();