import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'
import { hashPassword } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  try {
    const users = role
      ? await sql`SELECT id,name,email,phone,role,verified,created_at FROM users WHERE role=${role} ORDER BY name`
      : await sql`SELECT id,name,email,phone,role,verified,created_at FROM users ORDER BY role,name`
    return NextResponse.json({ users })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth
  try {
    const { name, email, phone, password, role } = await req.json()
    if (!name || !email || !phone || !password || !role)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    if (!['admin','organizer','staff'].includes(role))
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    if (password.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    const existing = await sql`SELECT id FROM users WHERE email=${email.toLowerCase().trim()}`
    if (existing.length) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    const hashed = await hashPassword(password)
    const verified = role === 'admin' // Only admins are auto-verified
    const rows = await sql`
      INSERT INTO users (name,email,phone,password,role,verified)
      VALUES (${name}, ${email.toLowerCase().trim()}, ${phone}, ${hashed}, ${role}, ${verified})
      RETURNING id,name,email,phone,role,verified,created_at
    `
    return NextResponse.json({ user: rows[0] }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
