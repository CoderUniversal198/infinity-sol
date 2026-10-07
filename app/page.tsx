import { redirect } from 'next/navigation';
import { getPageSession } from '@/lib/session';
export default async function Home() { redirect(await getPageSession() ? '/dashboard' : '/login'); }
