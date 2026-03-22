import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'staff')
  if (auth instanceof NextResponse) return auth
  const { user } = auth
  try {
    console.log('Staff events API called, user role:', auth.user.role)
    console.log('Executing SQL query...')
    
    const rows = auth.user.role === 'admin'
      ? await sql`
          SELECT se.*, u.name AS staff_name, u.email AS staff_email, u.phone AS staff_phone,
            e.title AS event_title, e.date AS event_date
          FROM staff_events se
          JOIN users u ON u.id = se.staff_id
          JOIN events e ON e.id = se.event_id
          JOIN guests g ON g.event_id = e.id
          LEFT JOIN invitations i ON i.guest_id = g.id
          ORDER BY e.date DESC`
      : await sql`
          SELECT 
            e.id as event_id,
            e.title AS event_title, 
            e.date AS event_date, 
            e.location AS event_location,
            e.description,
            COUNT(DISTINCT g.id)::int AS total_guests,
            COUNT(DISTINCT CASE WHEN i.scanned_at IS NOT NULL THEN i.id END)::int AS checked_in,
            CASE 
              WHEN EXISTS (
                SELECT 1 FROM staff_events se2 
                WHERE se2.event_id = e.id AND se2.staff_id = ${user.id}
              ) THEN true 
              ELSE false 
            END as assigned,
            (
              SELECT u.name 
              FROM staff_events se3 
              JOIN users u ON u.id = se3.staff_id 
              WHERE se3.event_id = e.id AND u.role = 'staff'
              LIMIT 1
            ) as assigned_to_name,
            (
              SELECT u.email 
              FROM staff_events se4 
              JOIN users u ON u.id = se4.staff_id 
              WHERE se4.event_id = e.id AND u.role = 'staff'
              LIMIT 1
            ) as assigned_to_email,
            (
              SELECT u.phone 
              FROM staff_events se5 
              JOIN users u ON u.id = se5.staff_id 
              WHERE se5.event_id = e.id AND u.role = 'staff'
              LIMIT 1
            ) as assigned_to_phone
          FROM events e
          LEFT JOIN guests g ON g.event_id = e.id
          LEFT JOIN invitations i ON i.guest_id = g.id
          -- WHERE e.date >= CURRENT_DATE::date 
          -- AND e.date <= (CURRENT_DATE::date + INTERVAL '2 days')
          -- Show all events temporarily to confirm database has data
          GROUP BY e.id, e.title, e.date, e.location, e.description
          ORDER BY e.date ASC, e.title ASC`
    
    console.log('SQL query executed, rows returned:', rows.length)
    console.log('First row sample:', rows[0])
    
    return NextResponse.json({ assignments: rows })
  } catch (err) { console.error(err); return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'staff')
  if (auth instanceof NextResponse) return auth
  try {
    const { event_id } = await req.json()
    
    if (!event_id)
      return NextResponse.json({ error: 'event_id required' }, { status: 400 })
    
    // Check if event is already assigned to another staff
    const [existingAssignment] = await sql`
      SELECT u.name as assigned_to, u.email as assigned_email
      FROM staff_events se
      JOIN users u ON u.id = se.staff_id
      WHERE se.event_id = ${event_id} AND u.role = 'staff'
      LIMIT 1
    `
    
    if (existingAssignment) {
      return NextResponse.json({ 
        error: 'Event already assigned to another staff member',
        assigned_to: existingAssignment.assigned_to,
        assigned_email: existingAssignment.assigned_email
      }, { status: 409 })
    }
    
    // Check if current staff is already assigned to any active event
    const currentAssignment = await sql`
      SELECT COUNT(*) as assignment_count
      FROM staff_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.staff_id = ${auth.user.id}
      AND e.date >= CURRENT_DATE::date 
      AND e.date <= (CURRENT_DATE::date + INTERVAL '2 days')
    `
    
    if (currentAssignment.length > 0 && currentAssignment[0].assignment_count > 0) {
      return NextResponse.json({ 
        error: 'You are already assigned to an event. Please leave your current event before taking a new one.',
        current_assignments: currentAssignment[0].assignment_count
      }, { status: 409 })
    }
    
    // Check if event is in the valid date range (today + 2 days)
    const eventCheck = await sql`
      SELECT title, date
      FROM events 
      WHERE id = ${event_id}
      AND date >= CURRENT_DATE::date 
      AND date <= (CURRENT_DATE::date + INTERVAL '2 days')
    `
    
    if (!eventCheck || eventCheck.length === 0) {
      return NextResponse.json({ 
        error: 'Event not found or not in valid date range (today + 2 days)' 
      }, { status: 404 })
    }
    
    // Assign event to current staff
    try {
      const [assignment] = await sql`
        INSERT INTO staff_events (staff_id, event_id)
        VALUES (${auth.user.id}, ${event_id})
        RETURNING *
      `
      
      return NextResponse.json({ 
        success: true,
        message: `Successfully assigned to "${eventCheck[0].title}"`,
        assignment: assignment
      }, { status: 201 })
    } catch (insertError) {
      console.error('Insert failed:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create assignment: ' + (insertError instanceof Error ? insertError.message : 'Unknown error')
      }, { status: 500 })
    }
  } catch (err) { 
    console.error(err); 
    return NextResponse.json({ error: 'Server error' }, { status: 500 }) 
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'staff')
  if (auth instanceof NextResponse) return auth
  try {
    const { event_id } = await req.json()
    
    if (!event_id) {
      return NextResponse.json({ error: 'event_id required' }, { status: 400 })
    }
    
    // Check if the staff is actually assigned to this event
    const [assignment] = await sql`
      SELECT se.*, e.title as event_title
      FROM staff_events se
      JOIN events e ON e.id = se.event_id
      WHERE se.staff_id = ${auth.user.id} AND se.event_id = ${event_id}
    `
    
    if (!assignment) {
      return NextResponse.json({ 
        error: 'You are not assigned to this event' 
      }, { status: 404 })
    }
    
    // Remove the assignment
    await sql`DELETE FROM staff_events WHERE staff_id=${auth.user.id} AND event_id=${event_id}`
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully left "${assignment.event_title}"`
    })
  } catch (err) { 
    console.error(err); 
    return NextResponse.json({ error: 'Server error' }, { status: 500 }) 
  }
}
