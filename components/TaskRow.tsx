import { CalendarDays, Clock3 } from 'lucide-react';
import type { Task } from '@/lib/types';
import { formatDate, initials } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
export function TaskRow({ task }: { task: Task }) {
  return <TableRow><TableCell className="w-[46%]"><p className="text-base font-medium">{task.title}</p>{task.description && <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted-foreground">{task.description}</p>}</TableCell><TableCell><div className="flex items-center gap-2.5"><span className="avatar h-8 w-8 text-xs">{initials(task.assignee.name)}</span><div><p className="whitespace-nowrap font-medium">{task.assignee.name}</p><p className="mt-1 text-xs text-muted-foreground">{task.assignee.specialization}</p></div></div></TableCell><TableCell className="whitespace-nowrap">{formatDate(task.deadline)}</TableCell><TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{task.estimated_hours} h</TableCell></TableRow>;
}
export function TaskList({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return <p className="p-6 text-muted-foreground">No assigned tasks to show.</p>;
  return <><div className="hidden md:block"><Table><TableHeader className="bg-slate-50"><TableRow><TableHead>Task</TableHead><TableHead>Assigned to</TableHead><TableHead>Deadline</TableHead><TableHead className="text-right">Est. hours</TableHead></TableRow></TableHeader><TableBody>{tasks.map(task => <TaskRow key={task.id} task={task} />)}</TableBody></Table></div>
    <ul className="divide-y md:hidden">{tasks.map(task => <li key={task.id} className="space-y-3 p-5"><h3 className="font-semibold">{task.title}</h3>{task.description && <p className="text-sm leading-relaxed text-muted-foreground">{task.description}</p>}<p className="text-sm">{task.assignee.name}</p><div className="flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(task.deadline)}</span><span className="flex items-center gap-2"><Clock3 className="h-4 w-4" />{task.estimated_hours} h</span></div></li>)}</ul></>;
}
