import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken } from '@/lib/auth'
import { AUTH_COOKIE_NAME } from '@/lib/constants'

// Cookie names for different roles
const ROLE_COOKIES = {
  admin: 'joycard_admin_token',
  organizer: 'joycard_organizer_token', 
  staff: 'joycard_staff_token'
} as const

export function getRoleToken(req: NextRequest, role: 'admin' | 'organizer' | 'staff') {
  return req.cookies.get(ROLE_COOKIES[role])?.value
}

export function setRoleToken(response: NextResponse, user: any) {
  // Clear all existing role cookies first
  Object.values(ROLE_COOKIES).forEach(cookieName => {
    response.cookies.delete(cookieName)
  })
  
  // Set only the specific role cookie
  const token = signToken(user)
  response.cookies.set(ROLE_COOKIES[user.role as keyof typeof ROLE_COOKIES], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return response
}

export function clearAllRoleTokens(response: NextResponse) {
  Object.values(ROLE_COOKIES).forEach(cookieName => {
    response.cookies.delete(cookieName)
  })
  return response
}

export function getCurrentUser(req: NextRequest) {
  // Try to get token from any role cookie
  for (const [role, cookieName] of Object.entries(ROLE_COOKIES)) {
    const token = req.cookies.get(cookieName)?.value
    console.log(`Checking ${cookieName}:`, !!token)
    if (token) {
      try {
        const user = verifyToken(token)
        console.log(`Token verification for ${role}:`, !!user, user?.role)
        if (user && user.role === role) {
          console.log('Found valid user:', user)
          return user
        }
      } catch (error) {
        console.error(`Token verification error for ${role}:`, error instanceof Error ? error.message : String(error))
      }
    }
  }
  console.log('No valid user found')
  return null
}
