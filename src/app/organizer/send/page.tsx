'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface Guest { id:number; name:string; contact:string; channel:string; card_type?:string; inv_id?:number; qr_token?:string; card_url?:string; sent_via_email?:boolean; sent_via_whatsapp?:boolean; scanned_at?:string }
interface Asgn  { event_id:number; event_title:string }

function Content() {
  const sp = useSearchParams()
  const [selEvent, setSelEvent] = useState(sp.get('event')||'')
  const [guests,   setGuests]   = useState<Guest[]>([])
  const [asgns,    setAsgns]    = useState<Asgn[]>([])
  const [loading,  setLoading]  = useState(true)
  const [active,   setActive]   = useState<Guest|null>(null)
  const [cardUrl,  setCardUrl]  = useState('')
  const [preview,  setPreview]  = useState('')
  const [sending,  setSending]  = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [g,a] = await Promise.all([
        fetch(selEvent?`/api/guests?event_id=${selEvent}`:'/api/guests').then(r=>r.json()),
        fetch('/api/admin/assignments').then(r=>r.json()),
      ])
      setGuests(g.guests||[]); setAsgns(a.assignments||[])
    } catch { toast.error('Failed') } finally { setLoading(false) }
  },[selEvent])
  useEffect(()=>{ load() },[load])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file || !active) {
      return
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed')
      return
    }
    
    // Validate file size (20MB)
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 20MB')
      return
    }
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/invitations/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (!result.success) {
        toast.error(result.error || 'Upload failed')
        return
      }
      
      setCardUrl(result.url)
      setPreview(result.url)
      toast.success('Card uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [active])

  async function send(email:boolean, wa:boolean) {
    if (!active?.inv_id) { toast.error('No invitation found'); return }
    setSending(true)
    try {
      const r = await fetch('/api/invitations',{
        method:'PUT', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ invitation_id:active.inv_id, card_url:cardUrl||active.card_url, send_email:email, send_whatsapp:wa }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error); return }
      if (wa && d.whatsappLink) { window.open(d.whatsappLink,'_blank'); toast.success('WhatsApp opened!') }
      if (email && d.emailSent)  toast.success('Email sent!')
      if (email && !d.emailSent) toast.error('Email failed — check Gmail config')
      setActive(null); setCardUrl(''); setPreview(''); load()
    } finally { setSending(false) }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window!=='undefined' ? window.location.origin : '')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Organizer</p>
        <h1 className="font-display text-4xl font-semibold text-cream">Send Invitations</h1>
      </motion.div>

      <div className="mb-6 max-w-xs">
        <label className="label">Select Event</label>
        <select className="input" value={selEvent} onChange={e=>setSelEvent(e.target.value)}>
          <option value="">All Events</option>
          {asgns.map(a=><option key={a.event_id} value={a.event_id}>{a.event_title}</option>)}
        </select>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm">
            <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95}}
              className="glass-gold p-8 w-full max-w-lg overflow-y-auto max-h-[90vh]">
              <h2 className="font-display text-2xl font-semibold text-cream mb-1">Send Invitation</h2>
              <p className="text-cream/40 text-sm mb-6">To: <span className="text-gold">{active.name}</span> via <span className="text-teal">{active.channel}</span></p>

              <div className="mb-5">
                <label className="label">Invitation Card (optional)</label>
                {(preview||active.card_url) ? (
                  <div className="relative rounded-xl overflow-hidden border border-gold/20 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview||active.card_url} alt="Card" className="w-full max-h-48 object-cover" />
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCardUrl('')
                        setPreview('')
                      }}
                      className="absolute top-2 right-2 bg-navy-900/80 text-cream/50 hover:text-rose-400 rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                      type="button"
                    >✕</button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-xl p-7 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex flex-col items-center gap-2 text-cream/60 hover:text-gold transition-colors"
                    >
                      <div className="text-2xl">📸</div>
                      <span className="text-sm">
                        {uploading ? 'Uploading...' : 'Choose Image'}
                      </span>
                      <span className="text-xs opacity-50">
                        JPEG, PNG, WebP, GIF (max 20MB)
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {active.qr_token && (
                <div className="mb-5 p-3 bg-white/5 rounded-xl">
                  <p className="text-cream/25 text-xs uppercase tracking-widest mb-1">Invite Link</p>
                  <p className="text-teal text-xs break-all">{base}/invite/{active.qr_token}</p>
                </div>
              )}

              <div className="space-y-3">
                {active.channel==='email' && (
                  <button onClick={()=>send(true,false)} disabled={sending} className="btn-gold w-full">
                    {sending?'Sending…':'📧 Send via Email'}
                  </button>
                )}
                {active.channel==='whatsapp' && (
                  <button onClick={()=>send(false,true)} disabled={sending} className="btn-teal w-full">
                    {sending?'Opening…':'💬 Open WhatsApp'}
                  </button>
                )}
                <button onClick={()=>{setActive(null);setCardUrl('');setPreview('')}} className="btn-ghost w-full">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-gold overflow-hidden">
        {loading ? <div className="p-8 text-center text-cream/30 text-sm">Loading…</div>
        : guests.length===0 ? (
          <div className="p-16 text-center"><p className="text-3xl mb-3">📨</p><p className="font-display text-lg text-cream mb-2">No Guests</p><p className="text-cream/35 text-sm">Add guests first, then send invitations.</p></div>
        ) : (
          <table className="table">
            <thead><tr><th>Guest</th><th>Channel</th><th>Card</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {guests.map(g=>(
                <tr key={g.id}>
                  <td><p className="text-cream font-medium">{g.name}</p><p className="text-cream/30 text-xs">{g.contact}</p></td>
                  <td><span className={`badge ${g.channel==='email'?'badge-gold':'badge-teal'}`}>{g.channel}</span></td>
                  <td><span className="badge badge-slate">{g.card_type||'single'}</span></td>
                  <td>
                    {g.scanned_at?<span className="badge badge-teal">✓ Checked In</span>
                    :g.sent_via_email||g.sent_via_whatsapp?<span className="badge badge-gold">✓ Sent</span>
                    :<span className="badge badge-slate">Not Sent</span>}
                  </td>
                  <td>
                    <button onClick={()=>{setActive(g);setCardUrl('');setPreview('')}} className="btn-ghost py-1.5 px-4 text-xs">
                      {g.sent_via_email||g.sent_via_whatsapp?'Resend':'Send'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function OrganizerSend() {
  return <Suspense fallback={<div className="p-8 text-cream/30">Loading…</div>}><Content /></Suspense>
}
