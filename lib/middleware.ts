// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public auth routes to pass through
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Jira import doesn't need a logged-in session — it falls back to
  // JIRA_EMAIL / a fixed local owner when no session headers are present.
  if (pathname.startsWith('/api/jira-import')) {
    return NextResponse.next();
  }

  // 2. Extract token from cookie
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required. No token provided.' },
      { status: 401 }
    );
  }

  // 3. Verify JWT
  const payload = await verifyJWT(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token.' },
      { status: 401 }
    );
  }

  // 4. Forward authenticated request with user context in request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-account-type', payload.accountType ?? 'individual');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Config matcher: apply middleware only to /api routes
export const config = {
  matcher: ['/api/:path*'],
};