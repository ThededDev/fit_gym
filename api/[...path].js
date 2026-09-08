import { query } from './_db.js';

const resources = { 
  exercises: 'exercises', 
  'workout-templates': 'workout_templates', 
  workouts: 'scheduled_workouts', 
  goals: 'goals', 
  'nutrition-plans': 'nutrition_plans', 
  foods: 'food_items', 
  meals: 'meal_entries', 
  comments: 'comments',
  clients: 'users'
};

function matchesQuery(item, query) {
  return [...query.entries()].every(([key, value]) => !value || String(item[key]) === value);
}

export async function GET(request, { params }) {
  try {
    const path = params.path;
    const [resource, id] = path;
    
    if (resource === 'health') {
      return Response.json({ status: 'ok' });
    }
    
    const tableName = resources[resource];
    if (!tableName) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    let queryText = `SELECT * FROM ${tableName}`;
    const queryParams = [];
    let paramCount = 1;
    
    // Add role filter for clients
    if (resource === 'clients') {
      queryText += ' WHERE role = $1';
      queryParams.push('client');
      paramCount++;
    }
    
    // Add other filters
    for (const [key, value] of searchParams.entries()) {
      if (value) {
        if (paramCount === 1) {
          queryText += ' WHERE';
        } else {
          queryText += ' AND';
        }
        queryText += ` ${key} = $${paramCount}`;
        queryParams.push(value);
        paramCount++;
      }
    }
    
    if (id) {
      queryText += paramCount === 1 ? ' WHERE' : ' AND';
      queryText += ` id = $${paramCount}`;
      queryParams.push(id);
    }
    
    const result = await query(queryText, queryParams);
    
    if (id) {
      return result.rows.length > 0 
        ? Response.json(result.rows[0])
        : Response.json({ error: 'Not found' }, { status: 404 });
    }
    
    return Response.json(result.rows);
  } catch (error) {
    console.error('GET error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const path = params.path;
    const [resource] = path;
    
    const tableName = resources[resource];
    if (!tableName) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    
    // Generate ID if not provided
    if (!payload.id) {
      const { randomUUID } = await import('node:crypto');
      payload.id = `${resource}-${randomUUID()}`;
    }
    
    // Add role for clients
    if (resource === 'clients') {
      payload.role = 'client';
    }
    
    // Build dynamic insert query
    const columns = Object.keys(payload);
    const values = Object.values(payload);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const queryText = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    const result = await query(queryText, values);
    
    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const path = params.path;
    const [resource, id] = path;
    
    if (!id) {
      return Response.json({ error: 'Resource id is required' }, { status: 400 });
    }
    
    const tableName = resources[resource];
    if (!tableName) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(payload)) {
      if (key !== 'id') {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (updates.length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    values.push(id);
    const queryText = `UPDATE ${tableName} SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(queryText, values);
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    
    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('PATCH error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const path = params.path;
    const [resource, id] = path;
    
    if (!id) {
      return Response.json({ error: 'Resource id is required' }, { status: 400 });
    }
    
    const tableName = resources[resource];
    if (!tableName) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    
    const result = await query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);
    
    if (result.rows.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    
    return Response.json(null, { status: 204 });
  } catch (error) {
    console.error('DELETE error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}