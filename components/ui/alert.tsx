import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div role="alert" className={cn('relative w-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900', className)} {...props} />; }
export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h3 className={cn('mb-1 font-semibold', className)} {...props} />; }
export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) { return <p className={cn('leading-relaxed', className)} {...props} />; }
