'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Event { id:number; title:string; date:string; location:string; description?:string; total_guests:number; checked_in:number }

const EMPTY = { title:'', date:'', location:'', description:'' }

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Event|null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const eventsPerPage = 20

  const load = async () => {
    try {
      const r = await fetch('/api/events'); const d = await r.json()
      setEvents(d.events || [])
    } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  // Client-side search and pagination
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(search.toLowerCase()) ||
    event.location.toLowerCase().includes(search.toLowerCase()) ||
    new Date(event.date).toLocaleDateString().toLowerCase().includes(search.toLowerCase())
  )

  const indexOfLastEvent = currentPage * eventsPerPage
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent)
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleClearSearch = () => {
    setSearch('')
    setCurrentPage(1)
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setModal(true) }
  function openEdit(ev: Event) { setEditing(ev); setForm({ title:ev.title, date:ev.date.slice(0,16), location:ev.location, description:ev.description||'' }); setModal(true) }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      const url = editing ? `/api/events/${editing.id}` : '/api/events'
      const r   = await fetch(url, { method: editing?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const d   = await r.json()
      if (!r.ok) { toast.error(d.error); return }
      toast.success(editing ? 'Event updated!' : 'Event created!')
      setModal(false); load()
    } finally { setSaving(false) }
  }

  async function del(id: number) {
    if (!confirm('Delete this event and all its guests?')) return
    const r = await fetch(`/api/events/${id}`,{method:'DELETE'})
    r.ok ? (toast.success('Deleted'), load()) : toast.error('Failed')
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="flex items-center justify-between mb-10">
        <div>
          <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-display text-4xl font-semibold text-cream">Events</h1>
          <p className="text-cream/35 text-sm mt-1">
            {events.length} total events
            {search && ` • ${filteredEvents.length} found`}
          </p>
        </div>
        <button onClick={openCreate} className="btn-gold">+ New Event</button>
      </motion.div>

      {/* Search Bar */}
      <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            placeholder="Search events by name, location, or date..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 input"
          />
          <button type="submit" className="btn-gold">🔍 Search</button>
          {search && (
            <button 
              type="button" 
              onClick={handleClearSearch}
              className="btn-ghost"
            >
              ✖ Clear
            </button>
          )}
        </form>
      </motion.div>

      <AnimatePresence>
        {modal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm">
            <motion.div initial={{scale:.95,y:20}} animate={{scale:1,y:0}} exit={{scale:.95}} className="glass-gold p-8 w-full max-w-lg">
              <h2 className="font-display text-2xl font-semibold text-cream mb-6">{editing?'Edit':'Create'} Event</h2>
              <form onSubmit={save} className="space-y-4">
                <div><label className="label">Title</label><input className="input" required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Annual Gala 2025" /></div>
                <div><label className="label">Date & Time</label><input type="datetime-local" className="input" required value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
                <div><label className="label">Location</label><input className="input" required value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Grand Ballroom, City Hotel" /></div>
                <div><label className="label">Description (optional)</label><textarea className="input" rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Event details…" /></div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-gold flex-1">{saving?'Saving…':'Save Event'}</button>
                  <button type="button" onClick={()=>setModal(false)} className="btn-ghost flex-1">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array(4).fill(0).map((_,i)=><div key={i} className="glass-gold p-6 h-40 animate-pulse" />)}</div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass-gold p-16 text-center">
          <p className="text-4xl mb-4">📅</p>
          <h3 className="font-display text-xl text-cream mb-2">
            {search ? 'No Events Found' : 'No Events Yet'}
          </h3>
          <p className="text-cream/35 text-sm mb-6">
            {search ? 'Try adjusting your search terms' : 'Create your first event to get started.'}
          </p>
          <button onClick={() => search ? handleClearSearch() : openCreate()} className="btn-gold">
            {search ? 'Clear Search' : 'Create Event'}
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {currentEvents.map((ev,i) => (
              <motion.div key={ev.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.06}} className="glass-gold p-6">
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-cream mb-0.5">{ev.title}</h3>
                    <p className="text-gold/65 text-sm">{format(new Date(ev.date),'MMM d, yyyy · h:mm a')}</p>
                    <p className="text-cream/35 text-xs mt-0.5">{ev.location}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={()=>openEdit(ev)} className="p-2 rounded-lg bg-white/5 hover:bg-gold/10 hover:text-gold text-cream/35 transition-all text-sm">✏️</button>
                    <button onClick={()=>del(ev.id)} className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-cream/35 transition-all text-sm">🗑️</button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-gold font-display text-xl font-bold">{ev.total_guests}</p>
                    <p className="text-cream/30 text-xs uppercase tracking-widest">Guests</p>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-teal font-display text-xl font-bold">{ev.checked_in}</p>
                    <p className="text-cream/30 text-xs uppercase tracking-widest">Checked In</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-ghost px-3 py-1 disabled:opacity-40"
              >
                ← Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`px-3 py-1 rounded-md text-sm transition-all ${
                      page === currentPage 
                        ? 'bg-gold text-navy-900 font-semibold' 
                        : 'btn-ghost hover:bg-gold/10'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-ghost px-3 py-1 disabled:opacity-40"
              >
                Next →
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
