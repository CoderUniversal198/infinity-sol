-- Run the WHOLE file once in your Supabase project's SQL Editor.
-- Supabase is a plain Postgres database here. Supabase Auth is not used.
begin;
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  reference_id text unique not null,
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('ADMIN', 'MANAGER', 'AGENT')),
  specialization text,
  skills text[],
  created_at timestamptz default now()
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text not null,
  description text,
  manager_id uuid not null references public.users(id),
  deadline date not null,
  created_at timestamptz default now()
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid not null references public.users(id),
  deadline date not null,
  estimated_hours numeric not null check (estimated_hours > 0),
  created_at timestamptz default now()
);
create index if not exists projects_manager_idx on public.projects(manager_id);
create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists tasks_assignee_idx on public.tasks(assignee_id);

-- No browser client can query these tables. The server's service-role client
-- bypasses RLS; ADMIN / MANAGER / AGENT permissions are checked in each API route.
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
revoke all on public.users, public.projects, public.tasks from anon, authenticated;
grant all on public.users, public.projects, public.tasks to service_role;

-- Atomic alternative to compensating deletes. If any insert fails, Postgres
-- rolls back every change made by this call, including previous projects.
create or replace function public.create_projects_from_plan(p_plan jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  p jsonb;
  t jsonb;
  v_project_id uuid;
  v_manager_id uuid;
  v_assignee_id uuid;
  v_deadline date;
  result jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_plan->'projects') is distinct from 'array' or jsonb_array_length(p_plan->'projects') = 0 then
    raise exception 'Plan must contain projects';
  end if;
  for p in select value from jsonb_array_elements(p_plan->'projects') loop
    select id into v_manager_id from public.users where reference_id = p->>'managerId' and role = 'MANAGER';
    if v_manager_id is null then raise exception 'Unknown manager'; end if;
    if coalesce(btrim(p->>'name'), '') = '' or coalesce(btrim(p->>'clientName'), '') = '' then raise exception 'Missing project fields'; end if;
    v_deadline := (p->>'deadline')::date;
    if v_deadline is null or extract(year from v_deadline) <> 2026 then raise exception 'Invalid project deadline'; end if;
    if jsonb_typeof(p->'tasks') is distinct from 'array' or jsonb_array_length(p->'tasks') = 0 then raise exception 'Missing project tasks'; end if;
    insert into public.projects(name, client_name, description, manager_id, deadline)
      values (p->>'name', p->>'clientName', p->>'description', v_manager_id, v_deadline) returning id into v_project_id;
    for t in select value from jsonb_array_elements(p->'tasks') loop
      select id into v_assignee_id from public.users where reference_id = t->>'assigneeId' and role = 'AGENT';
      if v_assignee_id is null then raise exception 'Unknown agent'; end if;
      if coalesce(btrim(t->>'title'), '') = '' then raise exception 'Missing task title'; end if;
      if (t->>'deadline')::date > v_deadline or extract(year from (t->>'deadline')::date) <> 2026 then raise exception 'Invalid task deadline'; end if;
      insert into public.tasks(project_id, title, description, assignee_id, deadline, estimated_hours)
        values (v_project_id, t->>'title', t->>'description', v_assignee_id, (t->>'deadline')::date, (t->>'estimatedHours')::numeric);
    end loop;
    result := result || jsonb_build_array(jsonb_build_object('id', v_project_id, 'name', p->>'name', 'taskCount', jsonb_array_length(p->'tasks')));
  end loop;
  return result;
end;
$$;
revoke all on function public.create_projects_from_plan(jsonb) from public, anon, authenticated;
grant execute on function public.create_projects_from_plan(jsonb) to service_role;
commit;
