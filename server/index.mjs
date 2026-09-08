import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { load, mutate } from './store.mjs';
import { hashPassword, verifyPassword } from './auth.mjs';

const port = Number(process.env.PORT ?? 8787);
const resources = { clients: 'users', exercises: 'exercises', 'workout-templates': 'workoutTemplates', workouts: 'scheduledWorkouts', goals: 'goals', 'nutrition-plans': 'nutritionPlans', foods: 'foodItems', meals: 'mealEntries', comments: 'comments' };

function json(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(status === 204 ? '' : JSON.stringify(payload));
}

function publicUser(user) {
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

function matchesQuery(item, query) {
  return [...query.entries()].every(([key, value]) => !value || String(item[key]) === value);
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const [root, resource, id] = url.pathname.split('/').filter(Boolean);
    if (root !== 'api') return json(response, 404, { error: 'Not found' });
    if (request.method === 'GET' && resource === 'health') return json(response, 200, { status: 'ok' });

    if (request.method === 'POST' && resource === 'auth' && id === 'login') {
      const payload = await readBody(request);
      const data = await load();
      const user = data.users.find((item) => item.email === payload.email && (item.password === payload.password || verifyPassword(payload.password, item.passwordHash)));
      return user ? json(response, 200, publicUser(user)) : json(response, 401, { error: 'Неверный email или пароль' });
    }

    if (request.method === 'POST' && resource === 'auth' && id === 'register') {
      const payload = await readBody(request);
      const result = await mutate((data) => {
        if (data.users.some((item) => item.email === payload.email)) return null;
        const { password, ...profile } = payload;
        const user = { id: `${payload.role}-${randomUUID()}`, createdAt: new Date().toISOString(), locale: 'ru', ...profile, passwordHash: hashPassword(password) };
        data.users.push(user);
        return publicUser(user);
      });
      return result ? json(response, 201, result) : json(response, 409, { error: 'Email уже зарегистрирован' });
    }

    const collectionName = resources[resource];
    if (!collectionName) return json(response, 404, { error: 'Not found' });

    if (request.method === 'GET') {
      const data = await load();
      let items = data[collectionName];
      if (resource === 'clients') items = items.filter((item) => item.role === 'client').map(publicUser);
      items = items.filter((item) => matchesQuery(item, url.searchParams));
      return json(response, 200, id ? items.find((item) => item.id === id) ?? null : items);
    }

    if (request.method === 'POST') {
      const payload = await readBody(request);
      const item = await mutate((data) => {
        const created = { id: payload.id ?? `${resource}-${randomUUID()}`, ...payload };
        if (resource === 'clients') created.role = 'client';
        data[collectionName].push(created);
        return resource === 'clients' ? publicUser(created) : created;
      });
      return json(response, 201, item);
    }

    if (!id) return json(response, 400, { error: 'Resource id is required' });
    if (request.method === 'PATCH') {
      const payload = await readBody(request);
      const updated = await mutate((data) => {
        const index = data[collectionName].findIndex((item) => item.id === id);
        if (index === -1) return null;
        data[collectionName][index] = { ...data[collectionName][index], ...payload, id };
        return resource === 'clients' ? publicUser(data[collectionName][index]) : data[collectionName][index];
      });
      return updated ? json(response, 200, updated) : json(response, 404, { error: 'Not found' });
    }

    if (request.method === 'DELETE') {
      const removed = await mutate((data) => {
        const index = data[collectionName].findIndex((item) => item.id === id);
        if (index === -1) return false;
        data[collectionName].splice(index, 1);
        return true;
      });
      return removed ? json(response, 204) : json(response, 404, { error: 'Not found' });
    }

    return json(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return json(response, 500, { error: 'Internal server error' });
  }
}).listen(port, () => console.log(`ONE FitGym API listening on http://localhost:${port}`));
