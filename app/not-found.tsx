import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() { return <main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center"><p className="eyebrow text-primary">404</p><h1 className="page-title">Page not found</h1><p className="text-muted-foreground">This page may have moved or the link is incorrect.</p><Button asChild><Link href="/dashboard">Open dashboard</Link></Button></main>; }
