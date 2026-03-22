import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth
  
  // Get role parameter from query
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  
  try {
    let rows
    if (user.role === 'admin') {
      rows = role === 'staff' 
        ? await sql`
            SELECT se.*, u.name AS staff_name, u.email AS staff_email, u.phone AS staff_phone,
                  e.title AS event_title, e.date AS event_date
            FROM staff_events se
            JOIN users u ON u.id = se.staff_id
            JOIN events e ON e.id = se.event_id
            ORDER BY e.date DESC`
        : await sql`
            SELECT oa.*, u.name AS organizer_name, u.email AS organizer_email,
                  e.title AS event_title, e.date AS event_date
            FROM organizer_assignments oa
            JOIN users u ON u.id = oa.organizer_id
            JOIN events e ON e.id = oa.event_id
            ORDER BY e.date DESC`
    } else {
      rows = role === 'staff'
        ? await sql`
            SELECT se.*, u.name AS staff_name, u.email AS staff_email, u.phone AS staff_phone,
                  e.title AS event_title, e.date AS event_date
            FROM staff_events se
            JOIN users u ON u.id = se.staff_id
            JOIN events e ON e.id = se.event_id
            ORDER BY e.date DESC`
        : await sql`
            SELECT oa.*, e.title AS event_title, e.date AS event_date, e.location AS event_location,
                  COUNT(g.id)::int AS guests_added
            FROM organizer_assignments oa
            JOIN events e ON e.id = oa.event_id
            LEFT JOIN guests g ON g.event_id = e.id
            WHERE oa.organizer_id = ${user.id}
            GROUP BY oa.id, e.title, e.date, e.location
            ORDER BY e.date DESC`
    }
    
    return NextResponse.json({ assignments: rows })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth
  try {
    const { organizer_id, event_id, guest_limit } = await req.json()
    if (!organizer_id || !event_id || !guest_limit)
      return NextResponse.json({ error: 'organizer_id, event_id, guest_limit required' }, { status: 400 })
    const rows = await sql`
      INSERT INTO organizer_assignments (organizer_id, event_id, guest_limit)
      VALUES (${organizer_id}, ${event_id}, ${guest_limit})
      ON CONFLICT (organizer_id, event_id) DO UPDATE SET guest_limit=${guest_limit}
      RETURNING *
    `
    return NextResponse.json({ assignment: rows[0] }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth
  try {
    const { organizer_id, event_id } = await req.json()
    await sql`DELETE FROM organizer_assignments WHERE organizer_id=${organizer_id} AND event_id=${event_id}`
    return NextResponse.json({ success: true })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
