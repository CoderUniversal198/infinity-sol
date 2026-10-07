-- DESTRUCTIVE: manually run in Supabase SQL Editor only when you intend to
-- delete ALL generated projects and tasks. The ten users are preserved.
begin;
delete from public.tasks;
delete from public.projects;
commit;
