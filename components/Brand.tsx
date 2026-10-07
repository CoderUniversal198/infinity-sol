import { cn } from '@/lib/utils';
export function Brand({ light = false }: { light?: boolean }) {
  return <div className="flex items-center gap-3"><span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white">N</span><div><p className={cn('text-lg font-semibold tracking-tight', light && 'text-white')}>NovaWorks<span className={cn('ml-1 text-xs font-medium', light ? 'text-slate-400' : 'text-muted-foreground')}>CRM</span></p><p className={cn('text-xs', light ? 'text-slate-400' : 'text-muted-foreground')}>Project workspace</p></div></div>;
}
