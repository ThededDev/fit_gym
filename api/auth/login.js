import { query, verifyPassword, publicUser } from '../_db.js';

export async function POST(request) {
  try {
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    const { email, password } = payload;

    if (!email || !password) {
      return Response.json({ error: 'Email и пароль обязательны' }, { status: 400 });
    }

    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    const user = result.rows[0];

    if (!verifyPassword(password, user.password_hash)) {
      return Response.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    return Response.json(publicUser(user));
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}