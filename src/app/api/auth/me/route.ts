import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/sessionManager'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = getCurrentUser(req)
    
    if (!user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({
      error: 'Server error'
    }, { status: 500 })
  }
}
