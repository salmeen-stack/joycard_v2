import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer', 'staff')
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    let whereClause = ''
    if (search) {
      whereClause = `WHERE e.title ILIKE '%${search}%' OR e.location ILIKE '%${search}%' OR e.date::text ILIKE '%${search}%'`
    }

    const events = await sql`
      SELECT e.*,
        COUNT(DISTINCT g.id)::int  AS total_guests,
        COUNT(DISTINCT CASE WHEN i.scanned_at IS NOT NULL THEN i.id END)::int AS checked_in
      FROM events e
      LEFT JOIN guests g ON g.event_id = e.id
      LEFT JOIN invitations i ON i.guest_id = g.id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.date DESC
    `
    return NextResponse.json({ events })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const { id, title, date, location, description } = await req.json()
    if (!id || !title || !date || !location)
      return NextResponse.json({ error: 'id, title, date, location required' }, { status: 400 })

    // Check if organizer owns this event
    if (user.role === 'organizer') {
      const [assignment] = await sql`
        SELECT 1 FROM organizer_assignments 
        WHERE organizer_id=${user.id} AND event_id=${id}
      `
      if (!assignment) {
        return NextResponse.json({ error: 'You can only edit your assigned events' }, { status: 403 })
      }
    }

    const rows = await sql`
      UPDATE events 
      SET title=${title}, date=${date}, location=${location}, description=${description ?? null}
      WHERE id=${id}
      RETURNING *
    `
    
    if (!rows.length) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json({ event: rows[0] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const { title, date, location, description, guest_limit = 50 } = await req.json()
    if (!title || !date || !location)
      return NextResponse.json({ error: 'title, date, location required' }, { status: 400 })

    const rows = await sql`
      INSERT INTO events (title, date, location, description)
      VALUES (${title}, ${date}, ${location}, ${description ?? null})
      RETURNING *
    `
    
    const event = rows[0]
    
    // If organizer created the event, automatically assign them
    if (user.role === 'organizer') {
      await sql`
        INSERT INTO organizer_assignments (organizer_id, event_id, guest_limit)
        VALUES (${user.id}, ${event.id}, ${guest_limit})
        ON CONFLICT DO NOTHING
      `
    }
    
    return NextResponse.json({ event }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
