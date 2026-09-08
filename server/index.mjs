import 'dotenv/config';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { query } from './db.mjs';
import { hashPassword, verifyPassword } from './auth.mjs';

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

function publicUser(user) {
  const { password, password_hash, passwordHash, ...safeUser } = user;
  return safeUser;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

function buildWhereClause(params, allowedColumns) {
  const conditions = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of params.entries()) {
    if (!value) continue;
    const col = key === 'coachId' ? 'coach_id' : key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedColumns.includes(col)) {
      conditions.push(`${col} = $${idx++}`);
      values.push(value);
    }
  }
  return { clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values };
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
      const { rows } = await query('SELECT * FROM users WHERE email = $1', [payload.email]);
      const user = rows[0];
      if (!user) return json(response, 401, { error: 'Неверный email или пароль' });
      const valid = user.password === payload.password || verifyPassword(payload.password, user.password_hash);
      return valid ? json(response, 200, publicUser(user)) : json(response, 401, { error: 'Неверный email или пароль' });
    }

    // Auth: register
    if (request.method === 'POST' && resource === 'auth' && id === 'register') {
      const payload = await readBody(request);
      const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [payload.email]);
      if (existing.length) return json(response, 409, { error: 'Email уже зарегистрирован' });

      const userId = `${payload.role}-${randomUUID()}`;
      const passwordHash = hashPassword(payload.password);
      const { rows } = await query(
        `INSERT INTO users (id, email, password_hash, name, role, phone, avatar_url, locale, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
        [userId, payload.email, passwordHash, payload.name, payload.role, payload.phone || null, payload.avatar_url || null, payload.locale || 'ru']
      );
      const user = rows[0];

      if (payload.role === 'client') {
        await query(
          `INSERT INTO client_profiles (user_id, sex, birth_date, height_cm, weight_kg, activity_level, goal_type, coach_id, privacy)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [userId, payload.sex || null, payload.birth_date || null, payload.height_cm || null, payload.weight_kg || null, payload.activity_level || null, payload.goal_type || null, payload.coach_id || null, payload.privacy || '{"progressPhotosVisibleToCoach": true}']
        );
      } else if (payload.role === 'coach') {
        await query(
          `INSERT INTO coach_profiles (user_id, bio, specialties, invite_code, is_verified)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, payload.bio || null, payload.specialties || null, payload.invite_code || null, false]
        );
      }

      return json(response, 201, publicUser(user));
    }

    // CRUD resources
    const tableName = tableMap[resource];
    if (!tableName) return json(response, 404, { error: 'Not found' });

    // GET collection / item
    if (request.method === 'GET') {
      if (id) {
        let sql = `SELECT * FROM ${tableName} WHERE id = $1`;
        const params = [id];
        if (resource === 'clients') sql = `SELECT * FROM users WHERE id = $1 AND role = 'client'`;
        const { rows } = await query(sql, params);
        const item = rows[0];
        return item ? json(response, 200, resource === 'clients' ? publicUser(item) : item) : json(response, 404, null);
      }

      if (resource === 'clients') {
        const { clause, values } = buildWhereClause(url.searchParams, ['role', 'coach_id']);
        const coachJoin = url.searchParams.has('coachId')
          ? ` JOIN client_profiles cp ON u.id = cp.user_id`
          : '';
        const coachWhere = url.searchParams.has('coachId')
          ? ` AND cp.coach_id = $1`
          : '';
        const { rows } = await query(
          `SELECT u.* FROM users u${coachJoin} WHERE u.role = 'client'${coachWhere}`,
          url.searchParams.has('coachId') ? [url.searchParams.get('coachId')] : []
        );
        return json(response, 200, rows.map(publicUser));
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
      const { clause, values } = buildWhereClause(url.searchParams, allowedCols[resource] || []);
      const { rows } = await query(`SELECT * FROM ${tableName} ${clause}`, values);
      return json(response, 200, rows);
    }

    // POST create
    if (request.method === 'POST') {
      const payload = await readBody(request);
      const itemId = payload.id ?? `${resource}-${randomUUID()}`;

      if (resource === 'clients') {
        const passwordHash = hashPassword(payload.password || 'demo');
        const { rows } = await query(
          `INSERT INTO users (id, email, password_hash, name, role, phone, avatar_url, locale, created_at)
           VALUES ($1, $2, $3, $4, 'client', $5, $6, $7, NOW()) RETURNING *`,
          [itemId, payload.email, passwordHash, payload.name, payload.phone || null, payload.avatar_url || null, payload.locale || 'ru']
        );
        return json(response, 201, publicUser(rows[0]));
      }

      const columns = Object.keys(payload).filter(k => k !== 'id');
      const values = Object.values(payload).filter((_, i) => Object.keys(payload)[i] !== 'id');
      const colList = ['id', ...columns].join(', ');
      const valList = ['$1', ...columns.map((_, i) => `$${i + 2}`)].join(', ');
      const { rows } = await query(
        `INSERT INTO ${tableName} (${colList}) VALUES (${valList}) RETURNING *`,
        [itemId, ...values]
      );
      return json(response, 201, rows[0]);
    }

    if (!id) return json(response, 400, { error: 'Resource id is required' });

    // PATCH update
    if (request.method === 'PATCH') {
      const payload = await readBody(request);

      if (resource === 'clients') {
        const sets = [];
        const values = [];
        let idx = 1;
        for (const [key, val] of Object.entries(payload)) {
          if (key === 'id') continue;
          const col = key === 'passwordHash' ? 'password_hash' : key.replace(/([A-Z])/g, '_$1').toLowerCase();
          if (key === 'password') {
            sets.push(`password_hash = $${idx++}`);
            values.push(hashPassword(val));
          } else {
            sets.push(`${col} = $${idx++}`);
            values.push(val);
          }
        }
        if (!sets.length) return json(response, 400, { error: 'No fields to update' });
        values.push(id);
        const { rows } = await query(
          `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} AND role = 'client' RETURNING *`,
          values
        );
        return rows.length ? json(response, 200, publicUser(rows[0])) : json(response, 404, { error: 'Not found' });
      }

      const sets = [];
      const values = [];
      let idx = 1;
      for (const [key, val] of Object.entries(payload)) {
        if (key === 'id') continue;
        const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sets.push(`${col} = $${idx++}`);
        values.push(val);
      }
      if (!sets.length) return json(response, 400, { error: 'No fields to update' });
      values.push(id);
      const { rows } = await query(
        `UPDATE ${tableName} SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return rows.length ? json(response, 200, rows[0]) : json(response, 404, { error: 'Not found' });
    }

    // DELETE
    if (request.method === 'DELETE') {
      if (resource === 'clients') {
        const { rowCount } = await query(`DELETE FROM users WHERE id = $1 AND role = 'client'`, [id]);
        return rowCount ? json(response, 204) : json(response, 404, { error: 'Not found' });
      }
      const { rowCount } = await query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
      return rowCount ? json(response, 204) : json(response, 404, { error: 'Not found' });
    }

    return json(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return json(response, 500, { error: 'Internal server error' });
  }
}).listen(port, () => console.log(`ONE FitGym API listening on http://localhost:${port}`));
