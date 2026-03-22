'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'

interface Inv { id:number; card_url?:string; card_type:'single'|'double'; dress_code:string; qr_token:string; scanned_at?:string; guest_name:string; event_title:string; event_date:string; event_location:string }

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const [inv,     setInv]     = useState<Inv|null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [flipped, setFlipped] = useState(false)
  const [qrUrl, setQrUrl] = useState('')

  useEffect(()=>{
    async function load() {
      try {
        const { token } = await params
        const r = await fetch(`/api/invitations/verify/${token}`)
        if (!r.ok) { setError('Invitation not found'); return }
        const d = await r.json()
        setInv(d.invitation)
        const QR = (await import('qrcode')).default
        const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://joycardv2.vercel.app'}/invite/${token}`
        const qrDataUrl = await QR.toDataURL(url,{ errorCorrectionLevel:'H', width:280, margin:2, color:{dark:'#0F172A',light:'#F8FAFC'} })
        setQrUrl(qrDataUrl)
      } catch (error) { 
        setError('Failed to load invitation') 
      } finally { setLoading(false) }
    }
    load()
  },[params])

  const handleFlip = () => {
    setFlipped(f=>!f)
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
      <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}} className="text-cream/30 text-xs mb-8 z-10">Tap the card below or <button onClick={handleFlip} className="text-gold underline">click here</button> to reveal your QR code</motion.p>

      {/* Card flip */}
      <div className="scene w-full max-w-sm z-10" style={{height:520,perspective:'1200px'}}>
        <motion.div className={`card-inner cursor-pointer ${flipped?'flipped':''}`}
          onClick={handleFlip}
          initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:.7,type:'spring'}}>

          {/* Front */}
          <div className="card-face">
            {inv.card_url ? (
              <div className="relative w-full h-full">
                <Image src={inv.card_url} alt="Invitation" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/50 to-transparent" />
                <div className="absolute bottom-6 inset-x-0 text-center"><p className="text-cream/50 text-xs tracking-widest">TAP TO VIEW QR CODE</p></div>
              </div>
            ) : (
              <div className="w-full h-full bg-navy-800 border border-gold/20 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mb-5"><span className="text-2xl">🎉</span></div>
                <p className="text-cream/25 text-xs tracking-widest uppercase mb-3">You're Invited To</p>
                <h2 className="font-display text-2xl font-semibold text-cream mb-2">{inv.event_title}</h2>
                <p className="text-gold/60 text-sm">{date}</p>
                <p className="text-cream/35 text-xs mt-1">{inv.event_location}</p>
                <p className="text-cream/20 text-xs mt-8 tracking-widest">TAP TO VIEW QR CODE</p>
              </div>
            )}
          </div>

          {/* Back */}
          <div className="card-face card-back bg-navy-800 border border-gold/20 flex flex-col items-center justify-center p-7">
            <p className="text-cream/25 text-xs tracking-widest uppercase mb-5">Your Entry Code</p>
            <div className="bg-cream p-4 rounded-2xl mb-5 shadow-[0_0_30px_rgba(212,175,55,.2)]">
              {qrUrl ? <Image src={qrUrl} alt="QR Code" width={200} height={200} className="rounded-lg" />
                : <div className="w-48 h-48 flex items-center justify-center"><div className="w-8 h-8 border-2 border-navy-700 border-t-navy-900 rounded-full animate-spin" /></div>}
            </div>
            <h3 className="font-display text-xl font-semibold text-cream mb-4">{inv.guest_name}</h3>
            <div className="w-full space-y-2.5">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl">
                <span className="text-cream/35 text-xs uppercase tracking-widest">Entry</span>
                <span className={`badge ${inv.card_type==='double'?'badge-teal':'badge-gold'}`}>{inv.card_type==='double'?'2 Persons':'1 Person'}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl">
                <span className="text-cream/35 text-xs uppercase tracking-widest">Dress Code</span>
                <span className="text-cream text-sm font-medium">{inv.dress_code}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl">
                <span className="text-cream/35 text-xs uppercase tracking-widest">Date</span>
                <span className="text-cream text-xs">{date}</span>
              </div>
            </div>
            {inv.scanned_at && (
              <div className="mt-4 px-4 py-2 bg-teal/10 border border-teal/20 rounded-xl w-full text-center">
                <p className="text-teal text-xs">✓ Checked in at {format(new Date(inv.scanned_at),'h:mm a')}</p>
              </div>
            )}
            <p className="text-cream/15 text-xs mt-5">Tap to flip back</p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5}} className="z-10 mt-7 text-center">
        <p className="text-cream/40 text-sm">{inv.event_title}</p>
        <p className="text-gold/50 text-xs mt-1">{date} · {time}</p>
        <p className="text-cream/25 text-xs mt-0.5">{inv.event_location}</p>
      </motion.div>
      <p className="z-10 mt-8 text-cream/10 text-xs tracking-widest">© {new Date().getFullYear()} joycard</p>
    </div>
  )
}
