import { findUserByEmail, insertUser, insertClientProfile, insertCoachProfile, hashPassword, publicUser } from '../_supabase.js';
import { randomUUID } from 'node:crypto';

export async function POST(request) {
  try {
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    const { name, email, password, role, inviteCode } = payload;

    if (!name || !email || !password || !role) {
      return Response.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return Response.json({ error: 'Email уже зарегистрирован' }, { status: 409 });
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

    return Response.json(publicUser(user), { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
