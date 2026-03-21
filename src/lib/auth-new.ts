import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Types
export type UserRole = 'admin' | 'organizer' | 'staff'

export interface JWTPayload {
  id: number
  email: string
  name: string
  role: UserRole
}

// Password helpers
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// JWT helpers
function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set in .env')
  return s
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JWTPayload
  } catch {
    return null
  }
}

// Constants
export const AUTH_COOKIE_NAME = 'joycard_token'
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
