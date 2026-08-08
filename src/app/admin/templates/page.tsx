'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface Template { id:number; name:string; channel:string; content:string; is_default:boolean; created_at:string; updated_at:string }

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState({ name:'', channel:'sms', content:'', is_default:false })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/templates')
      const d = await r.json()
      setTemplates(d.templates||[])
    } catch { toast.error('Failed') } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editing ? `/api/templates/${editing.id}` : '/api/templates'
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) { toast.error(d.error); return }
      toast.success(editing ? 'Template updated!' : 'Template created!')
      setModal(false); setEditing(null); setForm({ name:'', channel:'sms', content:'', is_default:false })
      load()
    } finally { setSaving(false) }
  }

  async function del(id:number) {
    if (!confirm('Delete template?')) return
    const r = await fetch(`/api/templates/${id}`,{method:'DELETE'})
    r.ok ? (toast.success('Deleted'), load()) : toast.error('Failed')
  }

  async function setDefault(id:number, channel:string) {
    const r = await fetch(`/api/templates/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ is_default:true, channel }) })
    r.ok ? (toast.success('Default updated'), load()) : toast.error('Failed')
  }

  const edit = (t:Template) => {
    setEditing(t)
    setForm({ name:t.name, channel:t.channel, content:t.content, is_default:t.is_default })
    setModal(true)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="flex items-center justify-between mb-10">
        <div><p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Admin</p><h1 className="font-display text-4xl font-semibold text-cream">Message Templates</h1></div>
        <button onClick={()=>{setEditing(null);setForm({ name:'', channel:'sms', content:'', is_default:false });setModal(true)}} className="btn-gold">+ Add Template</button>
      </motion.div>

      <div className="glass-gold overflow-hidden">
        {loading ? <div className="p-8 text-center text-cream/30 text-sm">Loading…</div>
        : templates.length===0 ? (
          <div className="p-16 text-center"><p className="text-3xl mb-3">📝</p><p className="font-display text-lg text-cream mb-2">No Templates</p><p className="text-cream/35 text-sm">Create message templates for SMS and WhatsApp invitations.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Name</th><th>Channel</th><th>Content Preview</th><th>Default</th><th>Actions</th></tr></thead>
              <tbody>
                {templates.map(t=>(
                  <tr key={t.id}>
                    <td className="font-medium text-cream">{t.name}</td>
                    <td><span className={`badge ${t.channel==='sms'?'badge-gold':'badge-teal'}`}>{t.channel}</span></td>
                    <td className="text-cream/45 text-xs max-w-xs truncate">{t.content}</td>
                    <td>
                      {t.is_default ? <span className="badge badge-emerald">✓ Default</span> : (
                        <button onClick={()=>setDefault(t.id, t.channel)} className="text-cream/30 hover:text-gold text-xs">Set Default</button>
                      )}
                    </td>
                    <td className="flex gap-2">
                      <button onClick={()=>edit(t)} className="text-cream/30 hover:text-gold text-xs">Edit</button>
                      <button onClick={()=>del(t.id)} className="text-cream/30 hover:text-rose-400 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm">
          <div className="glass-gold p-8 w-full max-w-lg">
            <h2 className="font-display text-2xl font-semibold text-cream mb-6">{editing ? 'Edit Template' : 'Add Template'}</h2>
            <form onSubmit={save} className="space-y-4">
              <div><label className="label">Name</label><input className="input" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Template name" /></div>
              <div>
                <label className="label">Channel</label>
                <select className="input" value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))}>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="label">Content</label>
                <textarea 
                  className="input min-h-[120px]" 
                  required 
                  value={form.content} 
                  onChange={e=>setForm(f=>({...f,content:e.target.value}))} 
                  placeholder={form.channel === 'sms' 
                    ? "SMS variables: {guest_name}, {event_title}, {invite_token}" 
                    : "WhatsApp variables: {guest_name}, {event_title}, {event_date}, {event_location}, {card_type}, {dress_code}, {invite_url}"
                  }
                />
                <p className="text-cream/25 text-xs mt-1">
                  {form.channel === 'sms' 
                    ? "SMS: Use {invite_token} for 6-digit token" 
                    : "WhatsApp: Use {invite_url} for full invitation link"
                  }
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_default" checked={form.is_default} onChange={e=>setForm(f=>({...f,is_default:e.target.checked}))} className="cursor-pointer" />
                <label htmlFor="is_default" className="text-cream/60 text-sm">Set as default for this channel</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-gold flex-1">{saving?'Saving…':'Save'}</button>
                <button type="button" onClick={()=>setModal(false)} className="btn-ghost flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
