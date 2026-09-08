import { jsonResponse, readBody, publicUser } from './_lib.mjs';
import { db } from './_db.mjs';
import { randomUUID } from 'node:crypto';

const resources = { 
  exercises: 'exercises', 
  'workout-templates': 'workoutTemplates', 
  workouts: 'scheduledWorkouts', 
  goals: 'goals', 
  'nutrition-plans': 'nutritionPlans', 
  foods: 'foodItems', 
  meals: 'mealEntries', 
  comments: 'comments' 
};

function matchesQuery(item, query) {
  return [...query.entries()].every(([key, value]) => !value || String(item[key]) === value);
}

export async function GET(request, { params }) {
  try {
    const path = params.path;
    const [resource, id] = path;
    
    if (resource === 'health') {
      return jsonResponse({ status: 'ok' });
    }
    
    const collectionName = resources[resource];
    if (!collectionName) {
      return jsonResponse({ error: 'Not found' }, 404);
    }
    
    let items = db.getCollection(collectionName);
    
    if (resource === 'clients') {
      items = db.users.filter((item) => item.role === 'client').map(publicUser);
    }
    
    const url = new URL(request.url);
    items = items.filter((item) => matchesQuery(item, url.searchParams));
    
    if (id) {
      const item = items.find((item) => item.id === id);
      return item ? jsonResponse(item) : jsonResponse({ error: 'Not found' }, 404);
    }
    
    return jsonResponse(items);
  } catch (error) {
    console.error('GET error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

export async function POST(request, { params }) {
  try {
    const path = params.path;
    const [resource] = path;
    
    const collectionName = resources[resource];
    if (!collectionName) {
      return jsonResponse({ error: 'Not found' }, 404);
    }
    
    const payload = await readBody(request);
    const item = {
      id: payload.id ?? `${resource}-${randomUUID()}`,
      ...payload
    };
    
    if (resource === 'clients') {
      item.role = 'client';
    }
    
    const created = db.addToCollection(collectionName, item);
    const responseItem = resource === 'clients' ? publicUser(created) : created;
    
    return jsonResponse(responseItem, 201);
  } catch (error) {
    console.error('POST error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const path = params.path;
    const [resource, id] = path;
    
    if (!id) {
      return jsonResponse({ error: 'Resource id is required' }, 400);
    }
    
    const collectionName = resources[resource];
    if (!collectionName) {
      return jsonResponse({ error: 'Not found' }, 404);
    }
    
    const payload = await readBody(request);
    const updated = db.updateInCollection(collectionName, id, payload);
    
    if (!updated) {
      return jsonResponse({ error: 'Not found' }, 404);
    }
    
    const responseItem = resource === 'clients' ? publicUser(updated) : updated;
    return jsonResponse(responseItem);
  } catch (error) {
    console.error('PATCH error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const path = params.path;
    const [resource, id] = path;
    
    if (!id) {
      return jsonResponse({ error: 'Resource id is required' }, 400);
    }
    
    const collectionName = resources[resource];
    if (!collectionName) {
      return jsonResponse({ error: 'Not found' }, 404);
    }
    
    const removed = db.deleteFromCollection(collectionName, id);
    
    if (!removed) {
      return jsonResponse({ error: 'Not found' }, 404);
    }
    
    return jsonResponse(null, 204);
  } catch (error) {
    console.error('DELETE error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}