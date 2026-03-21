'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface Guest { id:number; name:string; contact:string; channel:string; card_type?:string; dress_code?:string; inv_id?:number; qr_token?:string; scanned_at?:string; sent_via_email?:boolean; sent_via_whatsapp?:boolean }
interface Asgn  { id:number; event_id:number; event_title:string; guest_limit:number; guests_added:number }
const INIT = { name:'', contact:'', channel:'email', card_type:'single', dress_code:'Smart Casual' }

function Content() {
  const sp = useSearchParams()
  const [selEvent, setSelEvent] = useState(sp.get('event')||'')
  const [guests,   setGuests]   = useState<Guest[]>([])
  const [asgns,    setAsgns]    = useState<Asgn[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState(INIT)
  const [saving,   setSaving]   = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked-in' | 'not-checked-in'>('all')

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

  // Filter guests based on search and status
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = searchTerm === '' || 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.contact.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'checked-in' && guest.scanned_at) ||
      (filterStatus === 'not-checked-in' && !guest.scanned_at)
    
    return matchesSearch && matchesStatus
  })
  useEffect(()=>{ load() },[load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!selEvent) { toast.error('Select an event first'); return }
    setSaving(true)
    try {
      const r = await fetch('/api/guests',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form,event_id:+selEvent}) })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error); return }
      toast.success('Guest added!'); setModal(false); setForm(INIT); load()
    } finally { setSaving(false) }
  }

  async function del(id:number) {
    if (!confirm('Remove guest?')) return
    const r = await fetch(`/api/guests/${id}`,{method:'DELETE'})
    r.ok ? (toast.success('Removed'), load()) : toast.error('Failed')
  }

  const cur = asgns.find(a=>String(a.event_id)===selEvent)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="flex items-center justify-between mb-10">
        <div><p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Organizer</p><h1 className="font-display text-4xl font-semibold text-cream">Guests</h1></div>
        <button onClick={()=>setModal(true)} disabled={!selEvent} className="btn-gold disabled:opacity-40">+ Add Guest</button>
      </motion.div>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="label">Event</label>
          <select className="input min-w-[220px]" value={selEvent} onChange={e=>setSelEvent(e.target.value)}>
            <option value="">All Events</option>
            {asgns.map(a=><option key={a.event_id} value={a.event_id}>{a.event_title}</option>)}
          </select>
        </div>
        
        <div>
          <label className="label">Search Guests</label>
          <input 
            type="text" 
            className="input min-w-[200px]" 
            placeholder="Search by name or contact..."
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <label className="label">Status Filter</label>
          <select 
            className="input min-w-[150px]" 
            value={filterStatus}
            onChange={e=>setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Guests</option>
            <option value="checked-in">Checked In</option>
            <option value="not-checked-in">Not Checked In</option>
          </select>
        </div>
        
        {cur && (
          <div className="flex gap-3">
            <div className="glass-gold px-4 py-2 text-center"><p className="text-gold font-display text-lg font-bold">{cur.guests_added}</p><p className="text-cream/25 text-xs">Added</p></div>
            <div className="glass-gold px-4 py-2 text-center"><p className="text-cream font-display text-lg font-bold">{cur.guest_limit}</p><p className="text-cream/25 text-xs">Limit</p></div>
          </div>
        )}
      </div>
      
      {searchTerm && (
        <div className="mb-4">
          <p className="text-cream/35 text-sm">
            Found {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </p>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm">
            <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95}} className="glass-gold p-8 w-full max-w-md">
              <h2 className="font-display text-2xl font-semibold text-cream mb-6">Add Guest</h2>
              <form onSubmit={add} className="space-y-4">
                <div><label className="label">Name</label><input className="input" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" /></div>
                <div><label className="label">Contact ({form.channel==='email'?'Email':'Phone'})</label><input className="input" required value={form.contact} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} placeholder={form.channel==='email'?'email@example.com':'+1234567890'} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Channel</label>
                    <select className="input" value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))}>
                      <option value="email">Email</option><option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div><label className="label">Card Type</label>
                    <select className="input" value={form.card_type} onChange={e=>setForm(f=>({...f,card_type:e.target.value}))}>
                      <option value="single">Single</option><option value="double">Double</option>
                    </select>
                  </div>
                </div>
                <div><label className="label">Dress Code</label><input className="input" value={form.dress_code} onChange={e=>setForm(f=>({...f,dress_code:e.target.value}))} /></div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-gold flex-1">{saving?'Adding…':'Add Guest'}</button>
                  <button type="button" onClick={()=>setModal(false)} className="btn-ghost flex-1">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-gold overflow-hidden">
        {loading ? <div className="p-8 text-center text-cream/30 text-sm">Loading…</div>
        : filteredGuests.length===0 && searchTerm ? (
          <div className="p-16 text-center"><p className="text-3xl mb-3">🔍</p><p className="font-display text-lg text-cream mb-2">No Matching Guests</p><p className="text-cream/35 text-sm">Try adjusting your search or filters.</p></div>
        ) : guests.length===0 ? (
          <div className="p-16 text-center"><p className="text-3xl mb-3">🎟️</p><p className="font-display text-lg text-cream mb-2">No Guests</p><p className="text-cream/35 text-sm">Select an event and add guests.</p></div>
        ) : (
          <table className="table">
            <thead><tr><th>Name</th><th>Contact</th><th>Channel</th><th>Card</th><th>Dress Code</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filteredGuests.map(g=>(
                <tr key={g.id}>
                  <td className="font-medium text-cream">{g.name}</td>
                  <td className="text-cream/45 text-xs">{g.contact}</td>
                  <td><span className={`badge ${g.channel==='email'?'badge-gold':'badge-teal'}`}>{g.channel}</span></td>
                  <td><span className="badge badge-slate">{g.card_type||'single'}</span></td>
                  <td className="text-cream/45 text-xs">{g.dress_code||'—'}</td>
                  <td>
                    {g.scanned_at?<span className="badge badge-teal">✓ In</span>
                    :g.sent_via_email||g.sent_via_whatsapp?<span className="badge badge-gold">Sent</span>
                    :<span className="badge badge-slate">Pending</span>}
                  </td>
                  <td><button onClick={()=>del(g.id)} className="text-cream/25 hover:text-rose-400 transition-colors text-xs">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function OrganizerGuests() {
  return <Suspense fallback={<div className="p-8 text-cream/30">Loading…</div>}><Content /></Suspense>
}
