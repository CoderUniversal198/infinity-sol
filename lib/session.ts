import 'server-only';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyToken } from './jwt';
export async function getPageSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}
