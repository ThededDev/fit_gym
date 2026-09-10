import 'dotenv/config';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import {
  findUserByEmail,
  insertUser,
  findClientProfile,
  insertClientProfile,
  findCoachByInviteCode,
  insertCoachProfile,
  selectAll,
  selectById,
  insertRow,
  updateRow,
  deleteRow,
  hashPassword,
  verifyPassword,
  publicUser,
  useFallback
} from '../api/_supabase.js';

const port = Number(process.env.PORT ?? 8787);

const tableMap = {
  clients: 'users',
  exercises: 'exercises',
  'workout-templates': 'workout_templates',
  workouts: 'scheduled_workouts',
  goals: 'goals',
  'nutrition-plans': 'nutrition_plans',
  foods: 'food_items',
  meals: 'meal_entries',
  comments: 'comments',
};

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(status === 204 ? '' : JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const [root, resource, id] = url.pathname.split('/').filter(Boolean);
    if (root !== 'api') return json(response, 404, { error: 'Not found' });
    if (request.method === 'GET' && resource === 'health') return json(response, 200, { status: 'ok' });

    // Auth: login
    if (request.method === 'POST' && resource === 'auth' && id === 'login') {
      const payload = await readBody(request);
      const user = await findUserByEmail(payload.email);
      if (!user) return json(response, 401, { error: 'Неверный email или пароль' });
      const valid = verifyPassword(payload.password, user.password_hash);
      return valid ? json(response, 200, publicUser(user)) : json(response, 401, { error: 'Неверный email или пароль' });
    }

    // Auth: register
    if (request.method === 'POST' && resource === 'auth' && id === 'register') {
      const payload = await readBody(request);
      const existing = await findUserByEmail(payload.email);
      if (existing) return json(response, 409, { error: 'Email уже зарегистрирован' });

      const userId = `${payload.role}-${randomUUID()}`;
      const passwordHash = hashPassword(payload.password);
      const user = await insertUser({
        id: userId,
        email: payload.email,
        password_hash: passwordHash,
        name: payload.name,
        role: payload.role,
        phone: payload.phone || null,
        avatar_url: payload.avatar_url || null,
        locale: payload.locale || 'ru',
        created_at: new Date().toISOString()
      });

      if (payload.role === 'client') {
        await insertClientProfile({
          user_id: userId,
          sex: payload.sex || null,
          birth_date: payload.birth_date || null,
          height_cm: payload.height_cm || null,
          weight_kg: payload.weight_kg || null,
          activity_level: payload.activity_level || null,
          goal_type: payload.goal_type || null,
          coach_id: payload.coach_id || null,
          privacy: payload.privacy || '{"progressPhotosVisibleToCoach": true}'
        });
      } else if (payload.role === 'coach') {
        await insertCoachProfile({
          user_id: userId,
          bio: payload.bio || null,
          specialties: payload.specialties || null,
          invite_code: payload.invite_code || null,
          is_verified: false
        });
      }

      return json(response, 201, publicUser(user));
    }

    // CRUD resources
    const tableName = tableMap[resource];
    if (!tableName) return json(response, 404, { error: 'Not found' });

    // GET collection / item
    if (request.method === 'GET') {
      if (id) {
        const item = await selectById(tableName, id);
        if (!item) return json(response, 404, null);
        return json(response, 200, resource === 'clients' ? publicUser(item) : item);
      }

      if (resource === 'clients') {
        const filters = { role: 'client' };
        if (url.searchParams.has('coachId')) {
          filters.coach_id = url.searchParams.get('coachId');
        }
        const users = await selectAll('users', filters);
        return json(response, 200, users.map(publicUser));
      }

      const allowedCols = {
        exercises: ['id', 'name'],
        workout_templates: ['id', 'coach_id', 'name'],
        scheduled_workouts: ['id', 'client_id', 'date', 'status'],
        goals: ['id', 'client_id', 'type', 'status'],
        nutrition_plans: ['id', 'client_id', 'coach_id', 'status'],
        food_items: ['id', 'name'],
        meal_entries: ['id', 'client_id', 'date', 'type'],
        comments: ['id', 'author_id', 'client_id', 'entity_type', 'entity_id'],
      };

      const filters = {};
      for (const [key, value] of url.searchParams.entries()) {
        if (value && (allowedCols[resource]?.includes(key) || key === 'coachId')) {
          const col = key === 'coachId' ? 'coach_id' : key.replace(/([A-Z])/g, '_$1').toLowerCase();
          filters[col] = value;
        }
      }

      const items = await selectAll(tableName, filters);
      return json(response, 200, items);
    }

    // POST create
    if (request.method === 'POST') {
      const payload = await readBody(request);
      const itemId = payload.id ?? `${resource}-${randomUUID()}`;

      if (resource === 'clients') {
        const passwordHash = hashPassword(payload.password || 'demo');
        const user = await insertUser({
          id: itemId,
          email: payload.email,
          password_hash: passwordHash,
          name: payload.name,
          role: 'client',
          phone: payload.phone || null,
          avatar_url: payload.avatar_url || null,
          locale: payload.locale || 'ru',
          created_at: new Date().toISOString()
        });
        return json(response, 201, publicUser(user));
      }

      const row = await insertRow(tableName, { ...payload, id: itemId });
      return json(response, 201, row);
    }

    if (!id) return json(response, 400, { error: 'Resource id is required' });

    // PATCH update
    if (request.method === 'PATCH') {
      const payload = await readBody(request);

      if (resource === 'clients') {
        const updates = {};
        for (const [key, val] of Object.entries(payload)) {
          if (key === 'id') continue;
          if (key === 'password') {
            updates.password_hash = hashPassword(val);
          } else if (key === 'passwordHash') {
            updates.password_hash = val;
          } else {
            updates[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = val;
          }
        }
        if (!Object.keys(updates).length) return json(response, 400, { error: 'No fields to update' });

        const user = await updateRow('users', id, updates);
        return user ? json(response, 200, publicUser(user)) : json(response, 404, { error: 'Not found' });
      }

      const updates = {};
      for (const [key, val] of Object.entries(payload)) {
        if (key === 'id') continue;
        updates[key.replace(/([A-Z])/g, '_$1').toLowerCase()] = val;
      }
      if (!Object.keys(updates).length) return json(response, 400, { error: 'No fields to update' });

      const row = await updateRow(tableName, id, updates);
      return row ? json(response, 200, row) : json(response, 404, { error: 'Not found' });
    }

    // DELETE
    if (request.method === 'DELETE') {
      if (resource === 'clients') {
        const success = await deleteRow('users', id);
        return success ? json(response, 204) : json(response, 404, { error: 'Not found' });
      }
      const success = await deleteRow(tableName, id);
      return success ? json(response, 204) : json(response, 404, { error: 'Not found' });
    }

    return json(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return json(response, 500, { error: 'Internal server error' });
  }
}).listen(port, () => console.log(`ONE FitGym API listening on http://localhost:${port}`));
