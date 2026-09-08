import pg from 'pg';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const { Pool } = pg;

// Check if DATABASE_URL is available
const hasDatabase = !!process.env.DATABASE_URL;

let pool = null;

if (hasDatabase) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('vercel') ? { rejectUnauthorized: false } : false
  });
}

// Fallback in-memory data for when database is not configured
const fallbackUsers = [
  {
    id: 'client-1',
    email: 'ivan@example.com',
    password_hash: hashPassword('demo'),
    name: 'Иван Петров',
    role: 'client',
    phone: '+7 916 420-18-34',
    avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2024-01-15T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'client-2',
    email: 'anna@example.com',
    password_hash: hashPassword('demo'),
    name: 'Анна Козлова',
    role: 'client',
    phone: '+7 903 118-42-07',
    avatar_url: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2024-02-10T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'client-3',
    email: 'dmitry@example.com',
    password_hash: hashPassword('demo'),
    name: 'Дмитрий Волков',
    role: 'client',
    phone: '+7 925 603-74-19',
    avatar_url: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2024-03-05T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'client-4',
    email: 'elena@example.com',
    password_hash: hashPassword('demo'),
    name: 'Елена Соколова',
    role: 'client',
    phone: '+7 926 555-66-77',
    avatar_url: 'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2024-04-20T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'coach-1',
    email: 'maria@example.com',
    password_hash: hashPassword('demo'),
    name: 'Мария Смирнова',
    role: 'coach',
    phone: '+7 985 712-50-16',
    avatar_url: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2023-06-01T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'coach-2',
    email: 'alex@example.com',
    password_hash: hashPassword('demo'),
    name: 'Алексей Николаев',
    role: 'coach',
    phone: '+7 977 888-99-00',
    avatar_url: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150',
    created_at: '2023-08-15T00:00:00Z',
    locale: 'ru'
  }
];

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  const [salt, savedHash] = passwordHash.split(':');
  const hash = scryptSync(password, salt, 64);
  return timingSafeEqual(hash, Buffer.from(savedHash, 'hex'));
}

export function publicUser(user) {
  const { password_hash, passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function query(text, params) {
  if (!hasDatabase) {
    console.log('Using fallback in-memory data (DATABASE_URL not configured)');
    return handleFallbackQuery(text, params);
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient() {
  if (!hasDatabase) {
    return { query: handleFallbackQuery, release: () => {} };
  }
  return await pool.connect();
}

// Fallback query handler for in-memory data
function handleFallbackQuery(text, params) {
  console.log('Fallback query:', text, params);
  
  // Simple fallback for login queries
  if (text.includes('SELECT') && text.includes('users') && text.includes('email')) {
    const email = params[0];
    const user = fallbackUsers.find(u => u.email === email);
    return { rows: user ? [user] : [] };
  }
  
  // Fallback for insert queries
  if (text.includes('INSERT') && text.includes('users')) {
    const newUser = {
      id: `user-${Date.now()}`,
      email: params[1],
      password_hash: params[2],
      name: params[3],
      role: params[4],
      locale: 'ru',
      created_at: new Date().toISOString()
    };
    fallbackUsers.push(newUser);
    return { rows: [newUser] };
  }
  
  // Default fallback
  return { rows: [] };
}