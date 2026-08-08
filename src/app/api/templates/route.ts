import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(req.url)
    const channel = searchParams.get('channel')

    let query = sql`SELECT * FROM message_templates ORDER BY is_default DESC, name ASC`
    
    if (channel && (channel === 'sms' || channel === 'whatsapp')) {
      query = sql`SELECT * FROM message_templates WHERE channel = ${channel} ORDER BY is_default DESC, name ASC`
    }

    const templates = await query
    return NextResponse.json({ templates })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const { name, channel, content, is_default } = await req.json()
    
    if (!name || !channel || !content) {
      return NextResponse.json({ error: 'name, channel, and content required' }, { status: 400 })
    }

    if (!['sms', 'whatsapp'].includes(channel)) {
      return NextResponse.json({ error: 'channel must be sms or whatsapp' }, { status: 400 })
    }

    // If setting as default, unset other defaults for this channel
    if (is_default) {
      await sql`UPDATE message_templates SET is_default = FALSE WHERE channel = ${channel}`
    }

    const [template] = await sql`
      INSERT INTO message_templates (name, channel, content, is_default)
      VALUES (${name}, ${channel}, ${content}, ${is_default || false})
      RETURNING *
    `

    return NextResponse.json({ template }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
