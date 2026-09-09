import { checkHealth } from './_supabase.js';

export async function GET() {
  try {
    const db = await checkHealth();
    return Response.json({ status: 'ok', database: db });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
