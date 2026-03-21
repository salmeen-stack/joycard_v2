import { v4 as uuidv4 } from 'uuid'
import QRCode from 'qrcode'

export function generateToken(): string {
  return uuidv4()
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

export function whatsappMessage(opts: {
  guestName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  cardType: string
  dressCode: string
  inviteUrl: string
}): string {
  const entry = opts.cardType === 'double' ? 'Double Entry (2 persons)' : 'Single Entry (1 person)'
  return `🎉 *You're Invited!*\n\nDear *${opts.guestName}*,\n\n✨ *${opts.eventTitle}*\n📅 ${opts.eventDate}\n📍 ${opts.eventLocation}\n🎟️ ${entry}\n👔 Dress Code: ${opts.dressCode}\n\n👇 *View your invitation & QR code:*\n${opts.inviteUrl}\n\n_Personal & non-transferable._`
}
