import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kptoweyhevaasfdbwbbs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for password hashing
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

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

// Fallback data for when Supabase is not configured
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

let useFallback = !supabaseKey;

export async function query(table, options = {}) {
  if (useFallback) {
    return handleFallbackQuery(table, options);
  }

  try {
    let result;
    
    if (options.select) {
      result = await supabase
        .from(table)
        .select(options.select)
        .eq(options.eq?.key, options.eq?.value)
        .single();
    } else if (options.insert) {
      result = await supabase
        .from(table)
        .insert(options.insert)
        .select()
        .single();
    } else if (options.update) {
      result = await supabase
        .from(table)
        .update(options.update)
        .eq(options.eq?.key, options.eq?.value)
        .select()
        .single();
    } else if (options.delete) {
      result = await supabase
        .from(table)
        .delete()
        .eq(options.eq?.key, options.eq?.value);
    } else {
      result = await supabase.from(table).select('*');
    }

    if (result.error) {
      console.error('Supabase query error:', result.error);
      // Fall back to in-memory data on error
      useFallback = true;
      return handleFallbackQuery(table, options);
    }

    return { rows: result.data ? [result.data] : [] };
  } catch (error) {
    console.error('Supabase connection error:', error);
    useFallback = true;
    return handleFallbackQuery(table, options);
  }
}

function handleFallbackQuery(table, options) {
  console.log('Using fallback data for table:', table);
  
  if (table === 'users' && options.eq?.key === 'email') {
    const user = fallbackUsers.find(u => u.email === options.eq?.value);
    return { rows: user ? [user] : [] };
  }
  
  if (table === 'users' && options.insert) {
    const newUser = {
      id: `user-${Date.now()}`,
      ...options.insert,
      created_at: new Date().toISOString()
    };
    fallbackUsers.push(newUser);
    return { rows: [newUser] };
  }
  
  return { rows: [] };
}