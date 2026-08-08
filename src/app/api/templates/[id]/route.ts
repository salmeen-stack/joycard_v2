import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth

  try {
    const { name, channel, content, is_default } = await req.json()
    const templateId = parseInt(params.id)

    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 })
    }

    // If setting as default, unset other defaults for this channel
    if (is_default && channel) {
      await sql`UPDATE message_templates SET is_default = FALSE WHERE channel = ${channel} AND id != ${templateId}`
    }

    const [template] = await sql`
      UPDATE message_templates
      SET 
        name = COALESCE(${name}, name),
        channel = COALESCE(${channel}, channel),
        content = COALESCE(${content}, content),
        is_default = COALESCE(${is_default}, is_default),
        updated_at = NOW()
      WHERE id = ${templateId}
      RETURNING *
    `

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth

  try {
    const templateId = parseInt(params.id)

    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 })
    }

    const [template] = await sql`
      DELETE FROM message_templates WHERE id = ${templateId} RETURNING *
    `

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
