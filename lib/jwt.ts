// Edge-compatible: middleware must never import the database or next/headers.
import { SignJWT, jwtVerify } from 'jose';
import type { SessionUser } from './types';
export const COOKIE_NAME = 'nw_token';
export const SESSION_SECONDS = 60 * 60 * 24;
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32 || value.startsWith('replace-') || value.startsWith('your-')) {
    throw new Error('Configure JWT_SECRET with at least 32 random characters.');
  }
  return new TextEncoder().encode(value);
}
export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: 'HS256' })
    .setIssuer('novaworks-crm').setAudience('novaworks-users')
    .setIssuedAt().setExpirationTime('24h').sign(secret());
}
export async function verifyToken(token: string): Promise<SessionUser> {
  const { payload } = await jwtVerify(token, secret(), {
    algorithms: ['HS256'], issuer: 'novaworks-crm', audience: 'novaworks-users'
  });
  if (typeof payload.userId !== 'string' || typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' || typeof payload.referenceId !== 'string' ||
      !['ADMIN', 'MANAGER', 'AGENT'].includes(String(payload.role))) throw new Error('Invalid session');
  return { userId: payload.userId, email: payload.email, name: payload.name,
    referenceId: payload.referenceId, role: payload.role as SessionUser['role'] };
}
