import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    let analytics
    
    if (user.role === 'admin') {
      // Admin sees all events
      analytics = await sql`
        SELECT 
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT g.id) as total_guests,
          COUNT(DISTINCT CASE WHEN i.scanned_at IS NOT NULL THEN i.id END) as total_checked_in,
          COUNT(DISTINCT CASE WHEN i.sent_via_email = true OR i.sent_via_whatsapp = true THEN i.id END) as total_invitations_sent,
          COUNT(DISTINCT CASE WHEN i.sent_via_email = false AND i.sent_via_whatsapp = false THEN i.id END) as total_invitations_pending
        FROM events e
        LEFT JOIN guests g ON g.event_id = e.id
        LEFT JOIN invitations i ON i.guest_id = g.id
      `
    } else {
      // Organizer sees only their assigned events
      analytics = await sql`
        SELECT 
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT g.id) as total_guests,
          COUNT(DISTINCT CASE WHEN i.scanned_at IS NOT NULL THEN i.id END) as total_checked_in,
          COUNT(DISTINCT CASE WHEN i.sent_via_email = true OR i.sent_via_whatsapp = true THEN i.id END) as total_invitations_sent,
          COUNT(DISTINCT CASE WHEN i.sent_via_email = false AND i.sent_via_whatsapp = false THEN i.id END) as total_invitations_pending
        FROM organizer_assignments oa
        JOIN events e ON e.id = oa.event_id
        LEFT JOIN guests g ON g.event_id = e.id
        LEFT JOIN invitations i ON i.guest_id = g.id
        WHERE oa.organizer_id = ${user.id}
      `
    }

    // Get recent activity
    const recentActivity = user.role === 'admin'
      ? await sql`
          SELECT 
            e.title as event_title,
            g.name as guest_name,
            g.created_at as guest_added,
            i.sent_via_email,
            i.sent_via_whatsapp,
            i.scanned_at
          FROM guests g
          LEFT JOIN events e ON e.id = g.event_id
          LEFT JOIN invitations i ON i.guest_id = g.id
          ORDER BY g.created_at DESC
          LIMIT 10
        `
      : await sql`
          SELECT 
            e.title as event_title,
            g.name as guest_name,
            g.created_at as guest_added,
            i.sent_via_email,
            i.sent_via_whatsapp,
            i.scanned_at
          FROM organizer_assignments oa
          JOIN guests g ON g.event_id = oa.event_id
          LEFT JOIN events e ON e.id = g.event_id
          LEFT JOIN invitations i ON i.guest_id = g.id
          WHERE oa.organizer_id = ${user.id}
          ORDER BY g.created_at DESC
          LIMIT 10
        `

    return NextResponse.json({
      analytics: analytics[0],
      recentActivity
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
