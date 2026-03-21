import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth
  try {
    const [stats] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM events)                                        AS total_events,
        (SELECT COUNT(*)::int FROM users WHERE role='organizer')                  AS total_organizers,
        (SELECT COUNT(*)::int FROM users WHERE role='staff')                      AS total_staff,
        (SELECT COUNT(*)::int FROM guests)                                        AS total_guests,
        (SELECT COUNT(*)::int FROM invitations WHERE sent_via_email OR sent_via_whatsapp) AS invitations_sent,
        (SELECT COUNT(*)::int FROM invitations WHERE scanned_at IS NOT NULL)      AS total_checked_in
    `
    const eventStats = await sql`
      SELECT e.id AS event_id, e.title AS event_title, e.date AS event_date,
        COUNT(DISTINCT g.id)::int AS total_guests,
        COUNT(DISTINCT CASE WHEN i.sent_via_email OR i.sent_via_whatsapp THEN i.id END)::int AS invitations_sent,
        COUNT(DISTINCT CASE WHEN i.scanned_at IS NOT NULL THEN i.id END)::int AS checked_in
      FROM events e
      LEFT JOIN guests g ON g.event_id = e.id
      LEFT JOIN invitations i ON i.guest_id = g.id
      GROUP BY e.id, e.title, e.date
      ORDER BY e.date DESC LIMIT 10
    `
    return NextResponse.json({ stats, eventStats })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
