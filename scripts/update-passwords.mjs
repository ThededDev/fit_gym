import pg from 'pg';
import { randomBytes, scryptSync } from 'node:crypto';

const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://fitgym:fitgym123@localhost:5432/fitgym' });

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const users = ['client-1', 'client-2', 'client-3', 'client-4', 'coach-1', 'coach-2'];

for (const id of users) {
  const hash = hashPassword('demo');
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, id]);
  console.log('Updated:', id);
}

await pool.end();
console.log('Done');
