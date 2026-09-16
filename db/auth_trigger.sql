-- Auto-create public.users record when a new user signs up via Supabase Auth
-- Run this in Supabase SQL Editor

-- 0. Make password_hash nullable (passwords now managed by Supabase Auth)
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- 1. Create function that inserts into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone, avatar_url, locale, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'ru'),
    NOW()
  );
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'client') = 'client' THEN
    INSERT INTO public.client_profiles (user_id, privacy)
    VALUES (NEW.id, '{"progressPhotosVisibleToCoach": true}');
  ELSIF NEW.raw_user_meta_data->>'role' = 'coach' THEN
    INSERT INTO public.coach_profiles (user_id, bio, specialties, invite_code, is_verified)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'bio', ''),
      COALESCE(
        (SELECT array_agg(value::text) FROM json_array_elements_text(NEW.raw_user_meta_data->'specialties')),
        ARRAY[]::TEXT[]
      ),
      COALESCE(NEW.raw_user_meta_data->>'invite_code', UPPER(SUBSTRING(NEW.raw_user_meta_data->>'name', 1, 4)) || EXTRACT(EPOCH FROM NOW())::TEXT),
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Also create profile for the EXISTING user who already registered
-- (Replace with the actual user ID from Authentication → Users)
-- INSERT INTO public.users (id, email, name, role, locale, created_at)
-- VALUES ('actual-uuid-from-auth', 'maria@example.com', 'Мария', 'coach', 'ru', NOW());
