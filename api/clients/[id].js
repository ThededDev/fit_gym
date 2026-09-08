import { query, publicUser } from '../../_db.js';

export async function GET(request, { params }) {
  try {
    const clientId = params.id;

    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND role = $2',
      [clientId, 'client']
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    return Response.json(publicUser(result.rows[0]));
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

    // Check if client exists
    const checkResult = await query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [clientId, 'client']
    );

    if (checkResult.rows.length === 0) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['name', 'phone', 'avatar_url'];
    
    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(payload[field]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(clientId);
    const updateQuery = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await query(updateQuery, values);

    return Response.json(publicUser(result.rows[0]));
  } catch (error) {
    console.error('Update client error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}