import { tableMap, selectAll, selectById, insertRow, updateRow, deleteRow, publicUser } from './_supabase.js';
import { corsJson, handlePreflight } from './_cors.js';

export async function OPTIONS(request) {
  return handlePreflight(request);
}

export async function GET(request, { params }) {
  try {
    const [resource, id] = params.path;

    if (resource === 'health') {
      return corsJson({ status: 'ok' });
    }

    const tableName = tableMap[resource];
    if (!tableName) {
      return corsJson({ error: 'Not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    if (id) {
      if (resource === 'clients') {
        const user = await selectById('users', id);
        if (!user || user.role !== 'client') {
          return corsJson({ error: 'Not found' }, { status: 404 });
        }
        return corsJson(publicUser(user));
      }
      const item = await selectById(tableName, id);
      return item ? corsJson(item) : corsJson({ error: 'Not found' }, { status: 404 });
    }

    if (resource === 'clients') {
      const filters = { role: 'client' };
      const coachId = searchParams.get('coachId');
      if (coachId) {
        const profiles = await selectAll('client_profiles', { coach_id: coachId });
        const userIds = profiles.map(p => p.user_id);
        const allClients = await selectAll('users', { role: 'client' });
        const filtered = allClients.filter(u => userIds.includes(u.id));
        return corsJson(filtered.map(publicUser));
      }
      const rows = await selectAll('users', filters);
      return corsJson(rows.map(publicUser));
    }

    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      if (value) filters[key] = value;
    }
    const rows = await selectAll(tableName, filters);
    return corsJson(rows);
  } catch (error) {
    console.error('[API] GET error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  console.log('[API] POST /api/' + params.path.join('/'));
  try {
    const [resource] = params.path;
    const tableName = tableMap[resource];
    if (!tableName) {
      return corsJson({ error: 'Not found' }, { status: 404 });
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
    console.log('[API] POST success:', resource, payload.id);
    return corsJson(resource === 'clients' ? publicUser(row) : row, { status: 201 });
  } catch (error) {
    console.error('[API] POST error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const [resource, id] = params.path;
    if (!id) {
      return corsJson({ error: 'Resource id is required' }, { status: 400 });
    }

    const tableName = tableMap[resource];
    if (!tableName) {
      return corsJson({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    delete payload.id;

    const row = await updateRow(tableName, id, payload);
    return row ? corsJson(resource === 'clients' ? publicUser(row) : row) : corsJson({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[API] PATCH error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const [resource, id] = params.path;
    if (!id) {
      return corsJson({ error: 'Resource id is required' }, { status: 400 });
    }

    const tableName = tableMap[resource];
    if (!tableName) {
      return corsJson({ error: 'Not found' }, { status: 404 });
    }

    const ok = await deleteRow(tableName, id);
    return ok ? corsJson(null, { status: 204 }) : corsJson({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[API] DELETE error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}
