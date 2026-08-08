import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'
import { sendInvitationSms, formatPhoneNumber } from '@/lib/sms'
import { format } from 'date-fns'

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth

  try {
    const { event_id, reminder_type, template_id, guest_filter } = await req.json()
    
    if (!event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 })
    }

    if (!reminder_type || !['event', 'contribution'].includes(reminder_type)) {
      return NextResponse.json({ error: 'reminder_type must be "event" or "contribution"' }, { status: 400 })
    }

    // Fetch template if provided
    let templateContent = null
    if (template_id) {
      const [tmpl] = await sql`SELECT content FROM message_templates WHERE id = ${template_id} AND channel = 'sms'`
      if (tmpl) templateContent = tmpl.content
    }

    // Build query based on guest filter
    let query = sql`
      SELECT i.*, g.name AS guest_name, g.contact, g.channel,
        e.title AS event_title, e.date AS event_date, e.location AS event_location
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      WHERE g.event_id = ${event_id}
    `

    // Apply guest filters
    if (guest_filter) {
      if (guest_filter.channel === 'sms') {
        query = sql`
          SELECT i.*, g.name AS guest_name, g.contact, g.channel,
            e.title AS event_title, e.date AS event_date, e.location AS event_location
          FROM invitations i
          JOIN guests g ON g.id = i.guest_id
          JOIN events e ON e.id = g.event_id
          WHERE g.event_id = ${event_id} AND g.channel = 'sms'
        `
      } else if (guest_filter.channel === 'whatsapp') {
        query = sql`
          SELECT i.*, g.name AS guest_name, g.contact, g.channel,
            e.title AS event_title, e.date AS event_date, e.location AS event_location
          FROM invitations i
          JOIN guests g ON g.id = i.guest_id
          JOIN events e ON e.id = g.event_id
          WHERE g.event_id = ${event_id} AND g.channel = 'whatsapp'
        `
      }
      if (guest_filter.status === 'not_sent') {
        query = sql`
          SELECT i.*, g.name AS guest_name, g.contact, g.channel,
            e.title AS event_title, e.date AS event_date, e.location AS event_location
          FROM invitations i
          JOIN guests g ON g.id = i.guest_id
          JOIN events e ON e.id = g.event_id
          WHERE g.event_id = ${event_id} AND (i.sent_via_sms IS NULL OR i.sent_via_sms = FALSE)
        `
      }
    }

    const rows = await query

    if (!rows.length) {
      return NextResponse.json({ error: 'No guests found for this event' }, { status: 404 })
    }

    const results = []

    for (const inv of rows) {
      // Only send SMS to SMS channel guests
      if (inv.channel !== 'sms') {
        results.push({
          invitation_id: inv.id,
          guest_name: inv.guest_name,
          contact: inv.contact,
          channel: inv.channel,
          sms_sent: false,
          sms_status: 'skipped',
          sms_message: 'Guest channel is not SMS'
        })
        continue
      }

      const eventDate = format(new Date(inv.event_date), 'EEEE, MMMM d, yyyy')
      const finalCard = inv.card_type
      const finalDress = inv.dress_code

      // Format phone number for SMS compatibility
      const formattedContact = formatPhoneNumber(inv.contact)
      
      // Use default template if none provided
      const defaultMessage = reminder_type === 'event' 
        ? `Hi {guest_name}! Reminder: {event_title} is on {event_date} at {event_location}. See you there!`
        : `Hi {guest_name}! Reminder about contribution for {event_title}. Please arrange your contribution. Thank you!`

      const smsResult = await sendInvitationSms(
        formattedContact,
        inv.guest_name,
        inv.event_title,
        inv.sms_token || inv.qr_token,
        templateContent || defaultMessage,
        eventDate,
        inv.event_location,
        finalCard,
        finalDress
      )
      
      // Track delivery status
      try {
        await sql`
          UPDATE invitations 
          SET 
            sent_via_sms = TRUE,
            sms_delivery_status = ${smsResult.status},
            sms_delivery_message = ${smsResult.message},
            sms_sent_at = NOW()
          WHERE id = ${inv.id}
        `
      } catch (err) {
        // Columns might not exist yet, fallback to basic update
        if (smsResult.success) {
          await sql`UPDATE invitations SET sent_via_sms=TRUE WHERE id=${inv.id}`
        }
      }

      results.push({
        invitation_id: inv.id,
        guest_name: inv.guest_name,
        contact: inv.contact,
        channel: inv.channel,
        sms_sent: smsResult.success,
        sms_status: smsResult.status,
        sms_message: smsResult.message
      })
    }

    const summary = {
      total: results.length,
      sms_sent: results.filter(r => r.sms_sent).length,
      sms_failed: results.filter(r => !r.sms_sent && r.sms_status !== 'skipped').length,
      sms_skipped: results.filter(r => r.sms_status === 'skipped').length
    }

    return NextResponse.json({ success: true, results, summary })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
