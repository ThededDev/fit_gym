import { randomBytes, scryptSync } from 'node:crypto';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const users = ['client-1', 'client-2', 'client-3', 'client-4', 'coach-1', 'coach-2'];
for (const id of users) {
  console.log(`${id}|${hashPassword('demo')}`);
}
