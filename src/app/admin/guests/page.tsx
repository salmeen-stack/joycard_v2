'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface Guest { id:number; name:string; contact:string; channel:string; event_title:string; card_type?:string; scanned_at?:string; sent_via_sms?:boolean; sent_via_whatsapp?:boolean; sms_delivery_status?:string; sms_delivery_message?:string }
interface EventItem { id:number; title:string }

export default function AdminGuests() {
  const [guests,  setGuests]  = useState<Guest[]>([])
  const [events,  setEvents]  = useState<EventItem[]>([])
  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [g,e] = await Promise.all([
        fetch(filter!=='all'?`/api/guests?event_id=${filter}`:'/api/guests').then(r=>r.json()),
        fetch('/api/events').then(r=>r.json()),
      ])
      setGuests(g.guests||[]); setEvents(e.events||[])
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[filter])

  async function del(id:number) {
    if (!confirm('Delete guest?')) return
    const r = await fetch(`/api/guests/${id}`,{method:'DELETE'})
    r.ok ? (toast.success('Deleted'), load()) : toast.error('Failed')
  }

  const shown = guests.filter(g=>g.name.toLowerCase().includes(search.toLowerCase())||g.contact.includes(search))

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-display text-4xl font-semibold text-cream">All Guests</h1>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or contact…" className="input max-w-xs" />
        <select className="input max-w-xs" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All Events</option>
          {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
      </div>

      <div className="glass-gold overflow-hidden">
        {loading ? <div className="p-8 text-center text-cream/30 text-sm">Loading…</div>
        : shown.length===0 ? (
          <div className="p-16 text-center"><p className="text-3xl mb-3">🎟️</p><p className="font-display text-lg text-cream">No guests found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Guest</th><th>Event</th><th>Contact</th><th>Channel</th><th>Card</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {shown.map(g=>(
                  <tr key={g.id}>
                    <td className="font-medium text-cream">{g.name}</td>
                    <td className="text-cream/45 text-xs">{g.event_title}</td>
                    <td className="text-cream/45 text-xs">{g.contact}</td>
                    <td><span className={`badge ${g.channel==='sms'?'badge-gold':'badge-teal'}`}>{g.channel}</span></td>
                    <td><span className="badge badge-slate">{g.card_type||'—'}</span></td>
                    <td>
                      {g.scanned_at?<span className="badge badge-teal">✓ In</span>
                      :g.sms_delivery_status==='delivered'?<span className="badge badge-emerald">✓ Delivered</span>
                      :g.sms_delivery_status==='failed'?<span className="badge badge-rose">✗ Failed</span>
                      :g.sent_via_sms||g.sent_via_whatsapp?<span className="badge badge-gold">Sent</span>
                      :<span className="badge badge-slate">Pending</span>}
                    </td>
                    <td><button onClick={()=>del(g.id)} className="text-cream/30 hover:text-rose-400 transition-colors text-sm">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
