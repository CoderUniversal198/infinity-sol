import test from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import { randomBytes } from 'node:crypto';
import { signToken, verifyToken } from '../lib/jwt';
const key = randomBytes(48).toString('hex'); process.env.JWT_SECRET = key;
const user = { userId: 'user-1', email: 'admin@novaworks.example', role: 'ADMIN' as const, name: 'Admin', referenceId: 'ADMIN' };
test('signed JWT round-trips the identity', async () => { assert.deepEqual(await verifyToken(await signToken(user)), user); });
test('tampered JWT is rejected', async () => {
  const token = await signToken(user); const [header, body, signature] = token.split('.');
  await assert.rejects(verifyToken(`${header}.${Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), role: 'AGENT' })).toString('base64url')}.${signature}`));
});
test('expired and incorrectly issued tokens are rejected', async () => {
  const expired = await new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setIssuer('novaworks-crm').setAudience('novaworks-users').setExpirationTime('1 second ago').sign(new TextEncoder().encode(key));
  await assert.rejects(verifyToken(expired));
  const wrongIssuer = await new SignJWT(user).setProtectedHeader({ alg: 'HS256' }).setIssuer('other').setExpirationTime('1h').sign(new TextEncoder().encode(key));
  await assert.rejects(verifyToken(wrongIssuer));
});
