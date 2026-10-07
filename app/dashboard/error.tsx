'use client';
import { ErrorState } from '@/components/ResourceState';
export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <ErrorState error="Your workspace could not be loaded. Please try again." retry={reset} />; }
