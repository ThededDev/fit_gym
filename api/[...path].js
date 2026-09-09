import { tableMap, selectAll, selectById, insertRow, updateRow, deleteRow, publicUser } from './_supabase.js';

export async function GET(request, { params }) {
  try {
    const [resource, id] = params.path;

    if (resource === 'health') {
      return Response.json({ status: 'ok' });
    }

    const tableName = tableMap[resource];
    if (!tableName) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    if (id) {
      if (resource === 'clients') {
        const user = await selectById('users', id);
        if (!user || user.role !== 'client') {
          return Response.json({ error: 'Not found' }, { status: 404 });
        }
        return Response.json(publicUser(user));
      }
      const item = await selectById(tableName, id);
      return item ? Response.json(item) : Response.json({ error: 'Not found' }, { status: 404 });
    }

    if (resource === 'clients') {
      const filters = { role: 'client' };
      const coachId = searchParams.get('coachId');
      if (coachId) {
        const profiles = await selectAll('client_profiles', { coach_id: coachId });
        const userIds = profiles.map(p => p.user_id);
        const allClients = await selectAll('users', { role: 'client' });
        const filtered = allClients.filter(u => userIds.includes(u.id));
        return Response.json(filtered.map(publicUser));
      }
      const rows = await selectAll('users', filters);
      return Response.json(rows.map(publicUser));
    }

    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      if (value) filters[key] = value;
    }
    const rows = await selectAll(tableName, filters);
    return Response.json(rows);
  } catch (error) {
    console.error('GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const [resource] = params.path;
    const tableName = tableMap[resource];
    if (!tableName) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};

    if (!payload.id) {
      const { randomUUID } = await import('node:crypto');
      payload.id = `${resource}-${randomUUID()}`;
    }

    if (resource === 'clients') {
      payload.role = 'client';
    }

    const row = await insertRow(tableName, payload);
    return Response.json(resource === 'clients' ? publicUser(row) : row, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const [resource, id] = params.path;
    if (!id) {
      return Response.json({ error: 'Resource id is required' }, { status: 400 });
    }

    const tableName = tableMap[resource];
    if (!tableName) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    delete payload.id;

    const row = await updateRow(tableName, id, payload);
    return row ? Response.json(resource === 'clients' ? publicUser(row) : row) : Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('PATCH error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const [resource, id] = params.path;
    if (!id) {
      return Response.json({ error: 'Resource id is required' }, { status: 400 });
    }

    const tableName = tableMap[resource];
    if (!tableName) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const ok = await deleteRow(tableName, id);
    return ok ? Response.json(null, { status: 204 }) : Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
