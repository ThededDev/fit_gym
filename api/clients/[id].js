import { findUserById, updateUser, publicUser } from '../../_supabase.js';

export async function GET(request, { params }) {
  try {
    const clientId = params.id;
    const user = await findUserById(clientId);
    if (!user || user.role !== 'client') {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }
    return Response.json(publicUser(user));
  } catch (error) {
    console.error('Get client error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const clientId = params.id;
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};

    const user = await findUserById(clientId);
    if (!user || user.role !== 'client') {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const allowedFields = ['name', 'phone', 'avatar_url'];
    const updates = {};
    for (const field of allowedFields) {
      if (payload[field] !== undefined) updates[field] = payload[field];
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await updateUser(clientId, updates);
    return updated ? Response.json(publicUser(updated)) : Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Update client error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
