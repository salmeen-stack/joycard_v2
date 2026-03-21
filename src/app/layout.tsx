import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const display = Cormorant_Garamond({
  subsets: ['latin'], weight: ['300','400','500','600','700'],
  variable: '--font-display', display: 'swap',
})
const body = Jost({
  subsets: ['latin'], weight: ['300','400','500','600','700'],
  variable: '--font-body', display: 'swap',
})

export const metadata: Metadata = {
  title: 'joycard — Invitation Management',
  description: 'Elegant digital invitations with secure QR check-in',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-navy-900 text-cream font-body antialiased">
        {children}
        <Toaster position="top-right" toastOptions={{
          style: { background:'#1E293B', color:'#F8FAFC', border:'1px solid rgba(212,175,55,.2)', borderRadius:'12px' },
          success: { iconTheme: { primary:'#2DD4BF', secondary:'#0F172A' } },
          error:   { iconTheme: { primary:'#F43F5E', secondary:'#0F172A' } },
        }} />
      </body>
    </html>
  )
}
