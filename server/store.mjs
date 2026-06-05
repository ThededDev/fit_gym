import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSeedData } from './seed.mjs';
import { hashPassword } from './auth.mjs';

const dbPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'db.json');

async function save(data) {
  await mkdir(dirname(dbPath), { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function load() {
  try {
    const data = JSON.parse(await readFile(dbPath, 'utf8'));
    const needsMigration = data.users.some((user) => user.password);
    if (needsMigration) {
      data.users = data.users.map(({ password, ...user }) => ({
        ...user,
        passwordHash: user.passwordHash ?? hashPassword(password)
      }));
      await save(data);
    }
    if (!data.comments) {
      data.comments = [];
      await save(data);
    }
    return data;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const data = createSeedData();
    await save(data);
    return data;
  }
}

export async function mutate(mutator) {
  const data = await load();
  const result = await mutator(data);
  await save(data);
  return result;
}
