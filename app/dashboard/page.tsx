import { redirect } from 'next/navigation';
import { getPageSession } from '@/lib/session';
import { DashboardHome } from '@/components/DashboardHome';
export default async function Dashboard() { const user = await getPageSession(); if (!user) redirect('/login'); return <DashboardHome user={user} />; }
