import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { listProjects } from '@/lib/projects';
import { json, errorResponse } from '@/lib/http';
import { AppError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(req);
    if (!z.string().uuid().safeParse(params.id).success) throw new AppError(400, 'Invalid project ID.');
    const projects = await listProjects(user, params.id);
    if (!projects.length) throw new AppError(user.role === 'ADMIN' ? 404 : 403, user.role === 'ADMIN' ? 'Project not found.' : 'Forbidden');
    return json(projects[0]);
  } catch (error) { return errorResponse(error); }
}
