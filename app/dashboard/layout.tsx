import { redirect } from 'next/navigation';
import { getPageSession } from '@/lib/session';
import { Navbar } from '@/components/Navbar';
export const dynamic = 'force-dynamic';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getPageSession(); if (!user) redirect('/login');
  return <><Navbar user={user} /><main id="main-content" className="min-w-0 px-5 py-8 sm:px-8 lg:ml-64 lg:px-10 lg:py-10"><div className="mx-auto max-w-[1400px]">{children}</div></main></>;
}
