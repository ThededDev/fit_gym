import { query, hashPassword, publicUser } from '../_db.js';
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
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return Response.json({ error: 'Email уже зарегистрирован' }, { status: 409 });
    }

    // For coaches, verify invite code if provided
    if (role === 'coach' && inviteCode) {
      const coachCheck = await query(
        'SELECT user_id FROM coach_profiles WHERE invite_code = $1',
        [inviteCode]
      );
      
      if (coachCheck.rows.length > 0) {
        return Response.json({ error: 'Инвайт код уже используется' }, { status: 400 });
      }
    }

    const userId = `${role}-${randomUUID()}`;
    const passwordHash = hashPassword(password);

    // Start transaction
    const client = await query('BEGIN');
    
    try {
      // Insert user
      await query(
        `INSERT INTO users (id, email, password_hash, name, role, locale, created_at)
         VALUES ($1, $2, $3, $4, $5, 'ru', CURRENT_TIMESTAMP)`,
        [userId, email, passwordHash, name, role]
      );

      // Create profile based on role
      if (role === 'client') {
        await query(
          `INSERT INTO client_profiles (user_id, privacy, created_at)
           VALUES ($1, '{"progressPhotosVisibleToCoach": true}', CURRENT_TIMESTAMP)`,
          [userId]
        );
      } else if (role === 'coach') {
        const coachInviteCode = inviteCode || `${name.toUpperCase().slice(0, 4)}${Date.now().toString().slice(-4)}`;
        await query(
          `INSERT INTO coach_profiles (user_id, bio, specialties, invite_code, is_verified, created_at)
           VALUES ($1, '', ARRAY[], $2, false, CURRENT_TIMESTAMP)`,
          [userId, coachInviteCode]
        );
      }

      await query('COMMIT');

      // Get the created user
      const userResult = await query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      return Response.json(publicUser(userResult.rows[0]), { status: 201 });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}