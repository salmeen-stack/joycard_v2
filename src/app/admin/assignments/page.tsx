'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Assignment { id:number; organizer_id?:number; staff_id?:number; event_id:number; guest_limit?:number; organizer_name?:string; organizer_email?:string; staff_name?:string; staff_email?:string; event_title:string; event_date:string }
interface UserItem   { id:number; name:string; email:string }
interface EventItem  { id:number; title:string; date:string }

export default function AdminAssignments() {
  const [tab,    setTab]    = useState<'organizer'|'staff'>('organizer')
  const [rows,   setRows]   = useState<Assignment[]>([])
  const [users,  setUsers]  = useState<UserItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [modal,  setModal]  = useState(false)
  const [form,   setForm]   = useState({ user_id:'', event_id:'', guest_limit:'10' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [a,u,e] = await Promise.all([
        fetch(tab==='organizer'?'/api/admin/assignments':'/api/staff/events').then(r=>r.json()),
        fetch(`/api/admin/users?role=${tab}`).then(r=>r.json()),
        fetch('/api/events').then(r=>r.json()),
      ])
      setRows(a.assignments||[]); setUsers(u.users||[]); setEvents(e.events||[])
    } catch { toast.error('Failed to load') }
  }
  useEffect(()=>{ load() },[tab])

  async function assign(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const url  = tab==='organizer'?'/api/admin/assignments':'/api/staff/events'
      const body = tab==='organizer'
        ? { organizer_id:+form.user_id, event_id:+form.event_id, guest_limit:+form.guest_limit }
        : { staff_id:+form.user_id, event_id:+form.event_id }
      const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      const d = await r.json()
      if (!r.ok) { toast.error(d.error); return }
      toast.success('Assigned!'); setModal(false); load()
    } finally { setSaving(false) }
  }

  async function remove(a: Assignment) {
    const url  = tab==='organizer'?'/api/admin/assignments':'/api/staff/events'
    const body = tab==='organizer'
      ? { organizer_id:a.organizer_id, event_id:a.event_id }
      : { staff_id:a.staff_id, event_id:a.event_id }
    const r = await fetch(url,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    r.ok ? (toast.success('Removed'), load()) : toast.error('Failed')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="flex items-center justify-between mb-10">
        <div><p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Admin</p><h1 className="font-display text-4xl font-semibold text-cream">Assignments</h1></div>
        <button onClick={()=>{setForm({user_id:'',event_id:'',guest_limit:'10'});setModal(true)}} className="btn-gold">+ Assign</button>
      </motion.div>

      <div className="flex gap-2 mb-6">
        {(['organizer','staff'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-5 py-2 rounded-full text-sm tracking-wide transition-all ${tab===t?'bg-gold text-navy-900 font-bold':'bg-white/5 text-cream/40 hover:text-cream'}`}>
            {t.charAt(0).toUpperCase()+t.slice(1)}s
          </button>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm">
            <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95}} className="glass-gold p-8 w-full max-w-md">
              <h2 className="font-display text-2xl font-semibold text-cream mb-6">Assign {tab==='organizer'?'Organizer':'Staff'}</h2>
              <form onSubmit={assign} className="space-y-4">
                <div><label className="label">{tab==='organizer'?'Organizer':'Staff Member'}</label>
                  <select className="input" required value={form.user_id} onChange={e=>setForm(f=>({...f,user_id:e.target.value}))}>
                    <option value="">Select…</option>
                    {users.map(u=><option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div><label className="label">Event</label>
                  <select className="input" required value={form.event_id} onChange={e=>setForm(f=>({...f,event_id:e.target.value}))}>
                    <option value="">Select…</option>
                    {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title} — {format(new Date(ev.date),'MMM d, yyyy')}</option>)}
                  </select>
                </div>
                {tab==='organizer' && (
                  <div><label className="label">Guest Limit</label>
                    <input type="number" min={1} className="input" required value={form.guest_limit} onChange={e=>setForm(f=>({...f,guest_limit:e.target.value}))} />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-gold flex-1">{saving?'Assigning…':'Assign'}</button>
                  <button type="button" onClick={()=>setModal(false)} className="btn-ghost flex-1">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-gold overflow-hidden">
        {rows.length===0 ? (
          <div className="p-16 text-center"><p className="text-3xl mb-3">🔗</p><p className="font-display text-lg text-cream">No assignments yet</p></div>
        ) : (
          <table className="table">
            <thead><tr><th>{tab==='organizer'?'Organizer':'Staff'}</th><th>Event</th><th>Date</th>{tab==='organizer'&&<th>Limit</th>}<th>Action</th></tr></thead>
            <tbody>
              {rows.map(a=>(
                <tr key={a.id}>
                  <td><p className="text-cream font-medium">{a.organizer_name||a.staff_name}</p><p className="text-cream/30 text-xs">{a.organizer_email||a.staff_email}</p></td>
                  <td className="text-cream/60">{a.event_title}</td>
                  <td className="text-cream/35 text-xs">{format(new Date(a.event_date),'MMM d, yyyy')}</td>
                  {tab==='organizer'&&<td><span className="badge badge-gold">{a.guest_limit} guests</span></td>}
                  <td><button onClick={()=>remove(a)} className="text-cream/30 hover:text-rose-400 transition-colors text-sm">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
