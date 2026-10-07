'use client';
import Link from 'next/link';
import { CalendarDays, Clock3, FolderKanban, UserRound } from 'lucide-react';
import { useResource } from '@/lib/use-resource';
import type { Project } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { TaskList } from './TaskRow';
import { LoadingState, ErrorState } from './ResourceState';
export function ProjectDetail({ id, isAgent }: { id: string; isAgent: boolean }) {
  const { data: project, error, loading, reload } = useResource<Project>(`/api/projects/${id}`);
  return <div className="space-y-6"><Button asChild variant="outline" size="sm"><Link href="/dashboard">Back to Dashboard</Link></Button>
    {loading ? <LoadingState /> : error ? <ErrorState error={error} retry={reload} /> : project && <>
      <Card className="overflow-hidden shadow-none"><div className="h-1 bg-primary" /><div className="p-6 sm:p-8"><div className="mb-6 flex items-center gap-3"><span className="rounded-lg bg-secondary p-3 text-primary"><FolderKanban className="h-6 w-6" /></span><span className="text-sm text-muted-foreground">{project.client_name}</span></div><h1 className="page-title">{project.name}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{project.description}</p>
      <div className="mt-8 grid gap-6 border-t pt-6 sm:grid-cols-3">{[
        { label: 'Project manager', text: project.manager.name, icon: UserRound },
        { label: 'Project deadline', text: formatDate(project.deadline), icon: CalendarDays },
        { label: isAgent ? 'Your estimated effort' : 'Estimated effort', text: `${project.tasks.reduce((sum, t) => sum + t.estimated_hours, 0)} hours`, icon: Clock3 }
      ].map(item => <div key={item.label} className="flex items-start gap-3"><item.icon className="mt-1 h-5 w-5 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="mt-1 text-base font-medium">{item.text}</p></div></div>)}</div></div></Card>
      <Card className="overflow-hidden shadow-none"><div className="flex items-center justify-between border-b p-5 sm:px-6"><h2 className="text-lg font-semibold">{isAgent ? 'Your assigned tasks' : 'Project tasks'}</h2><span className="text-sm text-muted-foreground">{project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}</span></div><TaskList tasks={project.tasks} /></Card>
    </>}
  </div>;
}
