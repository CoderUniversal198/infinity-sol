import { NextRequest } from 'next/server';
import { COOKIE_NAME } from '@/lib/jwt';
import { assertSameOrigin, json, errorResponse } from '@/lib/http';
export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const response = json({ success: true });
    response.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
    return response;
  } catch (error) { return errorResponse(error); }
}
