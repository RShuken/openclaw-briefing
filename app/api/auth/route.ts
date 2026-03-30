/**
 * POST /api/auth — Validate PIN and set session cookie
 * RSH-190 — Server-side PIN validation
 *
 * Accepts form-encoded or JSON body with { pin, next? }
 * On success: sets `briefing_session` cookie = sha256(ADMIN_PIN), redirects to `next`
 * On failure: redirects to /login?error=1
 */

export const runtime = 'edge';

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(request: Request) {
  const adminPin = process.env.ADMIN_PIN;

  if (!adminPin) {
    // No PIN configured — redirect to home (passthrough mode)
    return Response.redirect(new URL('/', request.url), 302);
  }

  let pin = '';
  let next = '/';

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    pin = (formData.get('pin') as string) || '';
    next = (formData.get('next') as string) || '/';
  } else {
    const body = await request.json().catch(() => ({})) as { pin?: string; next?: string };
    pin = body.pin || '';
    next = body.next || '/';
  }

  // Validate PIN
  if (pin !== adminPin) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', next);
    loginUrl.searchParams.set('error', '1');
    return Response.redirect(loginUrl.toString(), 302);
  }

  // PIN matches — set session cookie and redirect
  const token = await sha256(adminPin);
  const maxAge = 7 * 24 * 60 * 60; // 7 days

  const redirectUrl = new URL(next, request.url);
  const response = Response.redirect(redirectUrl.toString(), 302);

  // We need to create a new response to set headers
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `briefing_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
  );

  return new Response(null, {
    status: 302,
    headers,
  });
}
