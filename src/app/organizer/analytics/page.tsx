'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'

interface Analytics {
  total_events: number
  total_guests: number
  total_checked_in: number
  total_invitations_sent: number
  total_invitations_pending: number
}

interface Activity {
  event_title: string
  guest_name: string
  guest_added: string
  sent_via_email: boolean
  sent_via_whatsapp: boolean
  scanned_at: string | null
}

export default function OrganizerAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/organizer/analytics')
        if (res.ok) {
          const data = await res.json()
          setAnalytics(data.analytics)
          setRecentActivity(data.recentActivity)
        }
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-gold p-6 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const checkInRate = analytics ? Math.round((analytics.total_checked_in / analytics.total_guests) * 100) || 0 : 0
  const invitationRate = analytics ? Math.round((analytics.total_invitations_sent / analytics.total_guests) * 100) || 0 : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Organizer</p>
        <h1 className="font-display text-4xl font-semibold text-cream">Analytics Dashboard</h1>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="glass-gold p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cream/35 text-xs uppercase tracking-widest">Total Events</p>
            <span className="text-2xl">🎉</span>
          </div>
          <p className="font-display text-3xl font-bold text-cream">{analytics?.total_events || 0}</p>
          <p className="text-cream/25 text-xs mt-1">Active events</p>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="glass-gold p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cream/35 text-xs uppercase tracking-widest">Total Guests</p>
            <span className="text-2xl">👥</span>
          </div>
          <p className="font-display text-3xl font-bold text-cream">{analytics?.total_guests || 0}</p>
          <p className="text-cream/25 text-xs mt-1">Registered guests</p>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="glass-gold p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cream/35 text-xs uppercase tracking-widest">Check-ins</p>
            <span className="text-2xl">✓</span>
          </div>
          <p className="font-display text-3xl font-bold text-teal">{analytics?.total_checked_in || 0}</p>
          <p className="text-cream/25 text-xs mt-1">{checkInRate}% check-in rate</p>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}} className="glass-gold p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cream/35 text-xs uppercase tracking-widest">Invitations Sent</p>
            <span className="text-2xl">📧</span>
          </div>
          <p className="font-display text-3xl font-bold text-gold">{analytics?.total_invitations_sent || 0}</p>
          <p className="text-cream/25 text-xs mt-1">{invitationRate}% sent rate</p>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}} className="glass-gold p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cream/35 text-xs uppercase tracking-widest">Pending Invites</p>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="font-display text-3xl font-bold text-orange-400">{analytics?.total_invitations_pending || 0}</p>
          <p className="text-cream/25 text-xs mt-1">Awaiting delivery</p>
        </motion.div>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.6}} className="glass-gold p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cream/35 text-xs uppercase tracking-widest">Quick Actions</p>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="space-y-2">
            <Link href="/organizer" className="btn-ghost text-xs py-2 w-full text-center block">View Events</Link>
            <Link href="/organizer/guests" className="btn-gold text-xs py-2 w-full text-center block">Manage Guests</Link>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.7}} className="glass-gold p-6">
        <h2 className="font-display text-xl font-semibold text-cream mb-4">Recent Activity</h2>
        
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-cream/35 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <p className="text-cream font-medium">{activity.guest_name}</p>
                  <p className="text-cream/45 text-xs">{activity.event_title}</p>
                  <p className="text-cream/25 text-xs">Added {format(new Date(activity.guest_added), 'MMM d, h:mm a')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {activity.scanned_at && <span className="badge badge-teal text-xs">Checked In</span>}
                  {activity.sent_via_email && <span className="badge badge-gold text-xs">Email Sent</span>}
                  {activity.sent_via_whatsapp && <span className="badge badge-teal text-xs">WhatsApp Sent</span>}
                  {!activity.sent_via_email && !activity.sent_via_whatsapp && !activity.scanned_at && (
                    <span className="badge badge-slate text-xs">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
