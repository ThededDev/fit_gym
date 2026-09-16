import { findUserByEmail, verifyPassword, publicUser } from '../_supabase.js';
import { corsJson, handlePreflight } from '../_cors.js';

export async function OPTIONS(request) {
  return handlePreflight(request);
}

export async function POST(request) {
  console.log('[AUTH] POST /api/auth/login', {
    method: request.method,
    url: request.url,
    contentType: request.headers.get('content-type'),
  });

  try {
    const body = await request.text();
    console.log('[AUTH] Login body:', body);
    const payload = body ? JSON.parse(body) : {};
    const { email, password } = payload;

    if (!email || !password) {
      return corsJson({ error: 'Email и пароль обязательны' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      console.log('[AUTH] User not found:', email);
      return corsJson({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    if (!verifyPassword(password, user.password_hash)) {
      console.log('[AUTH] Invalid password for:', email);
      return corsJson({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    console.log('[AUTH] Login success:', email, 'role:', user.role);
    return corsJson(publicUser(user));
  } catch (error) {
    console.error('[AUTH] Login error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}
