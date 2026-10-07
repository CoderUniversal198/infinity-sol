import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { DEMO_USERS } from '@/lib/seed-data';
import { databaseQuery } from '@/lib/supabase';
import { assertSameOrigin, json, errorResponse } from '@/lib/http';
export const dynamic = 'force-dynamic';
// Public setup endpoint required by the demo specification; only these fixed accounts can be upserted.
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const users = await Promise.all(DEMO_USERS.map(async ({ password, ...user }) => ({ ...user, skills: [...user.skills], password_hash: await bcrypt.hash(password, 10) })));
    await databaseQuery(`insert into public.users(reference_id,name,email,password_hash,role,specialization,skills)
      select reference_id,name,email,password_hash,role,specialization,skills
      from jsonb_to_recordset($1::jsonb) as x(reference_id text,name text,email text,password_hash text,role text,specialization text,skills text[])
      on conflict(email) do update set reference_id=excluded.reference_id,name=excluded.name,
        password_hash=excluded.password_hash,role=excluded.role,specialization=excluded.specialization,skills=excluded.skills`, [JSON.stringify(users)]);
    return json({ success: true, seeded: 10, message: 'Seeded 10 demo accounts' });
  } catch (error) { return errorResponse(error); }
}
