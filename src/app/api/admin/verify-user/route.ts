import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireRole } from '@/lib/apiAuth'

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin')
  if (auth instanceof NextResponse) return auth

  try {
    const { user_id, verified } = await req.json()

    if (!user_id || typeof verified !== 'boolean') {
      return NextResponse.json({
        error: 'user_id and verified status are required'
      }, { status: 400 })
    }

    // Update user verification status
    await sql`
      UPDATE users 
      SET verified = ${verified}
      WHERE id = ${user_id}
    `

    return NextResponse.json({
      success: true,
      message: verified ? 'User verified successfully' : 'User verification revoked'
    })

  } catch (error) {
    console.error('Verify user failed:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
