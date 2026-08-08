import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'
import { sendInvitationSms } from '@/lib/sms'
import { whatsappLink, whatsappMessage } from '@/lib/qr'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token   = searchParams.get('token')
  const guestId = searchParams.get('guest_id')

  // Public token lookup (guest invite page — no auth)
  if (token) {
    try {
      const rows = await sql`
        SELECT i.*, g.name AS guest_name, g.contact, g.channel,
          e.title AS event_title, e.date AS event_date, e.location AS event_location
        FROM invitations i
        JOIN guests g ON g.id = i.guest_id
        JOIN events e ON e.id = g.event_id
        WHERE i.qr_token = ${token}
      `
      if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ invitation: rows[0] })
    } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
  }

  // Authenticated lookups
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth

  try {
    if (guestId) {
      const rows = await sql`
        SELECT i.*, g.name AS guest_name, g.contact, g.channel,
          e.title AS event_title, e.date AS event_date, e.location AS event_location
        FROM invitations i
        JOIN guests g ON g.id = i.guest_id
        JOIN events e ON e.id = g.event_id
        WHERE i.guest_id = ${guestId}
      `
      return NextResponse.json({ invitation: rows[0] ?? null })
    }
    const rows = await sql`
      SELECT i.*, g.name AS guest_name, g.contact, g.channel,
        e.title AS event_title, e.date AS event_date, e.location AS event_location
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      ORDER BY i.created_at DESC
    `
    return NextResponse.json({ invitations: rows })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth

  try {
    const { invitation_id, card_url, card_type, dress_code, send_sms, send_whatsapp, template_id } = await req.json()
    if (!invitation_id)
      return NextResponse.json({ error: 'invitation_id required' }, { status: 400 })

    const rows = await sql`
      SELECT i.*, g.name AS guest_name, g.contact, g.channel,
        e.title AS event_title, e.date AS event_date, e.location AS event_location
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      WHERE i.id = ${invitation_id}
    `
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const inv = rows[0]

    await sql`
      UPDATE invitations SET
        card_url   = COALESCE(${card_url   ?? null}, card_url),
        card_type  = COALESCE(${card_type  ?? null}, card_type),
        dress_code = COALESCE(${dress_code ?? null}, dress_code)
      WHERE id = ${invitation_id}
    `

    // Force production URL for debugging
    const base = 'https://joycardv2.vercel.app'
    
    // Debug logging
    console.log('API Base URL:', base, 'Env vars:', {
      APP_URL: process.env.APP_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
    })
    const inviteUrl = `${base}/invite/${inv.qr_token}`
    const eventDate = format(new Date(inv.event_date), 'EEEE, MMMM d, yyyy')
    const finalCard = card_type  ?? inv.card_type
    const finalDress = dress_code ?? inv.dress_code

    // Fetch template if provided
    let templateContent = null
    if (template_id) {
      const [tmpl] = await sql`SELECT content FROM message_templates WHERE id = ${template_id}`
      if (tmpl) templateContent = tmpl.content
    }

    let smsSent      = false
    let smsResult    = null
    let waLink: string | null = null

    if (send_sms && inv.channel === 'sms') {
      smsResult = await sendInvitationSms(
        inv.contact,
        inv.guest_name,
        inv.event_title,
        inviteUrl,
        templateContent || undefined
      )
      smsSent = smsResult.success
      
      // Track delivery status if columns exist
      try {
        await sql`
          UPDATE invitations 
          SET 
            sent_via_sms = TRUE,
            sms_delivery_status = ${smsResult.status},
            sms_delivery_message = ${smsResult.message},
            sms_sent_at = NOW()
          WHERE id = ${invitation_id}
        `
      } catch (err) {
        // Columns might not exist yet, fallback to basic update
        console.log('SMS tracking columns not available, using basic update')
        if (smsSent) await sql`UPDATE invitations SET sent_via_sms=TRUE WHERE id=${invitation_id}`
      }
    }

    if (send_whatsapp) {
      const msg = whatsappMessage({
        guestName: inv.guest_name, eventTitle: inv.event_title,
        eventDate, eventLocation: inv.event_location,
        cardType: finalCard, dressCode: finalDress, inviteUrl,
      }, templateContent || undefined)
      waLink = whatsappLink(inv.contact, msg)
      await sql`UPDATE invitations SET sent_via_whatsapp=TRUE WHERE id=${invitation_id}`
    }

    return NextResponse.json({ success: true, smsSent, smsResult, whatsappLink: waLink })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}
