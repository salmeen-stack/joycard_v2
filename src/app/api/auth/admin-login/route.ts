import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { setRoleToken } from '@/lib/sessionManager'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email?.toString().toLowerCase().trim()
    const password = body.password?.toString()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find admin user
    const users = await sql`
      SELECT id, name, email, password, role, verified
      FROM users
      WHERE email = ${email} AND role = 'admin'
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // Check verification status (admin should be auto-verified)
    if (!user.verified) {
      return NextResponse.json(
        { error: 'Admin account is not verified. Please contact system administrator.' },
        { status: 403 }
      )
    }

    // Create JWT token
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
      user: payload 
    })

    return setRoleToken(response, payload)

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
    )
  }
}
