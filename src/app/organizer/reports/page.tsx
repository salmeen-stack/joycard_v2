'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import Link from 'next/link'

interface Report {
  type: string
  data: any
  checkInPattern?: any[]
}

interface Event {
  event_id: number
  event_title: string
  event_date: string
  guest_limit: number
  guests_added: number
}

export default function OrganizerReportsPage() {
  const [reports, setReports] = useState<Report | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState('overview')

  useEffect(() => {
    loadEvents()
    loadReport('overview')
  }, [])

  async function loadEvents() {
    try {
      const res = await fetch('/api/admin/assignments')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.assignments || [])
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    }
  }

  async function loadReport(type: string, eventId?: string) {
    setLoading(true)
    try {
      let url = `/api/organizer/reports?type=${type}`
      if (eventId) url += `&event_id=${eventId}`
      
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Failed to load report:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleReportTypeChange(type: string) {
    setReportType(type)
    if (type === 'event-details') {
      // Don't auto-load event-details until event is selected
      setReports(null)
    } else {
      loadReport(type)
    }
  }

  function handleEventChange(eventId: string) {
    setSelectedEvent(eventId)
    if (reportType === 'event-details' && eventId) {
      loadReport('event-details', eventId)
    }
  }

  function exportToCSV(data: any[], filename: string) {
    if (!data.length) return
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value}"` : value
      }).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading && !reports) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="glass-gold p-16 text-center">
          <div className="w-14 h-14 border-2 border-gold/25 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cream/35 text-sm">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Organizer</p>
        <h1 className="font-display text-4xl font-semibold text-cream">Reports & Analytics</h1>
      </motion.div>

      {/* Report Controls */}
      <div className="glass-gold p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="label">Report Type</label>
            <select 
              className="input"
              value={reportType}
              onChange={e => handleReportTypeChange(e.target.value)}
            >
              <option value="overview">Overview</option>
              <option value="event-details">Event Details</option>
              <option value="attendance">Attendance Report</option>
              <option value="engagement">Engagement Report</option>
            </select>
          </div>
          
          {reportType === 'event-details' && (
            <div>
              <label className="label">Select Event</label>
              <select 
                className="input"
                value={selectedEvent}
                onChange={e => handleEventChange(e.target.value)}
              >
                <option value="">Choose an event...</option>
                {events.map(event => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.event_title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button 
          onClick={() => reports && exportToCSV(
            Array.isArray(reports.data) ? reports.data : [reports.data], 
            `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}`
          )}
          disabled={!reports || loading}
          className="btn-gold disabled:opacity-40"
        >
          📊 Export to CSV
        </button>
      </div>

      {/* Report Content */}
      {reports && (
        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          className="space-y-6"
        >
          {reports.type === 'overview' && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-gold p-6">
                <h3 className="font-display text-lg font-semibold text-cream mb-4">Event Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-cream/45">Total Events</span>
                    <span className="text-gold font-bold">{reports.data.total_events || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/45">Total Guests</span>
                    <span className="text-cream font-bold">{reports.data.total_guests || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/45">Check-ins</span>
                    <span className="text-teal font-bold">{reports.data.total_checked_in || 0}</span>
                  </div>
                </div>
              </div>

              <div className="glass-gold p-6">
                <h3 className="font-display text-lg font-semibold text-cream mb-4">Invitation Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-cream/45">Sent</span>
                    <span className="text-gold font-bold">{reports.data.invitations_sent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/45">Single Entry</span>
                    <span className="text-cream font-bold">{reports.data.single_entries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/45">Double Entry</span>
                    <span className="text-cream font-bold">{reports.data.double_entries || 0}</span>
                  </div>
                </div>
              </div>

              <div className="glass-gold p-6">
                <h3 className="font-display text-lg font-semibold text-cream mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-cream/45">Check-in Rate</span>
                    <span className="text-teal font-bold">
                      {reports.data.total_guests > 0 
                        ? Math.round((reports.data.total_checked_in / reports.data.total_guests) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/45">Avg Check-in Time</span>
                    <span className="text-cream font-bold">
                      {Math.round(reports.data.avg_checkin_time_minutes || 0)} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reports.type === 'event-details' && reports.data && (
            <div className="glass-gold p-6">
              <h3 className="font-display text-2xl font-semibold text-cream mb-6">
                {reports.data.title}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="font-medium text-cream mb-4">Event Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-cream/45">Date:</span> {format(new Date(reports.data.date), 'PPP')}</p>
                    <p><span className="text-cream/45">Location:</span> {reports.data.location}</p>
                    <p><span className="text-cream/45">Description:</span> {reports.data.description || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-cream mb-4">Guest Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-cream/45">Total Guests:</span> {reports.data.total_guests}</p>
                    <p><span className="text-cream/45">Checked In:</span> {reports.data.checked_in}</p>
                    <p><span className="text-cream/45">Invitations Sent:</span> {reports.data.invitations_sent}</p>
                    <p><span className="text-cream/45">Email Guests:</span> {reports.data.email_guests}</p>
                    <p><span className="text-cream/45">WhatsApp Guests:</span> {reports.data.whatsapp_guests}</p>
                  </div>
                </div>
              </div>

              {reports.checkInPattern && reports.checkInPattern.length > 0 && (
                <div>
                  <h4 className="font-medium text-cream mb-4">Check-in Pattern (by Hour)</h4>
                  <div className="grid grid-cols-12 gap-2">
                    {Array.from({ length: 24 }, (_, hour) => {
                      const hourData = reports.checkInPattern?.find((p: any) => p.hour === hour)
                      const checkins = hourData?.checkins || 0
                      const maxHeight = 100
                      const height = checkins > 0 && reports.checkInPattern ? Math.max((checkins / Math.max(...reports.checkInPattern.map((p: any) => p.checkins))) * maxHeight, 10) : 0
                      
                      return (
                        <div key={hour} className="text-center">
                          <div className="h-20 flex items-end justify-center mb-1">
                            <div 
                              className="w-full bg-gold/60 rounded-t"
                              style={{ height: `${height}px` }}
                            />
                          </div>
                          <p className="text-cream/25 text-xs">{hour}</p>
                          {checkins > 0 && <p className="text-cream/45 text-xs">{checkins}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {reports.type === 'attendance' && (
            <div className="glass-gold overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Total Guests</th>
                    <th>Checked In</th>
                    <th>Check-in Rate</th>
                    <th>No Shows</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.data.map((event: any, index: number) => (
                    <tr key={index}>
                      <td className="font-medium text-cream">{event.event_title}</td>
                      <td className="text-cream/60">{format(new Date(event.event_date), 'MMM d, yyyy')}</td>
                      <td>{event.total_guests}</td>
                      <td className="text-teal">{event.checked_in}</td>
                      <td>
                        <span className={`badge ${
                          event.checkin_rate >= 80 ? 'badge-teal' : 
                          event.checkin_rate >= 60 ? 'badge-gold' : 'badge-red-400'
                        }`}>
                          {event.checkin_rate}%
                        </span>
                      </td>
                      <td className="text-orange-400">{event.no_shows}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reports.type === 'engagement' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-gold p-6">
                <h3 className="font-display text-lg font-semibold text-cream mb-4">Invitation Delivery</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-cream/45">Emails Sent</span>
                    <span className="text-gold font-bold">{reports.data.emails_sent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/45">WhatsApp Sent</span>
                    <span className="text-teal font-bold">{reports.data.whatsapp_sent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/45">Pending</span>
                    <span className="text-orange-400 font-bold">{reports.data.pending_invitations || 0}</span>
                  </div>
                </div>
              </div>

              <div className="glass-gold p-6">
                <h3 className="font-display text-lg font-semibold text-cream mb-4">Channel Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-cream/45">Total Check-ins</span>
                    <span className="text-teal font-bold">{reports.data.total_checkins || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/45">Email Check-ins</span>
                    <span className="text-gold font-bold">{reports.data.email_checkins || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream/45">WhatsApp Check-ins</span>
                    <span className="text-teal font-bold">{reports.data.whatsapp_checkins || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!reports && !loading && (
        <div className="glass-gold p-16 text-center">
          <p className="text-4xl mb-4">📊</p>
          <h3 className="font-display text-xl text-cream mb-2">No Report Data</h3>
          <p className="text-cream/35 text-sm">
            {reportType === 'event-details' 
              ? 'Please select an event to view details.'
              : 'Select a report type to view analytics.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
