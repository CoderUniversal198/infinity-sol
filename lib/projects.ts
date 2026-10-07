import type { Project, SessionUser, Task } from './types';
import { databaseQuery } from './supabase';
export async function listProjects(user: SessionUser, projectId?: string): Promise<Project[]> {
  const parameters: unknown[] = [];
  const clauses: string[] = [];
  if (projectId) { parameters.push(projectId); clauses.push(`p.id=$${parameters.length}`); }
  if (user.role === 'MANAGER') {
    parameters.push(user.userId); clauses.push(`p.manager_id=$${parameters.length}`);
  } else if (user.role === 'AGENT') {
    parameters.push(user.userId);
    clauses.push(`exists (select 1 from public.tasks a where a.project_id=p.id and a.assignee_id=$${parameters.length})`);
  }
  // All identifiers above are fixed SQL; user-provided values are bound parameters.
  const projects = await databaseQuery<Omit<Project, 'tasks' | 'taskCount'>>(`
    select p.id,p.name,p.client_name,p.description,p.manager_id,p.deadline,p.created_at,
      json_build_object('name',m.name,'email',m.email) as manager
    from public.projects p join public.users m on m.id=p.manager_id
    ${clauses.length ? 'where ' + clauses.join(' and ') : ''}
    order by p.deadline,p.name`, parameters);
  if (!projects.length) return [];
  const taskParameters: unknown[] = [projects.map(p => p.id)];
  if (user.role === 'AGENT') taskParameters.push(user.userId);
  const tasks = await databaseQuery<Task>(`
    select t.id,t.project_id,t.title,t.description,t.assignee_id,t.deadline,t.estimated_hours,
      json_build_object('name',u.name,'specialization',u.specialization) as assignee
    from public.tasks t join public.users u on u.id=t.assignee_id
    where t.project_id=any($1::uuid[]) ${user.role === 'AGENT' ? 'and t.assignee_id=$2' : ''}
    order by t.deadline,t.title`, taskParameters);
  return projects.map(project => {
    const visible = tasks.filter(t => t.project_id === project.id).map(t => ({ ...t, estimated_hours: Number(t.estimated_hours) }));
    return { ...project, tasks: visible, taskCount: visible.length };
  });
}
