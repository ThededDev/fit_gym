import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const hasDatabase = !!process.env.DATABASE_URL;

let pool = null;
let useFallback = !hasDatabase;

if (hasDatabase) {
  try {
    const pg = (await import('pg')).default;
    const { Pool } = pg;
    
    // Parse and fix SSL mode in connection string
    let connectionString = process.env.DATABASE_URL;
    if (connectionString && connectionString.includes('sslmode=require')) {
      connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full');
    }
    
    pool = new Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false } // Required for Supabase
    });
  } catch (e) {
    console.error('Failed to initialize database pool:', e);
    useFallback = true;
  }
}

function hashPassword(password) {
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

function handleFallbackQuery(text, params) {
  if (text.includes('users') && text.includes('email')) {
    const email = params?.[0];
    const user = getFallbackUsers().find(u => u.email === email);
    return { rows: user ? [user] : [] };
  }
  if (text.includes('users') && text.includes('INSERT')) {
    const newUser = { id: `user-${Date.now()}`, email: params?.[1], password_hash: params?.[2], name: params?.[3], role: params?.[4], locale: 'ru', created_at: new Date().toISOString() };
    getFallbackUsers().push(newUser);
    return { rows: [newUser] };
  }
  return { rows: [] };
}

export async function query(text, params) {
  if (useFallback) {
    return handleFallbackQuery(text, params);
  }
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    if (error.code === '42P01' || error.code === '28000') {
      console.warn('Database not ready, falling back to in-memory data');
      useFallback = true;
      return handleFallbackQuery(text, params);
    }
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient() {
  if (useFallback) return { query: handleFallbackQuery, release: () => {} };
  return await pool.connect();
}
