export async function POST(request) {
  return Response.json({
    error: 'Migrations must be run via Supabase SQL Editor',
    instructions: '1. Open your Supabase project Dashboard\n2. Go to SQL Editor\n3. Paste the contents of db/schema.sql and run it\n4. Then paste db/seed.sql and run it\n5. Demo users will be available with password: demo'
  }, { status: 400 });
}
