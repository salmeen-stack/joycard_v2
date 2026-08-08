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

  // Format phone number: ensure no + sign, international format
  let phone = options.phone.replace(/\+/g, '').trim()

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
  inviteUrl: string
): Promise<SendInvitationSmsResult> {
  try {
    const message = `Hi ${guestName}! You're invited to ${eventTitle}. View your invitation: ${inviteUrl}`
    const response = await sendSms({ phone, message })
    
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
    console.error('Failed to send SMS:', error)
    return {
      success: false,
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
