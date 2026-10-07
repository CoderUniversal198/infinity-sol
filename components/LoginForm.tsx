'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to log in. Please try again.');
      router.replace('/dashboard'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to connect. Please try again.'); setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-6" aria-busy={busy}>
    {error && <Alert>{error}</Alert>}
    <div className="space-y-2.5"><Label htmlFor="email">Email or username</Label><Input id="email" type="text" autoComplete="username" placeholder="Admin or your work email" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} /></div>
    <div className="space-y-2.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /></div>
    <Button className="w-full" size="lg" disabled={busy} type="submit">{busy ? <Loader2 className="animate-spin" /> : <LockKeyhole />} {busy ? 'Logging in…' : 'Log In'}</Button>
  </form>;
}
