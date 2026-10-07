import { redirect } from 'next/navigation';
import { getPageSession } from '@/lib/session';
import { ProjectDetail } from '@/components/ProjectDetail';
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getPageSession(); if (!user) redirect('/login');
  return <ProjectDetail id={params.id} isAgent={user.role === 'AGENT'} />;
}
