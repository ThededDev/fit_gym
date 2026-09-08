import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { randomUUID } from 'node:crypto';

// Simple in-memory database
let users = [
  {
    id: 'client-1',
    email: 'ivan@example.com',
    passwordHash: 'demo_hash',
    name: 'Иван Петров',
    role: 'client',
    phone: '+7 916 420-18-34',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2024-01-15T00:00:00Z',
    locale: 'ru'
  },
  {
    id: 'coach-1',
    email: 'maria@example.com',
    passwordHash: 'demo_hash',
    name: 'Мария Смирнова',
    role: 'coach',
    phone: '+7 985 712-50-16',
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    createdAt: '2023-06-01T00:00:00Z',
    locale: 'ru'
  }
];

// Initialize password hashes
users[0].passwordHash = hashPassword('demo');
users[1].passwordHash = hashPassword('demo');

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function publicUser(user) {
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function POST(request) {
  try {
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    const { name, email, password, role } = payload;

    if (!name || !email || !password || !role) {
      return Response.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    if (users.some(u => u.email === email)) {
      return Response.json({ error: 'Email уже зарегистрирован' }, { status: 409 });
    }

    const user = {
      id: `${role}-${randomUUID()}`,
      createdAt: new Date().toISOString(),
      locale: 'ru',
      name,
      email,
      role,
      passwordHash: hashPassword(password)
    };

    users.push(user);
    return Response.json(publicUser(user), { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}