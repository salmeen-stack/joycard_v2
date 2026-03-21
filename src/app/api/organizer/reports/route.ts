import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get('type') || 'overview'
    const eventId = searchParams.get('event_id')

    let report

    switch (reportType) {
      case 'overview':
        report = await generateOverviewReport(user.id, user.role)
        break
      case 'event-details':
        if (!eventId) {
          return NextResponse.json({ error: 'event_id required for event-details report' }, { status: 400 })
        }
        report = await generateEventDetailsReport(user.id, user.role, parseInt(eventId))
        break
      case 'attendance':
        report = await generateAttendanceReport(user.id, user.role)
        break
      case 'engagement':
        report = await generateEngagementReport(user.id, user.role)
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return NextResponse.json(report)
  } catch (err) {
    console.error('Report generation failed:', err)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

async function generateOverviewReport(userId: number, userRole: string) {
  const baseQuery = userRole === 'admin'
    ? sql`
        SELECT 
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT g.id) as total_guests,
          COUNT(DISTINCT CASE WHEN i.scanned_at IS NOT NULL THEN i.id END) as total_checked_in,
          COUNT(DISTINCT CASE WHEN i.sent_via_email = true OR i.sent_via_whatsapp = true THEN i.id END) as invitations_sent,
          COUNT(DISTINCT CASE WHEN i.card_type = 'double' THEN i.id END) as double_entries,
          COUNT(DISTINCT CASE WHEN i.card_type = 'single' THEN i.id END) as single_entries,
          AVG(CASE WHEN i.scanned_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (i.scanned_at - g.created_at))/60 
            ELSE NULL END) as avg_checkin_time_minutes
        FROM events e
        LEFT JOIN guests g ON g.event_id = e.id
        LEFT JOIN invitations i ON i.guest_id = g.id
      `
    : sql`
        SELECT 
          COUNT(DISTINCT e.id) as total_events,
          COUNT(DISTINCT g.id) as total_guests,
          COUNT(DISTINCT CASE WHEN i.scanned_at IS NOT NULL THEN i.id END) as total_checked_in,
          COUNT(DISTINCT CASE WHEN i.sent_via_email = true OR i.sent_via_whatsapp = true THEN i.id END) as invitations_sent,
          COUNT(DISTINCT CASE WHEN i.card_type = 'double' THEN i.id END) as double_entries,
          COUNT(DISTINCT CASE WHEN i.card_type = 'single' THEN i.id END) as single_entries,
          AVG(CASE WHEN i.scanned_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (i.scanned_at - g.created_at))/60 
            ELSE NULL END) as avg_checkin_time_minutes
        FROM organizer_assignments oa
        JOIN events e ON e.id = oa.event_id
        LEFT JOIN guests g ON g.event_id = e.id
        LEFT JOIN invitations i ON i.guest_id = g.id
        WHERE oa.organizer_id = ${userId}
      `

  const overview = await baseQuery
  return { type: 'overview', data: overview[0] }
}

async function generateEventDetailsReport(userId: number, userRole: string, eventId: number) {
  // Verify access to event
  if (userRole === 'organizer') {
    const [assignment] = await sql`
      SELECT 1 FROM organizer_assignments 
      WHERE organizer_id = ${userId} AND event_id = ${eventId}
    `
    if (!assignment) {
      throw new Error('Access denied to this event')
    }
  }

  const details = await sql`
    SELECT 
      e.title,
      e.date,
      e.location,
      e.description,
      COUNT(g.id) as total_guests,
      COUNT(CASE WHEN i.scanned_at IS NOT NULL THEN i.id END) as checked_in,
      COUNT(CASE WHEN i.sent_via_email = true OR i.sent_via_whatsapp = true THEN i.id END) as invitations_sent,
      COUNT(CASE WHEN i.card_type = 'double' THEN i.id END) as double_entries,
      COUNT(CASE WHEN i.card_type = 'single' THEN i.id END) as single_entries,
      COUNT(CASE WHEN g.channel = 'email' THEN g.id END) as email_guests,
      COUNT(CASE WHEN g.channel = 'whatsapp' THEN g.id END) as whatsapp_guests
    FROM events e
    LEFT JOIN guests g ON g.event_id = e.id
    LEFT JOIN invitations i ON i.guest_id = g.id
    WHERE e.id = ${eventId}
    GROUP BY e.id, e.title, e.date, e.location, e.description
  `

  // Hourly check-in pattern
  const checkInPattern = await sql`
    SELECT 
      EXTRACT(HOUR FROM i.scanned_at) as hour,
      COUNT(*) as checkins
    FROM invitations i
    JOIN guests g ON g.guest_id = g.id
    WHERE i.scanned_at IS NOT NULL 
    AND g.event_id = ${eventId}
    GROUP BY EXTRACT(HOUR FROM i.scanned_at)
    ORDER BY hour
  `

  return {
    type: 'event-details',
    data: details[0],
    checkInPattern: checkInPattern
  }
}

async function generateAttendanceReport(userId: number, userRole: string) {
  const baseWhere = userRole === 'admin' ? '' : `WHERE oa.organizer_id = ${userId}`

  const attendance = await sql`
    SELECT 
      e.title as event_title,
      e.date as event_date,
      COUNT(g.id) as total_guests,
      COUNT(CASE WHEN i.scanned_at IS NOT NULL THEN i.id END) as checked_in,
      ROUND(COUNT(CASE WHEN i.scanned_at IS NOT NULL THEN i.id END) * 100.0 / NULLIF(COUNT(g.id), 0), 2) as checkin_rate,
      COUNT(CASE WHEN i.scanned_at IS NULL THEN i.id END) as no_shows
    FROM events e
    LEFT JOIN organizer_assignments oa ON oa.event_id = e.id
    LEFT JOIN guests g ON g.event_id = e.id
    LEFT JOIN invitations i ON i.guest_id = g.id
    ${baseWhere}
    GROUP BY e.id, e.title, e.date
    ORDER BY e.date DESC
  `

  return { type: 'attendance', data: attendance }
}

async function generateEngagementReport(userId: number, userRole: string) {
  const baseWhere = userRole === 'admin' ? '' : `WHERE oa.organizer_id = ${userId}`

  const engagement = await sql`
    SELECT 
      COUNT(CASE WHEN i.sent_via_email = true THEN i.id END) as emails_sent,
      COUNT(CASE WHEN i.sent_via_whatsapp = true THEN i.id END) as whatsapp_sent,
      COUNT(CASE WHEN i.sent_via_email = false AND i.sent_via_whatsapp = false THEN i.id END) as pending_invitations,
      COUNT(CASE WHEN i.scanned_at IS NOT NULL THEN i.id END) as total_checkins,
      COUNT(CASE WHEN i.scanned_at IS NOT NULL AND i.sent_via_email = true THEN i.id END) as email_checkins,
      COUNT(CASE WHEN i.scanned_at IS NOT NULL AND i.sent_via_whatsapp = true THEN i.id END) as whatsapp_checkins
    FROM organizer_assignments oa
    JOIN events e ON e.id = oa.event_id
    LEFT JOIN guests g ON g.event_id = e.id
    LEFT JOIN invitations i ON i.guest_id = g.id
    ${baseWhere}
  `

  return { type: 'engagement', data: engagement[0] }
}
