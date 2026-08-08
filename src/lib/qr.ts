import QRCode from 'qrcode'

export function generateToken(): string {
  // Generate a 6-digit numeric token for easy staff verification
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function generateQRDataURL(token: string, baseUrl: string): Promise<string> {
  const url = `${baseUrl}/invite/${token}`
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    width: 320,
    margin: 2,
    color: { dark: '#0F172A', light: '#F8FAFC' },
  })
}

export function whatsappLink(phone: string, message: string): string {
  const clean = phone.replace(/[\s\-\(\)]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

interface WhatsAppMessageOptions {
  guestName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  cardType: string
  dressCode: string
  inviteUrl: string
}

export function whatsappMessage(
  options: WhatsAppMessageOptions,
  template?: string
): string {
  const {
    guestName,
    eventTitle,
    eventDate,
    eventLocation,
    cardType,
    dressCode,
    inviteUrl
  } = options

  let message = template || `Hi {guest_name}! You're invited to {event_title}. View your invitation: {invite_url}`

  // Replace template variables
  message = message
    .replace(/{guest_name}/g, guestName)
    .replace(/{event_title}/g, eventTitle)
    .replace(/{event_date}/g, eventDate)
    .replace(/{event_location}/g, eventLocation)
    .replace(/{card_type}/g, cardType)
    .replace(/{dress_code}/g, dressCode)
    .replace(/{invite_url}/g, inviteUrl)
    .replace(/{guest_name}/gi, guestName)
    .replace(/{event_title}/gi, eventTitle)
    .replace(/{event_date}/gi, eventDate)
    .replace(/{event_location}/gi, eventLocation)
    .replace(/{card_type}/gi, cardType)
    .replace(/{dress_code}/gi, dressCode)
    .replace(/{invite_url}/gi, inviteUrl)

  return message
}
