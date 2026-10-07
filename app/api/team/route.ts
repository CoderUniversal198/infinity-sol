import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { databaseQuery } from '@/lib/supabase';
import { json, errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  try {
    await getCurrentUser(req);
    return json(await databaseQuery('select id,reference_id,name,email,role,specialization,skills from public.users order by reference_id'));
  } catch (error) { return errorResponse(error); }
}
