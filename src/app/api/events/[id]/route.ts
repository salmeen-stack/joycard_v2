import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole, requireAuth } from '@/lib/apiAuth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const eventId = parseInt(id)
  if (isNaN(eventId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  try {
    const rows = await sql`
      SELECT e.*,
        COUNT(DISTINCT g.id)::int AS total_guests,
        COUNT(DISTINCT CASE WHEN i.scanned_at IS NOT NULL THEN i.id END)::int AS checked_in
      FROM events e
      LEFT JOIN guests g ON g.event_id = e.id
      LEFT JOIN invitations i ON i.guest_id = g.id
      WHERE e.id = ${id}
      GROUP BY e.id
    `
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ event: rows[0] })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const eventId = parseInt(id)
  if (isNaN(eventId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  try {
    const { title, date, location, description } = await req.json()
    const rows = await sql`
      UPDATE events SET
        title       = COALESCE(${title       ?? null}, title),
        date        = COALESCE(${date        ?? null}, date),
        location    = COALESCE(${location    ?? null}, location),
        description = COALESCE(${description ?? null}, description)
      WHERE id = ${id} RETURNING *
    `
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ event: rows[0] })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const eventId = parseInt(id)
  if (isNaN(eventId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  try {
    await sql`DELETE FROM events WHERE id = ${eventId}`
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
