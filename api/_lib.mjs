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
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

export function jsonResponse(data, status = 200) {
  return Response.json(data, { status });
}

export async function readBody(request) {
  try {
    const body = await request.text();
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
}