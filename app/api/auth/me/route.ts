import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { json, errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try { const u = await getCurrentUser(req); return json({ id: u.userId, name: u.name, email: u.email, role: u.role, referenceId: u.referenceId }); }
  catch (error) { return errorResponse(error); }
}
