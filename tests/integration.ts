/** Integration test: real production Next.js server + real embedded Postgres.
 * The pg transport and the AI provider are test doubles; this is NOT a live
 * Supabase/OpenRouter verification. No mock is imported by production code.
 */
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { setTimeout as pause } from 'node:timers/promises';
import { PGlite } from '@electric-sql/pglite';
import { DEMO_USERS } from '../lib/seed-data';
import fixture from './fixtures/expected-plan.json';
type Row = Record<string, any>;
const db = new PGlite();
let providerMode = 'valid'; let calls = 0; let assertions = 0;
function check(label: string) { assertions++; console.log(`PASS ${label}`); }
async function body(req: IncomingMessage) { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); return JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
function send(res: ServerResponse, value: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  // Match the production pg SQL DATE parser: preserve YYYY-MM-DD.
  res.end(JSON.stringify(value, (key, v) => key === 'deadline' && typeof v === 'string' ? v.slice(0, 10) : v));
}
async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = new URL(req.url!, 'http://localhost');
    if (url.pathname === '/ai') {
      calls++; const data = await body(req);
      assert.equal(data.messages[1].role, 'user');
      assert.ok(!data.messages[0].content.includes('password_hash'));
      assert.ok(!data.messages[0].content.includes('Demo123!'));
      assert.ok(data.messages[0].content.includes('DEV06'));
      if (providerMode === 'rate-limit') return send(res, { error: 'rate limited' }, 429);
      if (providerMode === 'malformed') return send(res, { choices: [{ message: { content: 'not json' } }] });
      const plan = structuredClone(fixture);
      if (providerMode === 'bad-assignee') plan.projects[0].tasks[0].assigneeId = 'Kamran';
      if (data.messages[1].content.includes('Make the final estimate 12 hours')) {
        plan.projects[1].tasks[3].estimatedHours = 12; plan.projects[1].tasks[3].deadline = '2026-10-23';
      }
      return send(res, { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(plan) } }] });
    }
    if (url.pathname === '/query') {
      const data = await body(req);
      const result = await db.query(data.sql, data.parameters);
      return send(res, { rows: result.rows });
    }
    return send(res, { error: 'unknown test route' }, 404);
  } catch (error) { send(res, { message: error instanceof Error ? error.message : 'Test database failed', code: (error as { code?: string }).code }, 400); }
}
async function listen(server: ReturnType<typeof createServer>) {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string'); return address.port;
}
async function main() {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  await db.exec(readFileSync('supabase/schema.sql', 'utf8'));
  const stub = createServer((req, res) => { void handler(req, res); });
  const stubPort = await listen(stub);
  const probe = createServer(); const port = await listen(probe); await new Promise<void>(resolve => probe.close(() => resolve()));
  const base = `http://127.0.0.1:${port}`; let logs = '';
  const child = spawn(process.execPath, ['--require', './tests/mock-provider.cjs', './node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: process.cwd(), env: { ...process.env,
      DATABASE_URL: 'postgresql://test:test@127.0.0.1/test', DATABASE_SSL_CA_FILE: '', NW_TEST_SQL_URL: `http://127.0.0.1:${stubPort}/query`,
      JWT_SECRET: randomBytes(48).toString('hex'), OPENROUTER_API_KEY: 'test-only-ai-key',
      NW_TEST_PROVIDER_URL: `http://127.0.0.1:${stubPort}/ai`, NEXT_PUBLIC_APP_URL: base, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', chunk => { logs += chunk; }); child.stderr.on('data', chunk => { logs += chunk; });
  async function request(path: string, cookie = '', options: RequestInit = {}) {
    const response = await fetch(base + path, { ...options, redirect: 'manual', headers: { ...(cookie ? { Cookie: cookie } : {}), ...options.headers } });
    const text = await response.text(); let data: any = null; try { data = JSON.parse(text); } catch { /* HTML redirect or page */ }
    return { response, data, text };
  }
  function post(data: unknown, headers: Record<string, string> = {}): RequestInit { return { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) }; }
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) { try { const r = await request('/login'); if (r.response.status === 200) { ready = true; break; } } catch { /* startup */ } await pause(200); }
    assert.ok(ready, logs);
    assert.match((await request('/login')).text, /Email or username/); check('production login page renders');
    assert.equal((await request('/api/projects')).response.status, 401);
    assert.equal((await request('/api/auth/me')).response.status, 401);
    assert.equal((await request('/dashboard')).response.status, 307);
    assert.equal((await request('/api/projects', 'nw_token=forged')).response.status, 401);
    assert.equal((await request('/api/projects', '', { headers: { 'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware' } })).response.status, 401);
    check('anonymous, forged and middleware-bypass requests cannot access data');
    const seeded = await request('/api/seed', '', { method: 'POST' }); assert.equal(seeded.response.status, 200, seeded.text + '\n' + logs); assert.equal(seeded.data.seeded, 10);
    const before = await db.query('select id,email from users order by email');
    await request('/api/seed', '', { method: 'POST' });
    assert.deepEqual((await db.query('select id,email from users order by email')).rows, before.rows);
    assert.ok((await db.query<Row>('select password_hash from users')).rows.every(u => u.password_hash.startsWith('$2a$10$')));
    check('seed is idempotent, preserves UUIDs, and hashes all passwords at cost 10');
    assert.equal((await request('/api/auth/login', '', post({ email: DEMO_USERS[0].email, password: 'wrong' }))).response.status, 401);
    assert.equal((await request('/api/auth/login', '', post({ email: DEMO_USERS[0].email, password: 'Demo123!' }, { Origin: 'https://attacker.example' }))).response.status, 403);
    check('invalid login and cross-origin login are rejected');
    const cookies = new Map<string, string>();
    for (const u of DEMO_USERS) {
      const result = await request('/api/auth/login', '', post({ email: u.email, password: u.password })); assert.equal(result.response.status, 200, u.email);
      const cookie = result.response.headers.get('set-cookie')!;
      assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i); assert.match(cookie, /Secure/i); assert.match(cookie, /Max-Age=86400/i);
      cookies.set(u.reference_id, cookie.split(';')[0]);
    }
    check('all ten demo accounts log in with secure 24-hour HttpOnly sessions');
    const aliasLogin = await request('/api/auth/login', '', post({ email: 'Admin', password: 'admin123' }));
    assert.equal(aliasLogin.response.status, 200); check('Admin username alias logs in with the requested password');
    const admin = cookies.get('ADMIN')!;
    const me = await request('/api/auth/me', admin); assert.equal(me.data.referenceId, 'ADMIN'); assert.ok(!me.text.includes('password_hash'));
    assert.deepEqual((await request('/api/projects', admin)).data, []);
    assert.equal((await request('/api/transcript', admin, post({ transcript: '  ' }))).response.status, 400);
    assert.equal((await request('/api/transcript', admin, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' })).response.status, 400);
    for (const ref of ['PM01', 'DEV01']) {
      assert.equal((await request('/api/transcript', cookies.get(ref), post({ transcript: 'test' }))).response.status, 403);
      assert.equal((await request('/dashboard/transcript', cookies.get(ref))).response.status, 307);
    }
    assert.equal(calls, 0); check('non-admin and invalid transcript requests are rejected before any AI call');
    const transcript = readFileSync('examples/meeting-transcript.txt', 'utf8');
    for (const mode of ['malformed', 'bad-assignee', 'rate-limit']) {
      providerMode = mode;
      const result = await request('/api/transcript', admin, post({ transcript })); assert.equal(result.response.status, mode === 'rate-limit' ? 429 : 400);
      assert.equal((await db.query<{ n: number }>('select count(*)::int n from projects')).rows[0].n, 0);
    }
    providerMode = 'valid'; check('AI errors and unknown employees create no records');
    const imported = await request('/api/transcript', admin, post({ transcript })); assert.equal(imported.response.status, 201, imported.text);
    assert.equal(imported.data.projects.length, 3); assert.equal(imported.data.projects.reduce((n: number, p: Row) => n + p.taskCount, 0), 12);
    const all = (await request('/api/projects', admin)).data as Row[];
    assert.equal(all.length, 3); assert.equal(all.flatMap(p => p.tasks).reduce((n: number, t: Row) => n + t.estimated_hours, 0), 124);
    const urban = all.find(p => p.name === 'UrbanCart Website')!; const quick = all.find(p => p.name === 'QuickServe Mobile App')!;
    assert.equal(urban.deadline, '2026-10-20');
    check('valid mocked AI plan becomes 3 persistent projects and 12 tasks, totaling 124 hours');
    const expected: Record<string, [number, number]> = { ADMIN: [3, 12], PM01: [1, 4], PM02: [1, 4], PM03: [1, 4], DEV01: [1, 3], DEV02: [2, 2], DEV03: [1, 2], DEV04: [1, 1], DEV05: [1, 2], DEV06: [1, 2] };
    for (const u of DEMO_USERS) {
      const cookie = cookies.get(u.reference_id)!;
      const result = await request('/api/projects', cookie); const projects = result.data as Row[];
      assert.equal(projects.length, expected[u.reference_id][0], u.reference_id);
      assert.equal(projects.flatMap(p => p.tasks).length, expected[u.reference_id][1], u.reference_id);
      const dbUser = (await db.query<Row>('select id from users where reference_id=$1', [u.reference_id])).rows[0];
      for (const p of projects) {
        const detail = (await request(`/api/projects/${p.id}`, cookie)).data;
        if (u.role === 'MANAGER') assert.equal(detail.manager_id, dbUser.id);
        if (u.role === 'AGENT') assert.ok(detail.tasks.every((t: Row) => t.assignee_id === dbUser.id));
      }
      const team = await request('/api/team', cookie); assert.equal(team.data.length, 10); assert.ok(!team.text.includes('password_hash'));
      const page = await request('/dashboard', cookie); assert.equal(page.response.status, 200);
      if (u.role !== 'ADMIN') assert.ok(!page.text.includes('Create from Transcript'));
    }
    assert.equal((await request(`/api/projects/${quick.id}`, cookies.get('PM01'))).response.status, 403);
    assert.equal((await request(`/api/projects/${quick.id}`, cookies.get('DEV01'))).response.status, 403);
    assert.equal((await request('/api/projects/not-a-uuid', admin)).response.status, 400);
    check('all role scopes, task lists, direct project URLs, and safe team responses match the specification');
    const repeat = await request(`/api/projects/${urban.id}`, cookies.get('DEV01')); assert.equal(repeat.data.tasks.length, 3);
    assert.deepEqual((await request('/api/projects', admin)).data, all); check('fresh requests preserve saved records');
    const changed = await request('/api/transcript', admin, post({ transcript: readFileSync('examples/meeting-transcript-modified.txt', 'utf8') }));
    assert.equal(changed.response.status, 201);
    const newQuick = changed.data.projects.find((p: Row) => p.name === 'QuickServe Mobile App');
    const modified = (await request(`/api/projects/${newQuick.id}`, admin)).data.tasks.find((t: Row) => t.title === 'Mobile integration and testing');
    assert.equal(modified.estimated_hours, 12); assert.equal(modified.deadline, '2026-10-23');
    check('modified mocked AI values persist without hardcoded result overrides');
    await db.query("update users set role='AGENT' where reference_id='ADMIN'");
    assert.equal((await request('/api/transcript', admin, post({ transcript }))).response.status, 403);
    await db.query("update users set role='ADMIN' where reference_id='ADMIN'");
    check('API authorization uses the current database role, not a stale JWT role');
    const loggedOut = await request('/api/auth/logout', admin, { method: 'POST' });
    assert.match(loggedOut.response.headers.get('set-cookie')!, /Max-Age=0/i);
    check('logout clears the session cookie');
    console.log(`\n${assertions} integration check groups passed. AI and PostgreSQL transport were simulated; Postgres and Next.js were real.`);
  } finally {
    child.kill('SIGTERM');
    await new Promise<void>(resolve => { if (child.exitCode !== null) resolve(); else child.once('exit', () => resolve()); });
    await new Promise<void>(resolve => stub.close(() => resolve())); await db.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
