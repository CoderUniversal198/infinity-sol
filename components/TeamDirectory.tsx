'use client';
import { UsersRound } from 'lucide-react';
import { useResource } from '@/lib/use-resource';
import type { TeamMember } from '@/lib/types';
import { cn, initials, roleLabel } from '@/lib/utils';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { LoadingState, ErrorState } from './ResourceState';
const colors = { ADMIN: 'border-purple-200 bg-purple-50 text-purple-700', MANAGER: 'border-blue-200 bg-blue-50 text-blue-700', AGENT: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
export function TeamDirectory() {
  const { data: members, error, loading, reload } = useResource<TeamMember[]>('/api/team');
  const sorted = members ? [...members].sort((a, b) => ({ ADMIN: 0, MANAGER: 1, AGENT: 2 }[a.role] - { ADMIN: 0, MANAGER: 1, AGENT: 2 }[b.role]) || a.reference_id.localeCompare(b.reference_id)) : [];
  return <div><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow mb-3 text-primary">People behind the work</p><h1 className="page-title">NovaWorks Team</h1><p className="page-description">Meet the managers and developers across your projects.</p></div>{members && <span className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm"><UsersRound className="h-4 w-4 text-primary" />{members.length} members</span>}</div>
    {loading ? <LoadingState /> : error ? <ErrorState error={error} retry={reload} /> : !sorted.length ? <Card className="p-8 text-muted-foreground">No team members found. Ask the administrator to seed the demo accounts.</Card> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{sorted.map(member => <Card key={member.id} className="p-6 shadow-none"><div className="mb-5 flex items-start justify-between"><span className="avatar h-12 w-12 text-base">{initials(member.name)}</span><Badge className={colors[member.role]}>{roleLabel[member.role]}</Badge></div><h2 className="text-lg font-semibold">{member.name}</h2><p className="mt-1 text-sm text-muted-foreground">{member.specialization}</p><p className="mt-3 break-all text-sm text-muted-foreground">{member.email}</p><div className="mt-5 flex flex-wrap gap-2 border-t pt-5">{member.skills?.map(skill => <span key={skill} className={cn('rounded-md bg-muted px-2.5 py-1 text-xs text-slate-600')}>{skill}</span>)}</div></Card>)}</div>}
  </div>;
}
