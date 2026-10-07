'use client';
import Link from 'next/link';
import { Clock3, FolderKanban, ListTodo, Sparkles } from 'lucide-react';
import type { Project, SessionUser } from '@/lib/types';
import { useResource } from '@/lib/use-resource';
import { ProjectCard } from './ProjectCard';
import { TaskList } from './TaskRow';
import { LoadingState, ErrorState } from './ResourceState';
import { Button } from './ui/button';
import { Card } from './ui/card';
export function DashboardHome({ user }: { user: SessionUser }) {
  const { data: projects, error, loading, reload } = useResource<Project[]>('/api/projects');
  const isAgent = user.role === 'AGENT'; const isAdmin = user.role === 'ADMIN';
  const tasks = projects?.flatMap(p => p.tasks) ?? [];
  return <div className="space-y-8">
    <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="eyebrow mb-3 text-primary">Delivery workspace</p><h1 className="page-title">{isAdmin ? 'All Projects' : isAgent ? 'My Tasks' : 'My Projects'}</h1><p className="page-description">{isAdmin ? 'The people, plans, and deadlines behind your client work.' : isAgent ? `Your assigned work, ${user.name.split(' ')[0]}. Grouped by project.` : `The projects you manage, ${user.name.split(' ')[0]}.`}</p></div>{isAdmin && <Button asChild className="mt-1"><Link href="/dashboard/transcript"><Sparkles />Create from Transcript</Link></Button>}</div>
    {loading ? <LoadingState /> : error ? <ErrorState error={error} retry={reload} /> : <>
      <div className="grid gap-4 sm:grid-cols-3">{[
        { label: isAdmin ? 'Projects' : 'My projects', value: projects?.length ?? 0, icon: FolderKanban },
        { label: isAgent ? 'Assigned tasks' : 'Planned tasks', value: tasks.length, icon: ListTodo },
        { label: 'Estimated effort', value: `${tasks.reduce((n, t) => n + t.estimated_hours, 0)} h`, icon: Clock3 }
      ].map(stat => <Card key={stat.label} className="flex items-center justify-between px-6 py-5 shadow-none"><div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{stat.value}</p></div><stat.icon className="h-6 w-6 text-primary/75" /></Card>)}</div>
      {!projects?.length ? <Card className="flex min-h-80 flex-col items-center justify-center px-6 py-10 text-center shadow-none"><span className="mb-5 rounded-2xl bg-secondary p-4 text-primary"><FolderKanban className="h-8 w-8" /></span><h2 className="text-xl font-semibold">{isAdmin ? 'Your next project starts with a conversation.' : 'No assignments yet'}</h2><p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">{isAdmin ? 'Paste a meeting transcript to create projects, assign the team, and capture delivery dates.' : 'Your work will appear here once the administrator creates a project assigned to you.'}</p>{isAdmin && <Button asChild className="mt-6"><Link href="/dashboard/transcript"><Sparkles />Create from Transcript</Link></Button>}</Card> : isAgent ?
        <div className="space-y-6">{projects.map(project => <Card key={project.id} className="overflow-hidden shadow-none"><div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-5"><div><p className="mb-1 text-sm text-muted-foreground">{project.client_name}</p><h2 className="text-lg font-semibold"><Link className="hover:text-primary" href={`/dashboard/projects/${project.id}`}>{project.name}</Link></h2></div><span className="text-sm text-muted-foreground">{project.taskCount} assigned {project.taskCount === 1 ? 'task' : 'tasks'}</span></div><TaskList tasks={project.tasks} /></Card>)}</div> :
        <section aria-label="Projects"><div className="mb-5 flex items-center gap-3"><h2 className="text-lg font-semibold">Client projects</h2><span className="rounded-md border bg-white px-2 py-0.5 text-sm text-muted-foreground">{projects.length}</span></div><div className="grid items-stretch gap-5 md:grid-cols-2 2xl:grid-cols-3">{projects.map(project => <ProjectCard key={project.id} project={project} />)}</div></section>}
    </>}
  </div>;
}
