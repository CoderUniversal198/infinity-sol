import type { NextRequest } from 'next/server';
import { COOKIE_NAME, verifyToken } from './jwt';
import { databaseQuery } from './supabase';
import { AppError } from './errors';
import type { SessionUser } from './types';
export { signToken, verifyToken } from './jwt';
export async function getCurrentUser(req: NextRequest): Promise<SessionUser> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) throw new AppError(401, 'Unauthorized');
  let session: SessionUser;
  try { session = await verifyToken(token); } catch { throw new AppError(401, 'Unauthorized'); }
  // Re-read the account: deleted users and changed roles take effect immediately.
  const [data] = await databaseQuery('select id,email,name,role,reference_id from public.users where id=$1', [session.userId]);
  if (!data) throw new AppError(401, 'Unauthorized');
  return { userId: data.id, email: data.email, name: data.name, role: data.role, referenceId: data.reference_id };
}
export function requireAdmin(user: SessionUser) {
  if (user.role !== 'ADMIN') throw new AppError(403, 'Forbidden');
}
