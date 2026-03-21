import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

// Public GET — guest invite card page
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const rows = await sql`
      SELECT i.*, g.name AS guest_name, g.contact, g.channel,
        e.title AS event_title, e.date AS event_date, e.location AS event_location, e.description
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      WHERE i.qr_token = ${params.token}
    `
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ invitation: rows[0] })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

// Staff POST — scan and check-in
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const auth = requireRole(req, 'admin', 'staff')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const rows = await sql`
      SELECT i.*, g.name AS guest_name, g.event_id,
        e.title AS event_title, e.date AS event_date
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      WHERE i.qr_token = ${params.token}
    `
    if (!rows.length) {
      return NextResponse.json({ valid: false, alreadyScanned: false, message: 'Invalid QR code — not recognised.' })
    }
    const inv = rows[0]

    // Staff can only scan events assigned to them
    if (user.role === 'staff') {
      const assigned = await sql`
        SELECT 1 FROM staff_events WHERE staff_id=${user.id} AND event_id=${inv.event_id}
      `
      if (!assigned.length) {
        return NextResponse.json({ valid: false, alreadyScanned: false, message: 'You are not assigned to this event.' })
      }
    }

    if (inv.scanned_at) {
      return NextResponse.json({
        valid: false, alreadyScanned: true,
        message: 'Already checked in. This QR code has already been used.',
        guest: { name: inv.guest_name, card_type: inv.card_type, dress_code: inv.dress_code, event_title: inv.event_title, scanned_at: inv.scanned_at },
      })
    }

    await sql`UPDATE invitations SET scanned_at=NOW() WHERE id=${inv.id}`
    return NextResponse.json({
      valid: true, alreadyScanned: false, message: 'Check-in successful!',
      guest: { name: inv.guest_name, card_type: inv.card_type, dress_code: inv.dress_code, event_title: inv.event_title },
    })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
