import { findUserById, updateUser, publicUser } from '../../_supabase.js';
import { corsJson, handlePreflight } from '../../_cors.js';

export async function OPTIONS(request) {
  return handlePreflight(request);
}

export async function GET(request, { params }) {
  try {
    const clientId = params.id;
    const user = await findUserById(clientId);
    if (!user || user.role !== 'client') {
      return corsJson({ error: 'Client not found' }, { status: 404 });
    }
    return corsJson(publicUser(user));
  } catch (error) {
    console.error('[CLIENT] GET error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const clientId = params.id;
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};

    const user = await findUserById(clientId);
    if (!user || user.role !== 'client') {
      return corsJson({ error: 'Client not found' }, { status: 404 });
    }

    const allowedFields = ['name', 'phone', 'avatar_url'];
    const updates = {};
    for (const field of allowedFields) {
      if (payload[field] !== undefined) updates[field] = payload[field];
    }

    if (Object.keys(updates).length === 0) {
      return corsJson({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await updateUser(clientId, updates);
    return updated ? corsJson(publicUser(updated)) : corsJson({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[CLIENT] PATCH error:', error.message, error.stack);
    return corsJson({ error: 'Internal server error' }, { status: 500 });
  }
}
