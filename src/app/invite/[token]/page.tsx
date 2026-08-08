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
        // Force production URL for debugging
        const url = `https://joycardv2.vercel.app/invite/${token}`
        
        // Debug logging
        console.log('Generated URL:', url, 'Env var:', process.env.NEXT_PUBLIC_APP_URL)
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
    <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#14213D'}}>
      <div className="text-center">
        <div className="w-14 h-14 border-2 rounded-full animate-spin mx-auto mb-4" style={{borderColor: '#FCA311', borderTopColor: 'transparent'}} />
        <p className="text-sm tracking-widest" style={{color: '#E5E5E5'}}>Loading your invitation…</p>
      </div>
    </div>
  )

  if (error||!inv) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor: '#14213D'}}>
      <div className="p-10 text-center max-w-sm" style={{backgroundColor: '#FFFFFF', borderRadius: '16px'}}>
        <p className="text-4xl mb-4">🔍</p>
        <h2 className="font-display text-2xl mb-2" style={{color: '#000000'}}>Not Found</h2>
        <p className="text-sm" style={{color: '#E5E5E5'}}>{error||'This invitation is invalid or expired.'}</p>
        <Link href="/" className="mt-6 inline-block px-6 py-2.5 text-xs" style={{color: '#FCA311', textDecoration: 'underline'}}>Go Home</Link>
      </div>
    </div>
  )

  const date = format(new Date(inv.event_date),'EEEE, MMMM d, yyyy')
  const time = format(new Date(inv.event_date),'h:mm a')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden" style={{backgroundColor: '#14213D'}}>
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse" style={{backgroundColor: '#FCA311', opacity: 0.1}} />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full blur-[80px] animate-pulse" style={{backgroundColor: '#FFFFFF', opacity: 0.05, animationDelay: '1s'}} />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-bounce"
            style={{
              width: Math.random() * 10 + 5 + 'px',
              height: Math.random() * 10 + 5 + 'px',
              backgroundColor: '#FCA311',
              opacity: 0.3,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's',
              animationDuration: Math.random() * 3 + 2 + 's'
            }}
          />
        ))}
      </div>

      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-2 z-10">
        <Link href="/"><span className="font-display text-2xl font-semibold tracking-widest" style={{color: '#FCA311'}}>joycard</span></Link>
      </motion.div>
      <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}} className="text-xs mb-8 z-10" style={{color: '#E5E5E5'}}>Tap the card below or <button onClick={handleFlip} style={{color: '#FCA311', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer'}}>click here</button> to reveal your QR code</motion.p>

      {/* Card flip */}
      <div className="scene w-full max-w-sm z-10" style={{height:520,perspective:'1200px'}}>
        <motion.div 
          className={`card-inner cursor-pointer ${flipped?'flipped':''}`}
          onClick={handleFlip}
          initial={{scale:.9,opacity:0}} 
          animate={{scale:1,opacity:1}} 
          transition={{duration:.7,type:'spring'}}
          whileHover={{scale: 1.02}}
          whileTap={{scale: 0.98}}
        >

          {/* Front */}
          <div className="card-face">
            {inv.card_url ? (
              <div className="relative w-full h-full">
                <Image src={inv.card_url} alt="Invitation" fill className="object-cover" />
                <div className="absolute inset-0" style={{background: 'linear-gradient(to top, rgba(20, 33, 61, 0.7), transparent)'}} />
                <div className="absolute bottom-6 inset-x-0 text-center"><p className="text-xs tracking-widest" style={{color: '#E5E5E5'}}>TAP TO VIEW QR CODE</p></div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center" style={{backgroundColor: '#FFFFFF', border: '2px solid #FCA311'}}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{backgroundColor: '#FCA311', opacity: 0.1}}><span className="text-2xl">🎉</span></div>
                <p className="text-xs tracking-widest uppercase mb-3" style={{color: '#000000'}}>You're Invited To</p>
                <h2 className="font-display text-2xl font-semibold mb-2" style={{color: '#14213D'}}>{inv.event_title}</h2>
                <p className="text-sm" style={{color: '#FCA311'}}>{date}</p>
                <p className="text-xs mt-1" style={{color: '#E5E5E5'}}>{inv.event_location}</p>
                <p className="text-xs mt-8 tracking-widest" style={{color: '#000000'}}>TAP TO VIEW QR CODE</p>
              </div>
            )}
          </div>

          {/* Back */}
          <div className="card-face card-back flex flex-col items-center justify-center p-7" style={{backgroundColor: '#FFFFFF', border: '2px solid #FCA311'}}>
            <motion.p 
              initial={{opacity: 0, y: -10}} 
              animate={{opacity: 1, y: 0}} 
              transition={{delay: 0.1}}
              className="text-xs tracking-widest uppercase mb-5" 
              style={{color: '#000000'}}
            >
              Your Entry Code
            </motion.p>
            <motion.div 
              initial={{scale: 0.8, opacity: 0}}
              animate={{scale: 1, opacity: 1}}
              transition={{delay: 0.2, type: 'spring'}}
              className="p-4 rounded-2xl mb-5 relative"
              style={{backgroundColor: '#E5E5E5', boxShadow: '0 0 30px rgba(252, 163, 17, 0.2)'}}
            >
              {/* Pulsing glow effect around QR code */}
              <div className="absolute inset-0 rounded-2xl animate-ping" style={{backgroundColor: '#FCA311', opacity: 0.2}} />
              {qrUrl ? <Image src={qrUrl} alt="QR Code" width={200} height={200} className="rounded-lg relative z-10" />
                : <div className="w-48 h-48 flex items-center justify-center"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{borderColor: '#14213D', borderTopColor: 'transparent'}} /></div>}
            </motion.div>
            <motion.h3 
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              transition={{delay: 0.3}}
              className="font-display text-xl font-semibold mb-4" 
              style={{color: '#14213D'}}
            >
              {inv.guest_name}
            </motion.h3>
            <motion.div 
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              transition={{delay: 0.4}}
              className="w-full space-y-2.5"
            >
              <div className="flex items-center justify-between px-4 py-2 rounded-xl" style={{backgroundColor: '#E5E5E5'}}>
                <span className="text-xs uppercase tracking-widest" style={{color: '#000000'}}>Entry</span>
                <span className={`badge ${inv.card_type==='double'?'badge-teal':'badge-gold'}`}>{inv.card_type==='double'?'2 Persons':'1 Person'}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2 rounded-xl" style={{backgroundColor: '#E5E5E5'}}>
                <span className="text-xs uppercase tracking-widest" style={{color: '#000000'}}>Dress Code</span>
                <span className="text-sm font-medium" style={{color: '#14213D'}}>{inv.dress_code}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2 rounded-xl" style={{backgroundColor: '#E5E5E5'}}>
                <span className="text-xs uppercase tracking-widest" style={{color: '#000000'}}>Date</span>
                <span className="text-xs" style={{color: '#14213D'}}>{date}</span>
              </div>
            </motion.div>
            {inv.scanned_at && (
              <motion.div 
                initial={{scale: 0.8, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                className="mt-4 px-4 py-2 rounded-xl w-full text-center" 
                style={{backgroundColor: '#FCA311', opacity: 0.1, border: '1px solid #FCA311'}}
              >
                <p className="text-xs" style={{color: '#FCA311'}}>✓ Checked in at {format(new Date(inv.scanned_at),'h:mm a')}</p>
              </motion.div>
            )}
            <motion.p 
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              transition={{delay: 0.5}}
              className="text-xs mt-5" 
              style={{color: '#E5E5E5'}}
            >
              Tap to flip back
            </motion.p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5}} className="z-10 mt-7 text-center">
        <p className="text-sm" style={{color: '#FFFFFF'}}>{inv.event_title}</p>
        <p className="text-xs mt-1" style={{color: '#FCA311'}}>{date} · {time}</p>
        <p className="text-xs mt-0.5" style={{color: '#E5E5E5'}}>{inv.event_location}</p>
      </motion.div>
      <p className="z-10 mt-8 text-xs tracking-widest" style={{color: '#E5E5E5'}}>© {new Date().getFullYear()} joycard</p>
    </div>
  )
}
