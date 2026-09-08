import { query } from '../../api/_db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

export async function POST(request) {
  try {
    // Simple security check - require a secret key
    const body = await request.text();
    const payload = body ? JSON.parse(body) : {};
    const { secret } = payload;

    if (secret !== process.env.MIGRATION_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting database migration...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await query(schema);
    console.log('Schema created successfully');

    // Read seed file
    const seedPath = path.join(__dirname, '../../db/seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');

    // Execute seed data
    await query(seed);
    console.log('Seed data inserted successfully');

    return Response.json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}