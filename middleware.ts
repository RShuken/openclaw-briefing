/**
 * RSH-190 — Server-side PIN protection for all routes
 *
 * Every request (page + API) must carry a valid `briefing_session` cookie.
 * The cookie value = SHA-256 hex of the ADMIN_PIN env var.
 *
 * Unauthenticated requests:
 *   - Page/HTML → redirect to /login
 *   - API → 401 JSON
 *
 * Excluded paths: /login, /api/auth (the login endpoint itself), /_next, /favicon.ico
 */

import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - /login (login page)
     * - /api/auth (auth endpoint)
     * - /_next (Next.js internals)
     * - /favicon.ico
     */
    '/((?!login|api/auth|_next|favicon\\.ico).*)',
  ],
};

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;

  // If ADMIN_PIN is not set, allow passthrough (dev/unconfigured)
  if (!adminPin) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('briefing_session')?.value;

  if (sessionCookie) {
    const expectedToken = await sha256(adminPin);
    if (sessionCookie === expectedToken) {
      return NextResponse.next();
    }
  }

  // Not authenticated
  const isApi = request.nextUrl.pathname.startsWith('/api/');

  if (isApi) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — PIN required' },
      { status: 401 }
    );
  }

  // Redirect to login page
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
