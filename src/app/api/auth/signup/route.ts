import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { setRoleToken } from '@/lib/sessionManager'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = body.name?.toString().trim()
    const email = body.email?.toString().toLowerCase().trim()
    const phone = body.phone?.toString().trim()
    const password = body.password?.toString()
    const role = body.role?.toString() // 'organizer' | 'staff'

    // Validation
    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, phone, password and role are required' },
        { status: 400 }
      )
    }

    if (!['organizer', 'staff'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Choose organizer or staff.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    
    const result = await sql`
      INSERT INTO users (name, email, phone, password, role)
      VALUES (${name}, ${email}, ${phone}, ${hashedPassword}, ${role})
      RETURNING id, name, email, phone, role
    `

    const user = result[0]

    // For organizers and staff, do NOT auto-login - they need verification
    if (role === 'organizer' || role === 'staff') {
      return NextResponse.json({ 
        success: true, 
        message: 'Account created successfully! Please wait for admin verification before logging in.',
        requiresVerification: true,
        user: { 
          id: user.id, 
          email: user.email 
        }
      })
    }

    // For admin (if implemented), auto-login
    const payload = { 
      id: user.id, 
      email: user.email,
      name: user.name,
      role: user.role
    }
    const token = signToken(payload)

    // Set cookie and respond
    const response = NextResponse.json({ 
      success: true, 
      message: 'Account created successfully!',
      requiresVerification: false,
      user: payload 
    })

    return setRoleToken(response, payload)

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    )
  }
}
