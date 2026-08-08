import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'
import { sendInvitationSms, formatPhoneNumber } from '@/lib/sms'
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
  console.log('🚀 PUT /api/invitations START')
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    console.log('📥 Request body:', JSON.stringify(body, null, 2))
    
    const { invitation_id, card_url, card_type, dress_code, send_sms, send_whatsapp, template_id } = body
    console.log('📋 Parsed parameters:', {
      invitation_id,
      card_url,
      card_type,
      dress_code,
      send_sms,
      send_whatsapp,
      template_id
    })
    
    if (!invitation_id) {
      console.error('❌ invitation_id required')
      return NextResponse.json({ error: 'invitation_id required' }, { status: 400 })
    }

    console.log('🔍 Fetching invitation from database...')
    const rows = await sql`
      SELECT i.*, g.name AS guest_name, g.contact, g.channel, g.phone,
        e.title AS event_title, e.date AS event_date, e.location AS event_location
      FROM invitations i
      JOIN guests g ON g.id = i.guest_id
      JOIN events e ON e.id = g.event_id
      WHERE i.id = ${invitation_id}
    `
    console.log('📦 Database query result:', JSON.stringify(rows, null, 2))
    
    if (!rows.length) {
      console.error('❌ Invitation not found')
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const inv = rows[0]
    console.log('✅ Invitation found:', {
      id: inv.id,
      guest_name: inv.guest_name,
      contact: inv.contact,
      channel: inv.channel,
      qr_token: inv.qr_token,
      sms_token: inv.sms_token
    })

    console.log('📝 Updating invitation card details...')
    await sql`
      UPDATE invitations SET
        card_url   = COALESCE(${card_url   ?? null}, card_url),
        card_type  = COALESCE(${card_type  ?? null}, card_type),
        dress_code = COALESCE(${dress_code ?? null}, dress_code)
      WHERE id = ${invitation_id}
    `
    console.log('✅ Invitation card details updated')

    // Force production URL for debugging
    const base = 'https://joycardv2.vercel.app'
    
    // Debug logging
    console.log('🌐 URL construction:', {
      base,
      APP_URL: process.env.APP_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
    })
    const inviteUrl = `${base}/invite/${inv.qr_token}`
    const eventDate = format(new Date(inv.event_date), 'EEEE, MMMM d, yyyy')
    const finalCard = card_type  ?? inv.card_type
    const finalDress = dress_code ?? inv.dress_code

    console.log('📋 Event details:', {
      inviteUrl,
      eventDate,
      finalCard,
      finalDress
    })

    // Fetch template if provided
    let templateContent = null
    if (template_id) {
      console.log('🔍 Fetching template with id:', template_id)
      const [tmpl] = await sql`SELECT content FROM message_templates WHERE id = ${template_id}`
      if (tmpl) {
        templateContent = tmpl.content
        console.log('✅ Template found:', templateContent)
      } else {
        console.log('⚠️ Template not found, will use default')
      }
    }

    let smsSent      = false
    let smsResult    = null
    let waLink: string | null = null

    if (send_sms && inv.channel === 'sms') {
      console.log('📱 SMS sending requested for SMS channel')
      console.log('📞 Original contact from database:', inv.contact)
      
      // Format phone number for SMS compatibility
      const formattedContact = formatPhoneNumber(inv.contact)
      console.log('📞 Formatted contact for SMS:', formattedContact)
      
      const tokenToSend = inv.sms_token || inv.qr_token
      console.log('🎫 Token to send:', tokenToSend)
      console.log('🎫 Token type:', inv.sms_token ? 'sms_token' : 'qr_token')
      
      console.log('⏳ Calling sendInvitationSms...')
      smsResult = await sendInvitationSms(
        formattedContact,
        inv.guest_name,
        inv.event_title,
        tokenToSend,
        templateContent || undefined,
        eventDate,
        inv.event_location,
        finalCard,
        finalDress
      )
      console.log('📦 sendInvitationSms result:', JSON.stringify(smsResult, null, 2))
      
      smsSent = smsResult.success
      console.log('📱 SMS sent status:', smsSent)
      
      // Track delivery status if columns exist
      try {
        console.log('💾 Updating invitation SMS delivery status...')
        await sql`
          UPDATE invitations 
          SET 
            sent_via_sms = TRUE,
            sms_delivery_status = ${smsResult.status},
            sms_delivery_message = ${smsResult.message},
            sms_sent_at = NOW()
          WHERE id = ${invitation_id}
        `
        console.log('✅ SMS delivery status updated')
      } catch (err) {
        // Columns might not exist yet, fallback to basic update
        console.log('⚠️ SMS tracking columns not available, using basic update')
        console.error('⚠️ Error updating tracking columns:', err)
        if (smsSent) {
          await sql`UPDATE invitations SET sent_via_sms=TRUE WHERE id=${invitation_id}`
          console.log('✅ Basic SMS status updated')
        }
      }
    } else {
      console.log('⏭️ SMS sending skipped:', {
        send_sms,
        channel: inv.channel,
        reason: !send_sms ? 'send_sms flag is false' : 'channel is not SMS'
      })
    }

    if (send_whatsapp) {
      console.log('💬 WhatsApp sending requested')
      const msg = whatsappMessage({
        guestName: inv.guest_name, eventTitle: inv.event_title,
        eventDate, eventLocation: inv.event_location,
        cardType: finalCard, dressCode: finalDress, inviteUrl
      }, templateContent || undefined)
      console.log('💬 WhatsApp message generated:', msg.substring(0, 100) + '...')
      waLink = whatsappLink(inv.contact, msg)
      console.log('💬 WhatsApp link:', waLink)
      await sql`UPDATE invitations SET sent_via_whatsapp=TRUE WHERE id=${invitation_id}`
      console.log('✅ WhatsApp status updated')
    }

    console.log('✅ PUT /api/invitations SUCCESS')
    console.log('📤 Returning response:', JSON.stringify({
      success: true,
      smsSent,
      smsResult,
      whatsappLink: waLink
    }, null, 2))
    
    return NextResponse.json({ success: true, smsSent, smsResult, whatsappLink: waLink })
  } catch (err) {
    console.error('❌ PUT /api/invitations ERROR')
    console.error('  - Error type:', err instanceof Error ? err.constructor.name : typeof err)
    console.error('  - Error message:', err instanceof Error ? err.message : String(err))
    console.error('  - Error stack:', err instanceof Error ? err.stack : 'No stack')
    console.error('  - Full error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
