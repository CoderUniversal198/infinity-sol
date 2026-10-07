import { Loader2, TriangleAlert } from 'lucide-react';
import { Button } from './ui/button';
export function LoadingState() { return <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading your workspace…</div>; }
export function ErrorState({ error, retry }: { error: string; retry: () => void }) { return <div role="alert" className="rounded-xl border border-red-200 bg-white p-8"><TriangleAlert className="mb-4 h-6 w-6 text-red-600" /><h2 className="font-semibold">We couldn’t load this page</h2><p className="my-3 text-sm text-muted-foreground">{error}</p><Button onClick={retry} variant="outline">Try again</Button></div>; }
