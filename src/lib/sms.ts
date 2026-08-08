// ── Phone Number Formatting Helper ─────────────────────────────
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let formatted = phone.replace(/[^\d]/g, '').trim()
  
  // Remove leading 0 if present (common in local formats like 0712...)
  if (formatted.startsWith('0')) {
    formatted = formatted.substring(1)
  }
  
  // Ensure Tanzania country code if missing (assuming Tanzania numbers)
  // If number is 9 digits after removing leading 0, add 255
  if (formatted.length === 9 && !formatted.startsWith('255')) {
    formatted = '255' + formatted
  }
  
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
  const apiKey = process.env.RAFIKI_API_KEY
  const senderId = options.senderId || process.env.RAFIKI_SENDER_ID

  if (!apiKey) {
    throw new Error('RAFIKI_API_KEY is not set in environment variables')
  }

  // Format phone number for RafikiSMS
  const phone = formatPhoneNumber(options.phone)
  
  // Log the formatted phone number
  console.log('📞 Phone number formatted:', {
    original: options.phone,
    formatted: phone
  })

  const response = await fetch(`${API_BASE}/v1/vendor/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({
      phone,
      message: options.message,
      sender_id: senderId,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`RafikiSMS error: ${data.message || 'Unknown error'}`)
  }

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
  inviteUrl: string,
  template?: string
): Promise<SendInvitationSmsResult> {
  try {
    console.log('📱 sendInvitationSms called with:', {
      phone,
      guestName,
      eventTitle,
      inviteUrl,
      template: template || 'default'
    })
    
    console.log('🔑 Environment check:', {
      hasApiKey: !!process.env.RAFIKI_API_KEY,
      hasSenderId: !!process.env.RAFIKI_SENDER_ID,
      apiKeyPrefix: process.env.RAFIKI_API_KEY?.substring(0, 10) + '...'
    })
    
    let message = template || `Hi {guest_name}! You're invited to {event_title}. View your invitation: {invite_url}`
    
    // Replace template variables
    message = message
      .replace(/{guest_name}/g, guestName)
      .replace(/{event_title}/g, eventTitle)
      .replace(/{invite_url}/g, inviteUrl)
      .replace(/{guest_name}/gi, guestName)
      .replace(/{event_title}/gi, eventTitle)
      .replace(/{invite_url}/gi, inviteUrl)
    
    console.log('📝 Final message:', message.substring(0, 100) + '...')
    
    const response = await sendSms({ phone, message })
    
    console.log('✅ RafikiSMS response:', response)
    
    if (response.success && response.status === 'success') {
      return {
        success: true,
        status: 'delivered',
        message: response.message || 'SMS queued successfully'
      }
    } else {
      return {
        success: false,
        status: 'failed',
        message: response.message || 'Failed to send SMS',
        error_code: response.error_code
      }
    }
  } catch (error) {
    console.error('❌ Failed to send SMS:', error)
    return {
      success: false,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
