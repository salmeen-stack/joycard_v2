'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

interface Inv { id:number; card_url?:string; card_type:'single'|'double'; dress_code:string; qr_token:string; scanned_at?:string; guest_name:string; event_title:string; event_date:string; event_location:string }

export default function SimpleInvitePage({ params }: { params: { token: string } }) {
  const [inv, setInv] = useState<Inv|null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQR, setShowQR] = useState(false)

  useEffect(()=>{
    async function load() {
      try {
        console.log('Loading invitation for token:', params.token)
        const r = await fetch(`/api/invitations/verify/${params.token}`)
        if (!r.ok) { setError('Invitation not found'); return }
        const d = await r.json()
        console.log('Invitation data loaded:', d.invitation)
        setInv(d.invitation)
      } catch { 
        console.error('Failed to load invitation:', error)
        setError('Failed to load invitation') 
      } finally { setLoading(false) }
    }
    load()
  },[params.token])

  const generateQR = async () => {
    if (!inv) return
    
    try {
      console.log('Generating QR code...')
      const QR = (await import('qrcode')).default
      const url = `${window.location.origin}/invite/${params.token}`
      const qrDataUrl = await QR.toDataURL(url, { 
        errorCorrectionLevel: 'H', 
        width: 280, 
        margin: 2, 
        color: { dark: '#0F172A', light: '#F8FAFC' } 
      })
      console.log('QR code generated successfully, length:', qrDataUrl.length)
      
      // Create a new window to show QR code
      const newWindow = window.open('', '_blank', 'width=400,height=500')
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>QR Code</title></head>
            <body style="background:#0F172A;color:white;font-family:sans-serif;padding:20px;text-align:center;">
              <h2>Your QR Code</h2>
              <img src="${qrDataUrl}" alt="QR Code" style="border:4px solid #F8FAFC;border-radius:8px;" />
              <p style="margin-top:20px;font-size:14px;">Scan this code to check in</p>
            </body>
          </html>
        `)
        newWindow.document.close()
      }
    } catch (error) {
      console.error('QR generation failed:', error)
      alert('Failed to generate QR code')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-2 border-gold/25 border-t-gold rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cream/35 text-sm tracking-widest">Loading your invitation…</p>
      </div>
    </div>
  )

  if (error||!inv) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="glass-gold p-10 text-center max-w-sm">
        <p className="text-4xl mb-4">🔍</p>
        <h2 className="font-display text-2xl text-cream mb-2">Not Found</h2>
        <p className="text-cream/35 text-sm">{error||'This invitation is invalid or expired.'}</p>
        <Link href="/" className="btn-ghost mt-6 inline-block px-6 py-2.5 text-xs">Go Home</Link>
      </div>
    </div>
  )

  const date = format(new Date(inv.event_date),'EEEE, MMMM d, yyyy')
  const time = format(new Date(inv.event_date),'h:mm a')

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-teal/5 blur-[80px]" />
      </div>

      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-2 z-10">
        <Link href="/"><span className="font-display text-2xl text-gold font-semibold tracking-widest">joycard</span></Link>
      </motion.div>

      <div className="glass-gold p-8 max-w-sm z-10">
        <h1 className="font-display text-3xl text-cream mb-4 text-center">{inv.event_title}</h1>
        <p className="text-gold/60 text-sm mb-6 text-center">{date} · {time}</p>
        <p className="text-cream/25 text-xs mb-6 text-center">{inv.event_location}</p>
        
        <div className="text-center mb-6">
          <h2 className="font-display text-xl text-cream mb-2">You're Invited!</h2>
          <p className="text-cream/60 text-sm">Dear {inv.guest_name}</p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {inv.card_url && (
            <div className="relative w-full h-48">
              <Image src={inv.card_url} alt="Invitation" fill className="object-cover rounded-lg" />
            </div>
          )}
          
          <button 
            onClick={generateQR}
            className="btn-gold w-full py-3"
          >
            {showQR ? 'QR Code Generated' : 'Generate QR Code'}
          </button>
          
          <div className="w-full space-y-2 text-left bg-white/5 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-cream/35 text-xs uppercase">Entry Type</span>
              <span className={`badge ${inv.card_type==='double'?'badge-teal':'badge-gold'}`}>
                {inv.card_type==='double'?'2 Persons':'1 Person'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-cream/35 text-xs uppercase">Dress Code</span>
              <span className="text-cream text-sm font-medium">{inv.dress_code}</span>
            </div>
          </div>
        </div>
      </div>

      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5}} className="z-10 mt-6 text-center">
        <p className="text-cream/40 text-sm">{inv.event_title}</p>
        <p className="text-gold/50 text-xs mt-1">{date} · {time}</p>
        <p className="text-cream/25 text-xs mt-0.5">{inv.event_location}</p>
      </motion.div>
      
      <p className="z-10 mt-8 text-cream/10 text-xs tracking-widest">© {new Date().getFullYear()} joycard</p>
    </div>
  )
}
