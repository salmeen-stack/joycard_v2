import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// ── Types ─────────────────────────────────────────────────────
export type UserRole = 'admin' | 'organizer' | 'staff'

export interface JWTPayload {
  id: number
  email: string
  name: string
  role: UserRole
  verified?: boolean
}

// ── Password helpers ──────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ── JWT helpers ───────────────────────────────────────────────
// IMPORTANT: getSecret() is called INSIDE each function — never at
// module-load scope. If JWT_SECRET is missing and we throw at the top
// level, middleware (which imports this file) crashes on every request,
// creating an infinite redirect loop to /login with no visible error.
function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set in .env.local')
  return s
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = getSecret()
    console.log('Verifying token with secret length:', secret.length)
    console.log('Token preview:', token.substring(0, 50) + '...')
    const decoded = jwt.verify(token, secret) as JWTPayload
    console.log('Token decoded successfully:', decoded)
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// ── NOTE ON COOKIES ───────────────────────────────────────────
// Cookie writing/clearing is done with response.cookies.set() directly
// on the NextResponse object in each Route Handler.
// cookies().set() from next/headers silently fails in Route Handlers
// (the cookie never reaches the browser). Never use it for writes.
