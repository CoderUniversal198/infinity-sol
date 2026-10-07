import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, requireAdmin } from '@/lib/auth';
import { databaseQuery } from '@/lib/supabase';
import type { TeamMember } from '@/lib/types';
import { callAI } from '@/lib/ai';
import { AI_SYSTEM_PROMPT } from '@/lib/ai-prompt';
import { parseAIOutput, validateAIOutput } from '@/lib/validation';
import { assertSameOrigin, readJson, json, errorResponse } from '@/lib/http';
import { AppError } from '@/lib/errors';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    requireAdmin(user);
    assertSameOrigin(req);
    const body = z.object({ transcript: z.string().trim().min(1).max(100000) }).safeParse(await readJson(req));
    if (!body.success) throw new AppError(400, 'Paste a meeting transcript between 1 and 100,000 characters.');
    const users = await databaseQuery<Pick<TeamMember, 'reference_id' | 'name' | 'role' | 'specialization' | 'skills'>>('select reference_id,name,role,specialization,skills from public.users');
    if (!users.length) throw new AppError(503, 'The team directory is unavailable. Run the demo account seeder first.');
    const prompt = AI_SYSTEM_PROMPT.replace('{DIRECTORY_JSON}', JSON.stringify(users, null, 2));
    const plan = validateAIOutput(parseAIOutput(await callAI(prompt, body.data.transcript)), users);
    // A Postgres function is one transaction: any error rolls back every project and task.
    const [saved] = await databaseQuery('select public.create_projects_from_plan($1::jsonb) as projects', [JSON.stringify(plan)]);
    return json({ projects: saved.projects }, 201);
  } catch (error) { return errorResponse(error); }
}
