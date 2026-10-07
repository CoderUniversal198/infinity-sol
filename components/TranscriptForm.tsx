'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, FileText, Loader2, Sparkles } from 'lucide-react';
import type { CreatedProject } from '@/lib/types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Alert, AlertTitle } from './ui/alert';
export function TranscriptForm() {
  const [transcript, setTranscript] = useState(''); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [details, setDetails] = useState<string[]>([]);
  const [created, setCreated] = useState<CreatedProject[] | null>(null);
  const submitting = useRef(false); const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (created) resultHeading.current?.focus(); }, [created]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (submitting.current || !transcript.trim()) return;
    submitting.current = true; setBusy(true); setError(''); setDetails([]);
    try {
      const response = await fetch('/api/transcript', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript }) });
      const data = await response.json();
      if (!response.ok) { setDetails(data.details || []); throw new Error(data.error || 'Unable to create projects.'); }
      setCreated(data.projects);
    } catch (err) { setError(err instanceof TypeError ? 'The connection ended before confirmation. Check the Dashboard before trying again to avoid duplicate projects.' : err instanceof Error ? err.message : 'Unable to create projects. Please try again.'); }
    finally { submitting.current = false; setBusy(false); }
  }
  if (created) return <Card className="mx-auto max-w-3xl p-6 sm:p-9"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-7 w-7" /></div><h2 ref={resultHeading} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">Your projects are ready.</h2><p role="status" className="mt-3 text-muted-foreground">Created {created.length} projects and {created.reduce((sum, p) => sum + p.taskCount, 0)} tasks.</p><ul className="my-7 divide-y rounded-lg border">{created.map(project => <li key={project.id}><Link href={`/dashboard/projects/${project.id}`} className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-muted"><span className="flex items-center gap-3 font-medium"><Check className="h-4 w-4 text-emerald-700" />{project.name}</span><span className="text-sm text-muted-foreground">{project.taskCount} tasks</span></Link></li>)}</ul><div className="flex flex-wrap gap-3"><Button asChild><Link href="/dashboard">View Dashboard</Link></Button><Button variant="outline" onClick={() => { setCreated(null); setTranscript(''); setError(''); setDetails([]); }}>Create Another</Button></div></Card>;
  return <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"><Card className="p-5 shadow-none sm:p-7"><form onSubmit={submit} className="space-y-5" aria-busy={busy}>
    <div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="transcript" className="text-base">Meeting transcript</Label><span className="text-xs text-muted-foreground">{transcript.length.toLocaleString()} / 100,000 characters</span></div>
    <Textarea id="transcript" className="min-h-[400px] resize-y leading-7" placeholder="Paste the meeting transcript here..." value={transcript} onChange={e => setTranscript(e.target.value)} maxLength={100000} required disabled={busy} aria-describedby="transcript-help" />
    <p id="transcript-help" className="text-sm leading-6 text-muted-foreground">Include project names, owners, final deadlines, and effort estimates. Each submission creates a new set of projects.</p>
    {error && <Alert><AlertTitle>Couldn’t create projects</AlertTitle><p className="leading-6">{error}</p>{details.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5">{details.slice(0, 12).map((detail, i) => <li key={i}>{detail}</li>)}</ul>}</Alert>}
    <Button type="submit" className="w-full" size="lg" disabled={busy || !transcript.trim()}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}{busy ? 'AI is processing the transcript…' : 'Create from Transcript'}</Button>
    {busy && <p role="status" className="text-center text-sm text-muted-foreground">Reading the discussion and preparing your project plan. This may take a moment.</p>}
  </form></Card><aside className="space-y-5"><Card className="p-6 shadow-none"><FileText className="mb-4 h-6 w-6 text-primary" /><h2 className="font-semibold">From discussion to delivery</h2><ol className="mt-5 space-y-5">{[
    ['Identify the projects', 'Keep each client engagement separate.'],
    ['Assign your team', 'Use the existing managers and developers.'],
    ['Capture final decisions', 'Save the agreed deadlines and task estimates.']
  ].map(([title, text], i) => <li key={title} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">{i + 1}</span><div><h3 className="text-sm font-medium">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div></li>)}</ol></Card><p className="px-2 text-sm leading-6 text-muted-foreground">The transcript is sent to the configured AI provider. Use the fictional meeting for your demo.</p></aside></div>;
}
