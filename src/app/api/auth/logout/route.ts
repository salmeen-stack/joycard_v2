import { NextRequest, NextResponse } from 'next/server'
import { clearAllRoleTokens } from '@/lib/sessionManager'

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    return clearAllRoleTokens(response)
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
