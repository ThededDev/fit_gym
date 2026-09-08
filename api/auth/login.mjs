import { verifyPassword, publicUser, jsonResponse, readBody } from '../_lib.mjs';
import { db } from '../_db.mjs';

export async function POST(request) {
  try {
    const payload = await readBody(request);
    const { email, password } = payload;

    if (!email || !password) {
      return jsonResponse({ error: 'Email и пароль обязательны' }, 400);
    }

    const user = db.getUserByEmail(email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return jsonResponse({ error: 'Неверный email или пароль' }, 401);
    }

    return jsonResponse(publicUser(user));
  } catch (error) {
    console.error('Login error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}