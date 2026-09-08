import { hashPassword, publicUser, jsonResponse, readBody } from '../_lib';
import { db } from '../_db';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const payload = await readBody(request);
    const { name, email, password, role } = payload;

    if (!name || !email || !password || !role) {
      return jsonResponse({ error: 'Все поля обязательны' }, 400);
    }

    if (db.userExists(email)) {
      return jsonResponse({ error: 'Email уже зарегистрирован' }, 409);
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

    db.addUser(user);
    return jsonResponse(publicUser(user), 201);
  } catch (error) {
    console.error('Register error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}