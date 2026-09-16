import { findUserByEmail, insertUser, insertClientProfile, insertCoachProfile, hashPassword, publicUser } from '../_supabase.js';
import { corsJson, handlePreflight } from '../_cors.js';
import { randomUUID } from 'node:crypto';

export async function OPTIONS(request) {
  return handlePreflight(request);
}

export async function POST(request) {
  console.log('[AUTH] POST /api/auth/register', {
    method: request.method,
    url: request.url,
    contentType: request.headers.get('content-type'),
  });

  try {
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    const { name, email, password, role, inviteCode } = payload;

    if (!name || !email || !password || !role) {
      return corsJson({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return corsJson({ error: 'Email уже зарегистрирован' }, { status: 409 });
    }

    const userId = `${role}-${randomUUID()}`;
    const passwordHash = hashPassword(password);

    const user = await insertUser({
      id: userId,
      email,
      password_hash: passwordHash,
      name,
      role,
      phone: payload.phone || null,
      avatar_url: payload.avatar_url || null,
      locale: 'ru'
    });

    if (role === 'client') {
      await insertClientProfile({
        user_id: userId,
        privacy: { progressPhotosVisibleToCoach: true }
      });
    } else if (role === 'coach') {
      const coachInviteCode = inviteCode || `${name.toUpperCase().slice(0, 4)}${Date.now().toString().slice(-4)}`;
      await insertCoachProfile({
        user_id: userId,
        bio: '',
        specialties: [],
        invite_code: coachInviteCode,
        is_verified: false
      });
    }

    console.log('[AUTH] Register success:', email, 'role:', role);
    return corsJson(publicUser(user), { status: 201 });
  } catch (error) {
    console.error('[AUTH] Register error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}
