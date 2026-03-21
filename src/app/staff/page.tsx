'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format, isToday, isFuture, isPast } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Ev { 
  event_id: number; 
  event_title: string; 
  event_date: string; 
  event_location: string; 
  description?: string;
  total_guests: number; 
  checked_in: number;
  assigned: boolean;
  assigned_to_id?: number;
  assigned_to_name?: string;
  assigned_to_email?: string;
  assigned_to_phone?: string;
}

function Card({ ev, today, onTakeEvent, onLeaveEvent, currentAssignment }: { 
  ev:Ev; 
  today?:boolean; 
  onTakeEvent?: (eventId: number) => void; 
  onLeaveEvent?: (eventId: number) => void;
  currentAssignment?: boolean;
}) {
  const rem = ev.total_guests - ev.checked_in
  const pct = ev.total_guests > 0 ? Math.round((ev.checked_in/ev.total_guests)*100) : 0
  const [taking, setTaking] = useState(false)
  const [leaving, setLeaving] = useState(false)
  
  async function handleTakeEvent() {
    if (!onTakeEvent) return
    setTaking(true)
    try {
      const res = await fetch('/api/staff/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: ev.event_id })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message)
        onTakeEvent(ev.event_id)
      } else {
        if (data.error.includes('already assigned to another staff')) {
          toast.error('This event is already assigned to another staff member')
        } else if (data.error.includes('already assigned to an event')) {
          toast.error('You are already assigned to an event. Please leave your current event before taking a new one.')
        } else {
          toast.error(data.error || 'Failed to take event')
        }
      }
    } catch (error) {
      toast.error('Failed to take event')
    } finally {
      setTaking(false)
    }
  }
  
  async function handleLeaveEvent() {
    if (!onLeaveEvent) return
    setLeaving(true)
    try {
      const res = await fetch('/api/staff/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: ev.event_id })
      })
      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message)
        onLeaveEvent(ev.event_id)
      } else {
        toast.error(data.error || 'Failed to leave event')
      }
    } catch (error) {
      toast.error('Failed to leave event')
    } finally {
      setLeaving(false)
    }
  }
  
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className={`glass-gold p-6 ${today?'border-gold/40':''}`}>
      {today && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-gold text-xs tracking-widest uppercase">Today</span>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-display text-lg font-semibold text-cream">{ev.event_title}</h3>
        {ev.assigned ? (
          <span className="badge badge-teal text-xs">Assigned to You</span>
        ) : ev.assigned_to_name ? (
          <div className="text-right">
            <span className="badge badge-orange text-xs block">Assigned to {ev.assigned_to_name}</span>
            {ev.assigned_to_phone && (
              <span className="text-cream/35 text-xs mt-1 block">{ev.assigned_to_phone}</span>
            )}
            {ev.assigned_to_email && (
              <span className="text-gold/50 text-xs block">{ev.assigned_to_email}</span>
            )}
          </div>
        ) : (
          <span className="badge badge-slate text-xs">Available</span>
        )}
      </div>
      
      <p className="text-gold/60 text-sm">{format(new Date(ev.event_date),'MMM d, yyyy · h:mm a')}</p>
      <p className="text-cream/30 text-xs mt-0.5 mb-4">{ev.event_location}</p>
      
      {ev.description && (
        <p className="text-cream/35 text-sm mb-4 line-clamp-2">{ev.description}</p>
      )}
      
      <div className="flex gap-3 mb-4">
        {[{label:'Total',v:ev.total_guests,c:'text-cream'},{label:'In',v:ev.checked_in,c:'text-teal'},{label:'Left',v:rem,c:'text-gold'}].map(s=>(
          <div key={s.label} className="flex-1 bg-white/5 rounded-xl p-3 text-center">
            <p className={`font-display text-xl font-bold ${s.c}`}>{s.v}</p>
            <p className="text-cream/25 text-xs">{s.label}</p>
          </div>
        ))}
      </div>
      
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-teal rounded-full transition-all" style={{width:`${pct}%`}} />
      </div>
      
      {ev.assigned ? (
        <div className="flex gap-2">
          <Link href={`/staff/scan?event=${ev.event_id}`} className="btn-gold flex-1 text-center block py-3 text-sm">
            📱 Open QR Scanner
          </Link>
          <button
            onClick={handleLeaveEvent}
            disabled={leaving}
            className="btn-ghost flex-1 py-3 text-sm disabled:opacity-40"
          >
            {leaving ? 'Leaving...' : '🚪 Leave'}
          </button>
        </div>
      ) : (
        <button
          onClick={handleTakeEvent}
          disabled={taking || !!ev.assigned_to_name || currentAssignment}
          className="btn-gold w-full py-3 text-sm disabled:opacity-40"
        >
          {taking ? 'Taking Event...' : currentAssignment ? '🚫 Already Assigned to Event' : '🎯 Take This Event'}
        </button>
      )}
    </motion.div>
  )
}

export default function StaffDashboard() {
  const [evs, setEvs] = useState<Ev[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{name: string, email: string, role: string} | null>(null)
  const [currentAssignment, setCurrentAssignment] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState('')

  const refreshEvents = () => {
    fetch('/api/staff/events')
      .then(r=>r.ok?r.json():null)
      .then(d=> {
        setEvs(d?.assignments||[])
        // Check if current user is already assigned to any event in the date range
        const hasActiveAssignment = d?.assignments?.some((event: Ev) => 
          event.assigned
        )
        setCurrentAssignment(hasActiveAssignment || false)
      })
      .catch(console.error)
      .finally(()=>setLoading(false))
  }

  useEffect(refreshEvents, [])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) { setCurrentUser(d.user) } })
      .catch(() => {})
  }, [])

  const today    = evs.filter(e=>isToday(new Date(e.event_date)))
  const upcoming = evs.filter(e=>isFuture(new Date(e.event_date))&&!isToday(new Date(e.event_date)))
  const past     = evs.filter(e=>isPast(new Date(e.event_date))&&!isToday(new Date(e.event_date)))

  // Filter events based on search term
  const filterEvents = (events: Ev[]) => {
    if (!searchTerm.trim()) return events
    const term = searchTerm.toLowerCase()
    return events.filter(event => 
      event.event_title.toLowerCase().includes(term) ||
      event.event_location.toLowerCase().includes(term) ||
      format(new Date(event.event_date), 'MMM d, yyyy').toLowerCase().includes(term) ||
      (event.description && event.description.toLowerCase().includes(term))
    )
  }

  const filteredToday = filterEvents(today)
  const filteredUpcoming = filterEvents(upcoming)
  const filteredPast = filterEvents(past)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-10">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Staff</p>
            <h1 className="font-display text-4xl font-semibold text-cream">Upcoming Events</h1>
            <p className="text-cream/35 text-sm mt-1">
              {currentAssignment ? '🚫 You are currently assigned to an event' : '✅ You can take an event'}
            </p>
          </div>
          {currentUser && (
            <div className="glass-gold px-4 py-2 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-gold text-lg">👔</span>
                </div>
                <div>
                  <p className="text-cream font-medium">{currentUser.name}</p>
                  <p className="text-cream/60 text-sm">{currentUser.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="mb-8">
        <div className="glass-gold p-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cream/40">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search events by title, location, date, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cream/40 hover:text-cream transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-3 text-cream/35 text-sm">
              Found {filteredToday.length + filteredUpcoming.length + filteredPast.length} events matching "{searchTerm}"
            </div>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-4">{Array(2).fill(0).map((_,i)=><div key={i} className="glass-gold p-6 h-44 animate-pulse" />)}</div>
      ) : evs.length===0 ? (
        <div className="glass-gold p-16 text-center">
          <p className="text-4xl mb-4">📅</p>
          <h3 className="font-display text-xl text-cream mb-2">
            {searchTerm ? 'No Matching Events' : 'No Upcoming Events'}
          </h3>
          <p className="text-cream/35 text-sm">
            {searchTerm 
              ? `No events found matching "${searchTerm}". Try different keywords.` 
              : 'No events scheduled for today or the next 2 days.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredToday.length>0    && <div><h2 className="font-display text-lg text-gold mb-4">Today</h2><div className="space-y-4">{filteredToday.map(ev=><Card key={ev.event_id} ev={ev} today onTakeEvent={refreshEvents} onLeaveEvent={refreshEvents} currentAssignment={currentAssignment} />)}</div></div>}
          {filteredUpcoming.length>0 && <div><h2 className="font-display text-lg text-cream/60 mb-4">Upcoming</h2><div className="space-y-4">{filteredUpcoming.map(ev=><Card key={ev.event_id} ev={ev} onTakeEvent={refreshEvents} onLeaveEvent={refreshEvents} currentAssignment={currentAssignment} />)}</div></div>}
          {filteredPast.length>0     && <div className="opacity-55"><h2 className="font-display text-lg text-cream/30 mb-4">Past</h2><div className="space-y-4">{filteredPast.map(ev=><Card key={ev.event_id} ev={ev} currentAssignment={currentAssignment} />)}</div></div>}
          {searchTerm && filteredToday.length===0 && filteredUpcoming.length===0 && filteredPast.length===0 && (
            <div className="glass-gold p-16 text-center">
              <p className="text-4xl mb-4">🔍</p>
              <h3 className="font-display text-xl text-cream mb-2">No Events Found</h3>
              <p className="text-cream/35 text-sm">
                No events found matching "{searchTerm}". Try searching by event title, location, or date.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
