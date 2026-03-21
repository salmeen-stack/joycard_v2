import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    let templates
    
    if (user.role === 'admin') {
      templates = await sql`
        SELECT * FROM email_templates
        ORDER BY created_at DESC
      `
    } else {
      templates = await sql`
        SELECT * FROM email_templates
        WHERE organizer_id = ${user.id} OR organizer_id IS NULL
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json({ templates })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const { name, subject, body } = await req.json()
    if (!name || !subject || !body) {
      return NextResponse.json({ error: 'name, subject, body required' }, { status: 400 })
    }

    const rows = await sql`
      INSERT INTO email_templates (name, subject, body, organizer_id)
      VALUES (${name}, ${subject}, ${body}, ${user.role === 'organizer' ? user.id : null})
      RETURNING *
    `
    
    return NextResponse.json({ template: rows[0] }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const { id, name, subject, body } = await req.json()
    if (!id || !name || !subject || !body) {
      return NextResponse.json({ error: 'id, name, subject, body required' }, { status: 400 })
    }

    // Check if organizer owns this template
    if (user.role === 'organizer') {
      const [template] = await sql`
        SELECT organizer_id FROM email_templates 
        WHERE id = ${id}
      `
      if (template && template.organizer_id && template.organizer_id !== user.id) {
        return NextResponse.json({ error: 'You can only edit your templates' }, { status: 403 })
      }
    }

    const rows = await sql`
      UPDATE email_templates 
      SET name = ${name}, subject = ${subject}, body = ${body}
      WHERE id = ${id}
      RETURNING *
    `
    
    if (!rows.length) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    
    return NextResponse.json({ template: rows[0] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  const { user } = auth

  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    // Check if organizer owns this template
    if (user.role === 'organizer') {
      const [template] = await sql`
        SELECT organizer_id FROM email_templates 
        WHERE id = ${id}
      `
      if (template && template.organizer_id && template.organizer_id !== user.id) {
        return NextResponse.json({ error: 'You can only delete your templates' }, { status: 403 })
      }
    }

    await sql`DELETE FROM email_templates WHERE id = ${id}`
    
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
