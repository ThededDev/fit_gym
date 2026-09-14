import pg from 'pg';
import dotenv from 'dotenv';

// Load env variables for development only
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('vercel') || process.env.DATABASE_URL?.includes('neon') || process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient() {
  return await pool.connect();
}
