import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPageSession } from '@/lib/session';
import { TranscriptForm } from '@/components/TranscriptForm';
export const metadata: Metadata = { title: 'Create from Transcript' };
export default async function TranscriptPage() {
  const user = await getPageSession(); if (!user || user.role !== 'ADMIN') redirect('/dashboard');
  return <div className="space-y-8"><div><p className="eyebrow mb-3 text-primary">Meeting to project</p><h1 className="page-title">Create from Transcript</h1><p className="page-description">Turn the final discussion into projects and assigned tasks.</p></div><TranscriptForm /></div>;
}
