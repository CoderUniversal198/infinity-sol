import Link from 'next/link';
import { CalendarDays, ListTodo, FolderKanban } from 'lucide-react';
import type { Project } from '@/lib/types';
import { formatDate, initials } from '@/lib/utils';
import { Card } from './ui/card';
export function ProjectCard({ project }: { project: Project }) {
  return <Link href={`/dashboard/projects/${project.id}`} className="group block h-full rounded-xl focus-visible:ring-offset-4"><Card className="flex h-full flex-col overflow-hidden transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
    <div className="p-6"><div className="mb-5 flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary"><FolderKanban className="h-6 w-6" /></span><span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Client project</span></div>
      <p className="mb-2 text-sm text-muted-foreground">{project.client_name}</p><h3 className="text-xl font-semibold tracking-tight group-hover:text-primary">{project.name}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{project.description || 'Open this project to see its assigned tasks and delivery details.'}</p>
    </div>
    <div className="mt-auto px-6 pb-5"><div className="flex items-center gap-3 border-t pt-5"><span className="avatar h-9 w-9 text-xs">{initials(project.manager.name)}</span><div><p className="text-sm font-medium">{project.manager.name}</p><p className="text-xs text-muted-foreground">Project manager</p></div></div></div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50/70 px-6 py-4 text-sm"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" />{formatDate(project.deadline)}</span><span className="flex items-center gap-2 text-muted-foreground"><ListTodo className="h-4 w-4" />{project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}</span></div>
  </Card></Link>;
}
