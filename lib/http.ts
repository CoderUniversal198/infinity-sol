import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './errors';
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
export function errorResponse(error: unknown) {
  if (error instanceof AppError) return json({ error: error.message, ...(error.details ? { details: error.details } : {}) }, error.status);
  // Do not return provider responses, database details, credentials, or transcripts.
  console.error('NovaWorks request failed:', error instanceof Error ? error.name : 'Unknown error');
  return json({ error: 'Something went wrong. Please try again.' }, 500);
}
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const expected = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : req.nextUrl.origin;
  if (req.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== expected)) {
    throw new AppError(403, 'Cross-site requests are not allowed.');
  }
}
export async function readJson(req: NextRequest, maxBytes = 150000): Promise<unknown> {
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new AppError(415, 'Send application/json.');
  const declaredLength = Number(req.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) throw new AppError(413, 'Request is too large.');
  const reader = req.body?.getReader();
  if (!reader) throw new AppError(400, 'Request body is required.');
  const parts: Uint8Array[] = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new AppError(413, 'Request is too large.'); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AppError(400, 'Invalid JSON request.'); }
}
