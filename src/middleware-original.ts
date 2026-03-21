import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { AUTH_COOKIE_NAME } from '@/lib/constants'

// Paths that never require a token
const PUBLIC = ['/', '/login', '/signup', '/invite', '/admin/login']

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

  // Always allow public pages, static assets, and specific public API endpoints
  if (
    PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/invitations/verify') ||
    (pathname === '/api/invitations' && searchParams.get('token') !== null) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next()
  }

  // Read the auth cookie from the raw request headers (always reliable)
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    // Admin API routes → 401 (don't redirect APIs)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Decide which login page to send to
    const loginUrl = pathname.startsWith('/admin')
      ? '/admin/login'
      : '/login'
    return NextResponse.redirect(new URL(loginUrl, req.url))
  }

  const user = verifyToken(token)

  if (!user) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // For non-API routes, clear cookie and redirect to appropriate login
    const loginUrl = pathname.startsWith('/admin') ? '/admin/login' : '/login'
    const response = NextResponse.redirect(new URL(loginUrl, req.url))
    response.cookies.delete(AUTH_COOKIE_NAME)
    return response
  }

  // ── Role-based page protection ────────────────────────────
  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL(`/${user.role}`, req.url))
  }
  if (pathname.startsWith('/organizer') && user.role !== 'organizer') {
    return NextResponse.redirect(new URL(`/${user.role}`, req.url))
  }
  if (pathname.startsWith('/staff') && user.role !== 'staff') {
    return NextResponse.redirect(new URL(`/${user.role}`, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
