import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { JWTPayload, verifyPassword, signToken } from '@/lib/auth'
import { setRoleToken } from '@/lib/sessionManager'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email?.toString().toLowerCase().trim()
    const password = body.password?.toString()
    const role = body.role?.toString() // 'organizer' | 'staff'

    // Validation
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password and role are required' },
        { status: 400 }
      )
    }

    if (!['organizer', 'staff'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Choose organizer or staff.' },
        { status: 400 }
      )
    }

    // Find user
    const users = await sql`
      SELECT id, name, email, password, role, verified
      FROM users
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check role match
    if (user.role !== role) {
      return NextResponse.json(
        { error: `This account is not registered as ${role}. Please select the correct role.` },
        { status: 403 }
      )
    }

    // Check verification status (only for staff and organizer)
    if (['staff', 'organizer'].includes(user.role) && !user.verified) {
      return NextResponse.json(
        { error: 'Your account is pending verification. Please contact an administrator to activate your account.' },
        { status: 403 }
      )
    }

    // Create JWT token
    const payload = { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role,
      verified: user.verified
    }
    const token = signToken(payload)

    // Set cookie and respond
    const response = NextResponse.json({ 
      success: true, 
      user: payload 
    })

    return setRoleToken(response, payload)

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    )
  }
}
