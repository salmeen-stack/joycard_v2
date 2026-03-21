import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, JWTPayload, UserRole } from './auth'
import { getCurrentUser } from './sessionManager'

export function getRequestUser(req: NextRequest): JWTPayload | null {
  return getCurrentUser(req)
}

export function requireAuth(req: NextRequest): { user: JWTPayload } | NextResponse {
  const user = getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return { user }
}

export function requireRole(
  req: NextRequest,
  ...roles: UserRole[]
): { user: JWTPayload } | NextResponse {
  const user = getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { user }
}
