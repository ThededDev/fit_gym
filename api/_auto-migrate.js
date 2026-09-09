import { supabase } from './_supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let migrationCompleted = false;
let migrationInProgress = false;

export async function ensureDatabaseSchema() {
  if (migrationCompleted) return true;
  if (migrationInProgress) return false;
  
  try {
    migrationInProgress = true;
    console.log('Checking database schema...');

    // Check if users table exists
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (!tablesError && tables) {
      console.log('Database schema already exists');
      migrationCompleted = true;
      migrationInProgress = false;
      return true;
    }

    console.log('Database schema not found, running migrations...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Creating database schema...');
    // Note: Supabase doesn't support raw SQL execution via JS client
    // Schema needs to be created manually in Supabase SQL Editor
    console.log('Please run the schema.sql in Supabase SQL Editor');
    
    migrationInProgress = false;
    return false;
  } catch (error) {
    console.error('Auto-migration error:', error);
    migrationInProgress = false;
    return false;
  }
}