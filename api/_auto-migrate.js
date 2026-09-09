import { query } from './_db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let migrationCompleted = false;

export async function ensureDatabaseSchema() {
  if (migrationCompleted) return true;
  
  try {
    // Check if users table exists
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (checkResult.rows[0]?.exists) {
      migrationCompleted = true;
      return true;
    }

    console.log('Database schema not found, running migrations...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await query(schema);
    console.log('Schema created successfully');

    // Read seed file
    const seedPath = path.join(__dirname, '../db/seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');

    // Execute seed data
    await query(seed);
    console.log('Seed data inserted successfully');

    migrationCompleted = true;
    return true;
  } catch (error) {
    console.error('Auto-migration error:', error);
    return false;
  }
}