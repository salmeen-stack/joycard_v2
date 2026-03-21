import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/signup', 
    '/admin/login',
    '/api/auth',
    '/api/debug', // Allow debug APIs for analysis
    '/api/invitations/verify', // Make sure invite verification API is public
    '/_next',
    '/favicon',
    '/uploads'
  ]

  // Check if path starts with any public path
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )

  // Invite paths are always public
  if (pathname.startsWith('/invite/')) {
    return NextResponse.next()
  }

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for auth cookies for protected paths
  const hasAdminCookie = req.cookies.get('joycard_admin_token')?.value
  const hasOrganizerCookie = req.cookies.get('joycard_organizer_token')?.value
  const hasStaffCookie = req.cookies.get('joycard_staff_token')?.value

  // Role-based path protection
  if (pathname.startsWith('/admin') && !hasAdminCookie) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
  if (pathname.startsWith('/organizer') && !hasOrganizerCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (pathname.startsWith('/staff') && !hasStaffCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // No auth cookie for other protected paths
  if (!hasAdminCookie && !hasOrganizerCookie && !hasStaffCookie) {
    const loginUrl = pathname.startsWith('/admin') ? '/admin/login' : '/login'
    return NextResponse.redirect(new URL(loginUrl, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
