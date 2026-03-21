export type UserRole = 'admin' | 'organizer' | 'staff'
export type Channel  = 'email' | 'whatsapp'
export type CardType = 'single' | 'double'

export interface User {
  id: number; name: string; email: string; role: UserRole; created_at: string
}
export interface Event {
  id: number; title: string; date: string; location: string; description?: string; created_at: string
}
export interface Guest {
  id: number; event_id: number; name: string; contact: string; channel: Channel; created_at: string
}
export interface Invitation {
  id: number; guest_id: number; card_url?: string; card_type: CardType
  dress_code: string; qr_token: string; scanned_at?: string
  sent_via_email: boolean; sent_via_whatsapp: boolean; created_at: string
}
export interface ScanResult {
  valid: boolean; alreadyScanned: boolean; message: string
  guest?: { name: string; card_type: CardType; dress_code: string; event_title: string; scanned_at?: string }
}
