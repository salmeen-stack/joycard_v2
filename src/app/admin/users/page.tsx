'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface User { id:number; name:string; email:string; role:string; created_at:string }

export default function AdminUsers() {
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [filter,  setFilter]  = useState('all')
  const [form,    setForm]    = useState({ name:'', email:'', password:'', role:'organizer' })
  const [saving,  setSaving]  = useState(false)

  const load = async () => {
    try {
      const url = filter !== 'all' ? `/api/admin/users?role=${filter}` : '/api/admin/users'
      const r = await fetch(url); const d = await r.json()
      setUsers(d.users || [])
    } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[filter])

  async function create(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const r = await fetch('/api/admin/users',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error); return }
      toast.success('User created!'); setModal(false)
      setForm({ name:'', email:'', password:'', role:'organizer' }); load()
    } finally { setSaving(false) }
  }

  async function del(id:number, name:string) {
    if (!confirm(`Delete "${name}"?`)) return
    const r = await fetch(`/api/admin/users/${id}`,{method:'DELETE'})
    r.ok ? (toast.success('Deleted'), load()) : toast.error('Failed')
  }

  const BADGE: Record<string,string> = { admin:'badge-gold', organizer:'badge-teal', staff:'badge-slate' }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="flex items-center justify-between mb-10">
        <div><p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Admin</p><h1 className="font-display text-4xl font-semibold text-cream">Users</h1></div>
        <button onClick={()=>setModal(true)} className="btn-gold">+ New User</button>
      </motion.div>

      <div className="flex gap-2 mb-6">
        {['all','admin','organizer','staff'].map(r=>(
          <button key={r} onClick={()=>setFilter(r)}
            className={`px-4 py-1.5 rounded-full text-xs tracking-widest uppercase transition-all ${filter===r?'bg-gold text-navy-900 font-bold':'bg-white/5 text-cream/40 hover:text-cream'}`}>
            {r}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm">
            <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95}} className="glass-gold p-8 w-full max-w-md">
              <h2 className="font-display text-2xl font-semibold text-cream mb-6">Create User</h2>
              <form onSubmit={create} className="space-y-4">
                <div><label className="label">Full Name</label><input className="input" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="John Smith" /></div>
                <div><label className="label">Email</label><input type="email" className="input" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="john@example.com" /></div>
                <div><label className="label">Password</label><input type="password" className="input" required minLength={6} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters" /></div>
                <div><label className="label">Role</label>
                  <select className="input" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                    <option value="organizer">Organizer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-gold flex-1">{saving?'Creating…':'Create'}</button>
                  <button type="button" onClick={()=>setModal(false)} className="btn-ghost flex-1">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-gold overflow-hidden">
        {loading ? <div className="p-8 text-center text-cream/30 text-sm">Loading…</div>
        : users.length===0 ? (
          <div className="p-16 text-center"><p className="text-3xl mb-3">👥</p><p className="font-display text-lg text-cream">No users found</p></div>
        ) : (
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id}>
                  <td className="font-medium text-cream">{u.name}</td>
                  <td className="text-cream/50">{u.email}</td>
                  <td><span className={`badge ${BADGE[u.role]||'badge-slate'}`}>{u.role}</span></td>
                  <td className="text-cream/35 text-xs">{format(new Date(u.created_at),'MMM d, yyyy')}</td>
                  <td><button onClick={()=>del(u.id,u.name)} className="text-cream/30 hover:text-rose-400 transition-colors text-sm">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
