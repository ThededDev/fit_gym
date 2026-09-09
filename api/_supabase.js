import { createClient } from '@supabase/supabase-js';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let useFallback = !supabaseUrl || !supabaseKey;

if (!useFallback) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error('Failed to init Supabase client:', e);
    useFallback = true;
  }
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  try {
    const [salt, savedHash] = passwordHash.split(':');
    if (!salt || !savedHash) return false;
    const hash = scryptSync(password, salt, 64);
    return timingSafeEqual(hash, Buffer.from(savedHash, 'hex'));
  } catch {
    return false;
  }
}

export function publicUser(user) {
  const { password_hash, passwordHash, password, ...safeUser } = user;
  return safeUser;
}

// Fallback data
let fallbackUsers = null;
function getFallbackUsers() {
  if (fallbackUsers) return fallbackUsers;
  fallbackUsers = [
    { id: 'client-1', email: 'ivan@example.com', password_hash: hashPassword('demo'), name: 'Иван Петров', role: 'client', phone: '+7 916 420-18-34', avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150', created_at: '2024-01-15T00:00:00Z', locale: 'ru' },
    { id: 'client-2', email: 'anna@example.com', password_hash: hashPassword('demo'), name: 'Анна Козлова', role: 'client', phone: '+7 903 118-42-07', avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150', created_at: '2024-02-10T00:00:00Z', locale: 'ru' },
    { id: 'client-3', email: 'dmitry@example.com', password_hash: hashPassword('demo'), name: 'Дмитрий Волков', role: 'client', phone: '+7 925 603-74-19', avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150', created_at: '2024-03-05T00:00:00Z', locale: 'ru' },
    { id: 'client-4', email: 'elena@example.com', password_hash: hashPassword('demo'), name: 'Елена Соколова', role: 'client', phone: '+7 926 555-66-77', avatar_url: 'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=150', created_at: '2024-04-20T00:00:00Z', locale: 'ru' },
    { id: 'coach-1', email: 'maria@example.com', password_hash: hashPassword('demo'), name: 'Мария Смирнова', role: 'coach', phone: '+7 985 712-50-16', avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150', created_at: '2023-06-01T00:00:00Z', locale: 'ru' },
    { id: 'coach-2', email: 'alex@example.com', password_hash: hashPassword('demo'), name: 'Алексей Николаев', role: 'coach', phone: '+7 977 888-99-00', avatar_url: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150', created_at: '2023-08-15T00:00:00Z', locale: 'ru' }
  ];
  return fallbackUsers;
}

// Table name mapping
const tableMap = {
  clients: 'users',
  exercises: 'exercises',
  'workout-templates': 'workout_templates',
  workouts: 'scheduled_workouts',
  goals: 'goals',
  'nutrition-plans': 'nutrition_plans',
  foods: 'food_items',
  meals: 'meal_entries',
  comments: 'comments',
};

export { tableMap, useFallback };

// --- Query functions using Supabase SDK ---

export async function findUserByEmail(email) {
  if (useFallback) {
    const user = getFallbackUsers().find(u => u.email === email);
    return user || null;
  }
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
  if (error) { console.error('findUserByEmail error:', error); return null; }
  return data;
}

export async function findUserById(id) {
  if (useFallback) {
    const user = getFallbackUsers().find(u => u.id === id);
    return user || null;
  }
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) { console.error('findUserById error:', error); return null; }
  return data;
}

export async function insertUser(user) {
  if (useFallback) {
    getFallbackUsers().push(user);
    return user;
  }
  const { data, error } = await supabase.from('users').insert(user).select().single();
  if (error) { console.error('insertUser error:', error); throw new Error(error.message); }
  return data;
}

export async function updateUser(id, updates) {
  if (useFallback) {
    const idx = getFallbackUsers().findIndex(u => u.id === id);
    if (idx === -1) return null;
    getFallbackUsers()[idx] = { ...getFallbackUsers()[idx], ...updates };
    return getFallbackUsers()[idx];
  }
  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
  if (error) { console.error('updateUser error:', error); return null; }
  return data;
}

export async function deleteUser(id) {
  if (useFallback) {
    const idx = getFallbackUsers().findIndex(u => u.id === id);
    if (idx === -1) return false;
    getFallbackUsers().splice(idx, 1);
    return true;
  }
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function findClientProfile(userId) {
  if (useFallback) return null;
  const { data, error } = await supabase.from('client_profiles').select('*').eq('user_id', userId).single();
  if (error) return null;
  return data;
}

export async function insertClientProfile(profile) {
  if (useFallback) return profile;
  const { data, error } = await supabase.from('client_profiles').insert(profile).select().single();
  if (error) { console.error('insertClientProfile error:', error); throw new Error(error.message); }
  return data;
}

export async function updateClientProfile(userId, updates) {
  if (useFallback) return null;
  const { data, error } = await supabase.from('client_profiles').update(updates).eq('user_id', userId).select().single();
  if (error) { console.error('updateClientProfile error:', error); return null; }
  return data;
}

export async function findCoachByInviteCode(code) {
  if (useFallback) return null;
  const { data, error } = await supabase.from('coach_profiles').select('user_id').eq('invite_code', code).single();
  if (error) return null;
  return data;
}

export async function insertCoachProfile(profile) {
  if (useFallback) return profile;
  const { data, error } = await supabase.from('coach_profiles').insert(profile).select().single();
  if (error) { console.error('insertCoachProfile error:', error); throw new Error(error.message); }
  return data;
}

// Generic table operations
export async function selectAll(tableName, filters = {}) {
  if (useFallback) return [];
  let query = supabase.from(tableName).select('*');
  for (const [key, value] of Object.entries(filters)) {
    if (value) query = query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) { console.error('selectAll error:', error); return []; }
  return data || [];
}

export async function selectById(tableName, id) {
  if (useFallback) return null;
  const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function insertRow(tableName, row) {
  if (useFallback) return row;
  const { data, error } = await supabase.from(tableName).insert(row).select().single();
  if (error) { console.error('insertRow error:', error); throw new Error(error.message); }
  return data;
}

export async function updateRow(tableName, id, updates) {
  if (useFallback) return null;
  const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select().single();
  if (error) { console.error('updateRow error:', error); return null; }
  return data;
}

export async function deleteRow(tableName, id) {
  if (useFallback) return false;
  const { error } = await supabase.from(tableName).delete().eq('id', id);
  return !error;
}

export async function checkHealth() {
  if (useFallback) return { configured: false, connection: 'fallback' };
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) return { configured: true, connection: 'error', error: error.message };
    return { configured: true, connection: 'connected', schema: data ? 'exists' : 'missing' };
  } catch (e) {
    return { configured: true, connection: 'error', error: e.message };
  }
}
