import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import fixture from './fixtures/expected-plan.json';
import { DEMO_USERS } from '../lib/seed-data';
test('Postgres transaction persists the plan, rolls back partial failure and denies browser roles', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await db.exec(readFileSync('supabase/schema.sql', 'utf8'));
    for (const u of DEMO_USERS) await db.query('insert into users(reference_id,name,email,role,password_hash) values ($1,$2,$3,$4,$5)', [u.reference_id, u.name, u.email, u.role, 'test-only']);
    await db.query('select public.create_projects_from_plan($1::jsonb)', [JSON.stringify(fixture)]);
    assert.equal((await db.query<{ count: number }>('select count(*)::int as count from tasks')).rows[0].count, 12);
    assert.equal((await db.query<{ sum: number }>('select sum(estimated_hours)::int from tasks')).rows[0].sum, 124);
    const broken = structuredClone(fixture); broken.projects[1].tasks[3].assigneeId = 'Kamran';
    await assert.rejects(db.query('select public.create_projects_from_plan($1::jsonb)', [JSON.stringify(broken)]));
    assert.equal((await db.query<{ count: number }>('select count(*)::int as count from projects')).rows[0].count, 3);
    assert.equal((await db.query<{ count: number }>('select count(*)::int as count from tasks')).rows[0].count, 12);
    await db.exec('set role anon');
    await assert.rejects(db.query('select * from public.users'));
    await assert.rejects(db.query('select public.create_projects_from_plan($1::jsonb)', [JSON.stringify(fixture)]));
    await db.exec('reset role; set role authenticated');
    await assert.rejects(db.query('select * from public.tasks'));
    await db.exec('reset role; set role service_role');
    assert.equal((await db.query<{ count: number }>('select count(*)::int as count from public.tasks')).rows[0].count, 12);
    await db.exec('reset role');
    await db.exec(readFileSync('supabase/reset-demo.sql', 'utf8'));
    assert.equal((await db.query<{ count: number }>('select count(*)::int as count from users')).rows[0].count, 10);
  } finally { await db.close(); }
});
