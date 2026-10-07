import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listProjects } from '@/lib/projects';
import { json, errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try { const user = await getCurrentUser(req); return json(await listProjects(user)); }
  catch (error) { return errorResponse(error); }
}
