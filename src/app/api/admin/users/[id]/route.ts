import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'
import { hashPassword } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const userId = parseInt(id)
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  try {
    const { name, email, password, role } = await req.json()
    let rows
    if (password) {
      const hashed = await hashPassword(password)
      rows = await sql`UPDATE users SET name=COALESCE(${name??null},name), email=COALESCE(${email??null},email), password=${hashed}, role=COALESCE(${role??null},role) WHERE id=${userId} RETURNING id,name,email,role,created_at`
    } else {
      rows = await sql`UPDATE users SET name=COALESCE(${name??null},name), email=COALESCE(${email??null},email), role=COALESCE(${role??null},role) WHERE id=${userId} RETURNING id,name,email,role,created_at`
    }
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ user: rows[0] })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const userId = parseInt(id)
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  try {
    await sql`DELETE FROM users WHERE id = ${userId}`
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
