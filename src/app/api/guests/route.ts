import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'
import { generateToken } from '@/lib/qr'
import { formatPhoneNumber } from '@/lib/sms'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer', 'staff')
  if (auth instanceof NextResponse) return auth
  const { user } = auth
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')

  try {
    let guests
    if (user.role === 'admin') {
      guests = eventId
        ? await sql`SELECT g.*, i.id AS inv_id, i.card_url, i.card_type, i.dress_code, i.qr_token, i.scanned_at, i.sent_via_sms, i.sent_via_whatsapp, i.sms_delivery_status, i.sms_delivery_message, e.title AS event_title FROM guests g LEFT JOIN invitations i ON i.guest_id=g.id LEFT JOIN events e ON e.id=g.event_id WHERE g.event_id=${eventId} ORDER BY g.created_at DESC`
        : await sql`SELECT g.*, i.id AS inv_id, i.card_url, i.card_type, i.dress_code, i.qr_token, i.scanned_at, i.sent_via_sms, i.sent_via_whatsapp, i.sms_delivery_status, i.sms_delivery_message, e.title AS event_title FROM guests g LEFT JOIN invitations i ON i.guest_id=g.id LEFT JOIN events e ON e.id=g.event_id ORDER BY g.created_at DESC`
    } else if (user.role === 'organizer') {
      guests = eventId
        ? await sql`SELECT g.*, i.id AS inv_id, i.card_url, i.card_type, i.dress_code, i.qr_token, i.scanned_at, i.sent_via_sms, i.sent_via_whatsapp, i.sms_delivery_status, i.sms_delivery_message FROM guests g LEFT JOIN invitations i ON i.guest_id=g.id WHERE g.event_id=${eventId} AND EXISTS (SELECT 1 FROM organizer_assignments oa WHERE oa.organizer_id=${user.id} AND oa.event_id=g.event_id) ORDER BY g.created_at DESC`
        : await sql`SELECT g.*, i.id AS inv_id, i.card_url, i.card_type, i.dress_code, i.qr_token, i.scanned_at, i.sent_via_sms, i.sent_via_whatsapp, i.sms_delivery_status, i.sms_delivery_message, e.title AS event_title FROM guests g LEFT JOIN invitations i ON i.guest_id=g.id LEFT JOIN events e ON e.id=g.event_id WHERE EXISTS (SELECT 1 FROM organizer_assignments oa WHERE oa.organizer_id=${user.id} AND oa.event_id=g.event_id) ORDER BY g.created_at DESC`
    } else {
      // staff — must provide event_id
      guests = eventId
        ? await sql`SELECT g.*, i.id AS inv_id, i.card_type, i.dress_code, i.qr_token, i.scanned_at FROM guests g LEFT JOIN invitations i ON i.guest_id=g.id WHERE g.event_id=${eventId} AND EXISTS (SELECT 1 FROM staff_events se WHERE se.staff_id=${user.id} AND se.event_id=g.event_id) ORDER BY g.name ASC`
        : []
    }
    return NextResponse.json({ guests })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const { event_id, name, contact, phone, channel, card_type, dress_code } = await req.json()
    if (!event_id || !name || !contact || !channel)
      return NextResponse.json({ error: 'event_id, name, contact, channel required' }, { status: 400 })

    if (user.role === 'organizer') {
      const [asgn] = await sql`
        SELECT oa.guest_limit, COUNT(g.id)::int AS current_count
        FROM organizer_assignments oa
        LEFT JOIN guests g ON g.event_id = oa.event_id
        WHERE oa.organizer_id=${user.id} AND oa.event_id=${event_id}
        GROUP BY oa.guest_limit
      `
      if (!asgn) return NextResponse.json({ error: 'Not assigned to this event' }, { status: 403 })
      if (asgn.current_count >= asgn.guest_limit)
        return NextResponse.json({ error: `Guest limit of ${asgn.guest_limit} reached` }, { status: 400 })
    }

    // Format phone number for SMS compatibility
    console.log('📞 Original contact:', contact)
    console.log('📞 Original phone:', phone)
    const formattedContact = formatPhoneNumber(contact)
    const formattedPhone = phone ? formatPhoneNumber(phone) : formattedContact
    console.log('📞 Formatted contact:', formattedContact)
    console.log('📞 Formatted phone:', formattedPhone)

    const [guest] = await sql`
      INSERT INTO guests (event_id, name, contact, phone, channel)
      VALUES (${event_id}, ${name}, ${formattedContact}, ${formattedPhone}, ${channel})
      RETURNING *
    `
    console.log('📞 Stored guest:', guest)
    const token = generateToken()
    const [invitation] = await sql`
      INSERT INTO invitations (guest_id, card_type, dress_code, qr_token)
      VALUES (${guest.id}, ${card_type ?? 'single'}, ${dress_code ?? 'Smart Casual'}, ${token})
      RETURNING *
    `
    return NextResponse.json({ guest, invitation }, { status: 201 })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
