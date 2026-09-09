import { supabase, hashPassword, publicUser } from '../_supabase.js';
import { randomUUID } from 'node:crypto';

export async function POST(request) {
  try {
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    const { name, email, password, role, inviteCode } = payload;

    if (!name || !email || !password || !role) {
      return Response.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return Response.json({ error: 'Email уже зарегистрирован' }, { status: 409 });
    }

    // For coaches, verify invite code if provided
    if (role === 'coach' && inviteCode) {
      const { data: coachCheck } = await supabase
        .from('coach_profiles')
        .select('user_id')
        .eq('invite_code', inviteCode)
        .single();
      
      if (coachCheck) {
        return Response.json({ error: 'Инвайт код уже используется' }, { status: 400 });
      }
    }

    const userId = `${role}-${randomUUID()}`;
    const passwordHash = hashPassword(password);

    // Insert user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        password_hash: passwordHash,
        name,
        role,
        locale: 'ru'
      })
      .select()
      .single();

    if (userError) {
      return Response.json({ error: 'Ошибка при создании пользователя' }, { status: 500 });
    }

    // Create profile based on role
    if (role === 'client') {
      await supabase
        .from('client_profiles')
        .insert({
          user_id: userId,
          privacy: { progressPhotosVisibleToCoach: true }
        });
    } else if (role === 'coach') {
      const coachInviteCode = inviteCode || `${name.toUpperCase().slice(0, 4)}${Date.now().toString().slice(-4)}`;
      await supabase
        .from('coach_profiles')
        .insert({
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