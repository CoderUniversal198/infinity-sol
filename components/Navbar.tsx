'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutGrid, UsersRound, Sparkles, LogOut, Menu, X, Loader2 } from 'lucide-react';
import { Brand } from './Brand';
import { Button } from './ui/button';
import { cn, initials, roleLabel } from '@/lib/utils';
import type { SessionUser } from '@/lib/types';
export function Navbar({ user }: { user: SessionUser }) {
  const path = usePathname(); const router = useRouter();
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/dashboard/team', label: 'Team directory', icon: UsersRound },
    ...(user.role === 'ADMIN' ? [{ href: '/dashboard/transcript', label: 'Create from Transcript', icon: Sparkles }] : [])
  ];
  async function logout() {
    setBusy(true); setError('');
    try { const response = await fetch('/api/auth/logout', { method: 'POST' }); if (!response.ok) throw new Error(); router.replace('/login'); router.refresh(); }
    catch { setError('Could not log out. Try again.'); setBusy(false); }
  }
  const current = path.includes('/transcript') ? 'Create from Transcript' : path.includes('/team') ? 'Team directory' : path.includes('/projects/') ? 'Project details' : 'Dashboard';
  return <>
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:p-3">Skip to content</a>
    <div className="flex items-center justify-between border-b bg-[#151e35] p-5 lg:hidden"><Brand light /><Button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="workspace-nav" aria-label={open ? 'Close navigation' : 'Open navigation'} variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">{open ? <X /> : <Menu />}</Button></div>
    <aside id="workspace-nav" className={cn('z-30 flex-col bg-[#151e35] text-slate-300 lg:fixed lg:inset-y-0 lg:flex lg:w-64', open ? 'flex' : 'hidden')}>
      <div className="hidden px-6 py-8 lg:block"><Brand light /></div>
      <div className="px-4 pb-5 pt-5 lg:pt-9"><p className="eyebrow mb-4 px-3 text-slate-500">Workspace</p><nav aria-label="Main navigation" className="space-y-2">{links.map(({ href, label, icon: Icon }) => {
        const active = href === '/dashboard' ? path === href || path.startsWith('/dashboard/projects/') : path === href;
        return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors', active ? 'bg-[#2e3b59] text-white' : 'hover:bg-white/5 hover:text-white')}><Icon className={cn('h-5 w-5 shrink-0', active && 'text-[#9db2ff]')} />{label}</Link>;
      })}</nav></div>
      <div className="mt-auto border-t border-white/10 p-6"><p className="text-sm font-medium text-white">NovaWorks Technologies</p><p className="mt-1 text-sm text-slate-400">Lahore, Pakistan</p></div>
    </aside>
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b bg-white px-5 py-4 sm:px-8 lg:ml-64 lg:px-10">
      <div className="text-sm"><span className="hidden text-muted-foreground sm:inline">Workspace <span aria-hidden="true" className="mx-3 text-slate-300">/</span></span><span className="font-medium">{current}</span></div>
      <div className="flex items-center gap-3"><span className="avatar">{initials(user.name)}</span><div><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-muted-foreground">{roleLabel[user.role]}</p></div><Button onClick={logout} disabled={busy} variant="ghost" size="icon" className="ml-2 text-muted-foreground" aria-label="Log out">{busy ? <Loader2 className="animate-spin" /> : <LogOut />}</Button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>
    </header>
  </>;
}
