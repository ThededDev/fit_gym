import pg from 'pg';

const { Pool } = pg;

// Connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('vercel') ? { rejectUnauthorized: false } : false
});

// Helper functions for database operations
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}

// Helper function to hash passwords
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  const [salt, savedHash] = passwordHash.split(':');
  const hash = scryptSync(password, salt, 64);
  return timingSafeEqual(hash, Buffer.from(savedHash, 'hex'));
}

export function publicUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}