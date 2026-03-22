import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const guestId = parseInt(id)
  if (isNaN(guestId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  try {
    await sql`DELETE FROM guests WHERE id = ${guestId}`
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
