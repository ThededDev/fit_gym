import { checkHealth } from './_supabase.js';
import { corsJson, handlePreflight } from './_cors.js';

export async function OPTIONS(request) {
  return handlePreflight(request);
}

export async function GET() {
  try {
    const db = await checkHealth();
    console.log('[HEALTH]', db);
    return corsJson({ status: 'ok', database: db });
  } catch (error) {
    console.error('[HEALTH] Error:', error.message);
    return corsJson({ status: 'error', error: error.message }, { status: 500 });
  }
}
