'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface Stats { total_events:number; total_organizers:number; total_staff:number; total_guests:number; invitations_sent:number; total_checked_in:number }
interface EStat  { event_id:number; event_title:string; event_date:string; total_guests:number; invitations_sent:number; checked_in:number }

function Bar({ v, max, color }: { v:number; max:number; color:string }) {
  const pct = max>0 ? (v/max)*100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.8}} />
      </div>
      <span className="text-cream/35 text-xs w-6 text-right">{v}</span>
    </div>
  )
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<Stats|null>(null)
  const [evs,   setEvs]   = useState<EStat[]>([])
  const [load,  setLoad]  = useState(true)

  useEffect(()=>{
    fetch('/api/admin/analytics')
      .then(r=>r.ok?r.json():null)
      .then(d=>{ if(d){setStats(d.stats);setEvs(d.eventStats)} })
      .catch(console.error)
      .finally(()=>setLoad(false))
  },[])

  const rate = stats&&stats.invitations_sent>0 ? Math.round((stats.total_checked_in/stats.invitations_sent)*100) : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-display text-4xl font-semibold text-cream">Analytics</h1>
      </motion.div>

      {load ? <div className="text-cream/30 text-sm">Loading…</div> : stats && <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {label:'Events',     value:stats.total_events,     icon:'📅', sub:'Created'},
            {label:'Guests',     value:stats.total_guests,     icon:'🎟️', sub:'Total'},
            {label:'Sent',       value:stats.invitations_sent, icon:'📨', sub:'Delivered'},
            {label:'Checked In', value:stats.total_checked_in, icon:'✅', sub:`${rate}% rate`},
          ].map((c,i)=>(
            <motion.div key={i} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*.08}} className="stat-card">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="font-display text-3xl font-bold text-gold mb-1">{c.value.toLocaleString()}</div>
              <p className="text-cream font-medium text-sm">{c.label}</p>
              <p className="text-cream/30 text-xs">{c.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <div className="glass-gold p-6">
            <h3 className="font-display text-lg font-semibold text-cream mb-5">Team</h3>
            <div className="space-y-4">
              <div><div className="flex justify-between mb-1"><span className="text-cream/50 text-sm">Organizers</span><span className="text-gold text-sm">{stats.total_organizers}</span></div>
                <Bar v={stats.total_organizers} max={Math.max(stats.total_organizers,stats.total_staff,1)} color="bg-gold" /></div>
              <div><div className="flex justify-between mb-1"><span className="text-cream/50 text-sm">Staff</span><span className="text-teal text-sm">{stats.total_staff}</span></div>
                <Bar v={stats.total_staff} max={Math.max(stats.total_organizers,stats.total_staff,1)} color="bg-teal" /></div>
            </div>
          </div>
          <div className="glass-gold p-6">
            <h3 className="font-display text-lg font-semibold text-cream mb-5">Invitation Funnel</h3>
            <div className="space-y-4">
              <div><div className="flex justify-between mb-1"><span className="text-cream/50 text-sm">Total Guests</span><span className="text-cream/50 text-sm">{stats.total_guests}</span></div>
                <Bar v={stats.total_guests} max={stats.total_guests||1} color="bg-navy-600" /></div>
              <div><div className="flex justify-between mb-1"><span className="text-cream/50 text-sm">Invitations Sent</span><span className="text-gold text-sm">{stats.invitations_sent}</span></div>
                <Bar v={stats.invitations_sent} max={stats.total_guests||1} color="bg-gold" /></div>
              <div><div className="flex justify-between mb-1"><span className="text-cream/50 text-sm">Checked In</span><span className="text-teal text-sm">{stats.total_checked_in}</span></div>
                <Bar v={stats.total_checked_in} max={stats.total_guests||1} color="bg-teal" /></div>
            </div>
          </div>
        </div>

        <div className="glass-gold p-6">
          <h3 className="font-display text-lg font-semibold text-cream mb-6">Per-Event Breakdown</h3>
          {evs.length===0 ? <p className="text-cream/30 text-sm">No event data yet.</p> : (
            <div className="space-y-5">
              {evs.map((ev,i)=>{
                const pct = ev.total_guests>0 ? Math.round((ev.checked_in/ev.total_guests)*100) : 0
                return (
                  <motion.div key={ev.event_id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*.05}}>
                    <div className="flex justify-between mb-1.5">
                      <div><p className="text-cream text-sm font-medium">{ev.event_title}</p><p className="text-cream/30 text-xs">{format(new Date(ev.event_date),'MMM d, yyyy')}</p></div>
                      <div className="flex gap-3 text-xs"><span className="text-cream/35">{ev.total_guests} guests</span><span className="text-gold">{ev.invitations_sent} sent</span><span className="text-teal">{ev.checked_in} in · {pct}%</span></div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-teal rounded-full" initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:.8,delay:i*.05}} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </>}
    </div>
  )
}
