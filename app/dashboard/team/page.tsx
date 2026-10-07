import type { Metadata } from 'next';
import { TeamDirectory } from '@/components/TeamDirectory';
export const metadata: Metadata = { title: 'Team' };
export default function TeamPage() { return <TeamDirectory />; }
