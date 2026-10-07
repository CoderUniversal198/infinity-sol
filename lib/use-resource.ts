'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export function useResource<T>(url: string) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null); const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(r => r + 1), []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setData(null);
    (async () => {
      try {
        const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
        if (response.status === 401) { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); router.refresh(); return; }
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load this page.');
        if (!controller.signal.aborted) setData(result);
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to connect. Please try again.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [url, revision, router]);
  return { data, error, loading, reload };
}
