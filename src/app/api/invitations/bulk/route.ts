import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'
import { sendInvitationSms } from '@/lib/sms'
import { whatsappLink, whatsappMessage } from '@/lib/qr'
import { format } from 'date-fns'

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth

  try {
    const { invitation_ids, send_sms, send_whatsapp, template_id } = await req.json()
    
    if (!invitation_ids || !Array.isArray(invitation_ids) || invitation_ids.length === 0) {
      return NextResponse.json({ error: 'invitation_ids array required' }, { status: 400 })
    }

    if (!send_sms && !send_whatsapp) {
      return NextResponse.json({ error: 'At least one of send_sms or send_whatsapp must be true' }, { status: 400 })
    }

    // Fetch template if provided
    let templateContent = null
    if (template_id) {
      const [tmpl] = await sql`SELECT content FROM message_templates WHERE id = ${template_id}`
      if (tmpl) templateContent = tmpl.content
    }

    // Fetch all invitations
    const rows = await sql`
      SELECT i.*, g.name AS guest_name, g.contact, g.channel,
        e.title AS event_title, e.date AS event_date, e.location AS event_location
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      WHERE i.id = ANY(${invitation_ids})
    `

    if (!rows.length) {
      return NextResponse.json({ error: 'No invitations found' }, { status: 404 })
    }

    const base = 'https://joycardv2.vercel.app'
    const results = []

    for (const inv of rows) {
      const inviteUrl = `${base}/invite/${inv.qr_token}`
      const eventDate = format(new Date(inv.event_date), 'EEEE, MMMM d, yyyy')
      const finalCard = inv.card_type
      const finalDress = inv.dress_code

      let smsResult = null
      let waLink = null

      // Send SMS if requested and channel is SMS
      if (send_sms && inv.channel === 'sms') {
        smsResult = await sendInvitationSms(
          inv.contact,
          inv.guest_name,
          inv.event_title,
          inviteUrl,
          templateContent || undefined
        )
        
        // Track delivery status if columns exist
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
      }

      // Send WhatsApp if requested
      if (send_whatsapp) {
        const msg = whatsappMessage({
          guestName: inv.guest_name,
          eventTitle: inv.event_title,
          eventDate,
          eventLocation: inv.event_location,
          cardType: finalCard,
          dressCode: finalDress,
          inviteUrl,
        }, templateContent || undefined)
        waLink = whatsappLink(inv.contact, msg)
        await sql`UPDATE invitations SET sent_via_whatsapp=TRUE WHERE id=${inv.id}`
      }

      results.push({
        invitation_id: inv.id,
        guest_name: inv.guest_name,
        contact: inv.contact,
        channel: inv.channel,
        sms_sent: smsResult?.success || false,
        sms_status: smsResult?.status,
        sms_message: smsResult?.message,
        whatsapp_link: waLink
      })
    }

    const summary = {
      total: results.length,
      sms_sent: results.filter(r => r.sms_sent).length,
      sms_failed: results.filter(r => !r.sms_sent && send_sms && r.channel === 'sms').length,
      whatsapp_sent: results.filter(r => r.whatsapp_link).length
    }

    return NextResponse.json({ success: true, results, summary })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
