// ── Phone Number Formatting Helper ─────────────────────────────
export function formatPhoneNumber(phone: string): string {
  console.log('📞 formatPhoneNumber input:', phone)
  
  // Remove all non-digit characters
  let formatted = phone.replace(/[^\d]/g, '').trim()
  console.log('📞 After removing non-digits:', formatted)
  
  // Remove leading 0 if present (common in local formats like 0712...)
  if (formatted.startsWith('0')) {
    formatted = formatted.substring(1)
    console.log('📞 After removing leading 0:', formatted)
  }
  
  // Ensure Tanzania country code if missing (assuming Tanzania numbers)
  // If number is 9 digits after removing leading 0, add 255
  if (formatted.length === 9 && !formatted.startsWith('255')) {
    formatted = '255' + formatted
    console.log('📞 After adding country code:', formatted)
  }
  
  console.log('📞 formatPhoneNumber output:', formatted)
  return formatted
}

// ── RafikiSMS Integration ─────────────────────────────────────

const API_BASE = 'https://api.rafikisms.com'

export interface SendSmsOptions {
  phone: string
  message: string
  senderId?: string
}

export interface SendSmsResponse {
  success: boolean
  status: string
  message: string
  data?: {
    message: string
    recipient?: string
    note?: string
  }
  error_code?: string
}

export async function sendSms(options: SendSmsOptions): Promise<SendSmsResponse> {
  console.log('🚀 sendSms START')
  console.log('📥 Input options:', JSON.stringify(options, null, 2))
  
  const apiKey = process.env.RAFIKI_API_KEY
  const senderId = options.senderId || process.env.RAFIKI_SENDER_ID

  console.log('🔑 Environment variables check:')
  console.log('  - RAFIKI_API_KEY exists:', !!apiKey)
  console.log('  - RAFIKI_API_KEY length:', apiKey?.length)
  console.log('  - RAFIKI_API_KEY prefix:', apiKey?.substring(0, 8) + '...')
  console.log('  - RAFIKI_SENDER_ID exists:', !!process.env.RAFIKI_SENDER_ID)
  console.log('  - RAFIKI_SENDER_ID value:', process.env.RAFIKI_SENDER_ID)
  console.log('  - senderId used:', senderId)

  if (!apiKey) {
    console.error('❌ RAFIKI_API_KEY is not set in environment variables')
    throw new Error('RAFIKI_API_KEY is not set in environment variables')
  }

  // Format phone number for RafikiSMS
  const phone = formatPhoneNumber(options.phone)
  
  // Log the formatted phone number
  console.log('📞 Phone number formatted:', {
    original: options.phone,
    formatted: phone
  })

  const requestBody = {
    phone,
    message: options.message,
    sender_id: senderId,
  }
  
  console.log('📤 Request to RafikiSMS API:')
  console.log('  - URL:', `${API_BASE}/v1/vendor/send-sms`)
  console.log('  - Method: POST')
  console.log('  - Headers: Content-Type: application/json, X-API-Key: [HIDDEN]')
  console.log('  - Body:', JSON.stringify(requestBody, null, 2))

  console.log('⏳ Calling RafikiSMS API...')
  const response = await fetch(`${API_BASE}/v1/vendor/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(requestBody),
  })

  console.log('📡 RafikiSMS Response status:', response.status)
  console.log('📡 RafikiSMS Response ok:', response.ok)

  const data = await response.json()
  console.log('📦 RafikiSMS Response body:', JSON.stringify(data, null, 2))

  if (!response.ok) {
    console.error('❌ RafikiSMS API error')
    console.error('  - Status:', response.status)
    console.error('  - StatusText:', response.statusText)
    console.error('  - Error message:', data.message || 'Unknown error')
    console.error('  - Error code:', data.error_code)
    console.error('  - Full response:', JSON.stringify(data, null, 2))
    throw new Error(`RafikiSMS error: ${data.message || 'Unknown error'}`)
  }

  console.log('✅ sendSms SUCCESS')
  console.log('📤 Returning response:', JSON.stringify(data, null, 2))
  return data
}

// ── Helper: Send invitation SMS ───────────────────────────────
export interface SendInvitationSmsResult {
  success: boolean
  status: 'delivered' | 'failed' | 'pending'
  message: string
  error_code?: string
}

export async function sendInvitationSms(
  phone: string,
  guestName: string,
  eventTitle: string,
  inviteToken: string,
  template?: string,
  eventDate?: string,
  eventLocation?: string,
  cardType?: string,
  dressCode?: string
): Promise<SendInvitationSmsResult> {
  console.log('🚀 sendInvitationSms START')
  console.log('📥 Input parameters:', {
    phone,
    guestName,
    eventTitle,
    inviteToken,
    template: template || 'default',
    eventDate,
    eventLocation,
    cardType,
    dressCode
  })
  
  try {
    console.log('🔑 Environment check:', {
      hasApiKey: !!process.env.RAFIKI_API_KEY,
      hasSenderId: !!process.env.RAFIKI_SENDER_ID,
      apiKeyPrefix: process.env.RAFIKI_API_KEY?.substring(0, 10) + '...'
    })
    
    let message = template || `Hi {guest_name}! You're invited to {event_title}. Your invitation token: {invite_token}`
    console.log('📝 Original template message:', message)
    
    // Build replacement map with all available variables
    const replacements: Record<string, string> = {
      '{guest_name}': guestName,
      '{event_title}': eventTitle,
      '{invite_token}': inviteToken,
      '{event_date}': eventDate || '',
      '{event_location}': eventLocation || '',
      '{card_type}': cardType || '',
      '{dress_code}': dressCode || ''
    }
    
    // Only replace variables that are actually present in the message
    // This allows messages without variables to be sent as-is
    for (const [variable, value] of Object.entries(replacements)) {
      if (message.includes(variable)) {
        message = message.replace(new RegExp(variable, 'gi'), value)
      }
    }
    
    console.log('📝 Final message after variable replacement:', message)
    console.log('📝 Message length:', message.length)
    
    console.log('⏳ Calling sendSms...')
    const response = await sendSms({ phone, message })
    
    console.log('✅ sendSms returned successfully')
    console.log('📦 Response from sendSms:', JSON.stringify(response, null, 2))
    
    // Check if SMS was successfully queued/sent
    // RafikiSMS may return different status values, but if success=true, it's accepted
    if (response.success === true) {
      console.log('✅ SMS marked as delivered (success=true)')
      return {
        success: true,
        status: 'delivered',
        message: response.message || 'SMS queued successfully'
      }
    } else {
      console.log('❌ SMS marked as failed')
      console.log('  - response.success:', response.success)
      console.log('  - response.status:', response.status)
      console.log('  - response.message:', response.message)
      return {
        success: false,
        status: 'failed',
        message: response.message || 'Failed to send SMS',
        error_code: response.error_code
      }
    }
  } catch (error) {
    console.error('❌ sendInvitationSms ERROR')
    console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('  - Error message:', error instanceof Error ? error.message : String(error))
    console.error('  - Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('  - Full error:', error)
    return {
      success: false,
      status: 'failed',
      message: error instanceof Error ? error.message : String(error)
    }
  }
}
