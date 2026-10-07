import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { databaseQuery } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { COOKIE_NAME, SESSION_SECONDS } from '@/lib/jwt';
import { assertSameOrigin, readJson, json, errorResponse } from '@/lib/http';
import { AppError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const parsed = z.object({ email: z.string().trim().min(1).max(254), password: z.string().min(1).max(200) }).safeParse(await readJson(req, 4096));
    if (!parsed.success) throw new AppError(400, 'Enter your email or username and password.');
    const identifier = parsed.data.email.toLowerCase();
    const email = identifier === 'admin' ? 'admin@novaworks.example' : identifier;
    if (!z.string().email().safeParse(email).success) throw new AppError(401, 'Invalid username or password');
    const [user] = await databaseQuery('select id,name,email,role,reference_id,password_hash from public.users where email=$1', [email]);
    const hash = user?.password_hash || '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    const valid = await bcrypt.compare(parsed.data.password, hash);
    if (!user || !valid) throw new AppError(401, 'Invalid username or password');
    let token: string;
    try { token = await signToken({ userId: user.id, name: user.name, email: user.email, role: user.role, referenceId: user.reference_id }); }
    catch { throw new AppError(503, 'Login is not configured. Ask the administrator to check the session secret.'); }
    const response = json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    response.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_SECONDS });
    return response;
  } catch (error) { return errorResponse(error); }
}
