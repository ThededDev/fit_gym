import { supabase } from './supabase';
import { User as AppUser } from '../types';

// Table name mapping: frontend resource names → Supabase table names
const tableMap: Record<string, string> = {
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

// Convert camelCase keys to snake_case for Supabase
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[snakeKey] = toSnakeCase(value as Record<string, unknown>);
    } else {
      result[snakeKey] = value;
    }
  }
  return result;
}

// Convert snake_case keys to camelCase for frontend
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

// Strip password data from user objects
function publicUser(user: Record<string, unknown>): Record<string, unknown> {
  const { password_hash, passwordHash, password, ...safe } = user;
  return safe;
}

// Generic GET — fetch all rows from a table
export async function apiGet<T>(path: string): Promise<T> {
  const [resource, id] = path.replace(/^\//, '').split('/').filter(Boolean);
  const tableName = tableMap[resource];
  if (!tableName) throw new Error(`Unknown resource: ${resource}`);

  // Handle /clients?coachId=... query params
  const queryStart = path.indexOf('?');
  const params = new URLSearchParams(queryStart >= 0 ? path.slice(queryStart) : '');

  let query = supabase.from(tableName).select('*');

  // Filter clients by role
  if (resource === 'clients') {
    query = query.eq('role', 'client');
    const coachId = params.get('coachId');
    if (coachId) {
      // Get client_profiles with this coach_id, then filter users
      const { data: profiles } = await supabase
        .from('client_profiles')
        .select('user_id')
        .eq('coach_id', coachId);
      if (profiles && profiles.length > 0) {
        query = query.in('id', profiles.map(p => p.user_id));
      } else {
        return [] as unknown as T;
      }
    }
  }

  // Apply query params as filters (snake_case)
  for (const [key, value] of params.entries()) {
    if (value && key !== 'coachId') {
      const col = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
      query = query.eq(col, value);
    }
  }

  // Single item by id
  if (id) {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    const result = resource === 'clients' ? publicUser(data) : data;
    return toCamelCase(result) as T;
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const results = (data || []).map((row: Record<string, unknown>) =>
    resource === 'clients' ? publicUser(row) : row
  );
  return results.map(toCamelCase) as T;
}

// Generic POST — insert a row
export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const [resource] = path.replace(/^\//, '').split('/').filter(Boolean);
  const tableName = tableMap[resource];
  if (!tableName) throw new Error(`Unknown resource: ${resource}`);

  const data = toSnakeCase(payload as Record<string, unknown>);

  if (resource === 'clients') {
    (data as Record<string, unknown>).role = 'client';
  }

  const { data: row, error } = await supabase
    .from(tableName)
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const result = resource === 'clients' ? publicUser(row) : row;
  return toCamelCase(result) as T;
}

// Generic PATCH — update a row
export async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  const [resource, id] = path.replace(/^\//, '').split('/').filter(Boolean);
  const tableName = tableMap[resource];
  if (!tableName) throw new Error(`Unknown resource: ${resource}`);
  if (!id) throw new Error('Resource id is required for PATCH');

  const data = toSnakeCase(payload as Record<string, unknown>);
  delete data.id;

  const { data: row, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!row) throw new Error('Not found');

  const result = resource === 'clients' ? publicUser(row) : row;
  return toCamelCase(result) as T;
}

// Generic DELETE — delete a row
export async function apiDelete(path: string): Promise<void> {
  const [resource, id] = path.replace(/^\//, '').split('/').filter(Boolean);
  const tableName = tableMap[resource];
  if (!tableName) throw new Error(`Unknown resource: ${resource}`);
  if (!id) throw new Error('Resource id is required for DELETE');

  const { error } = await supabase.from(tableName).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Keep the generic `api` function for any edge cases
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Ошибка запроса' }));
    throw new Error(payload.error ?? 'Ошибка запроса');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
