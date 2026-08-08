'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface Event { id: number; title: string; date: string }
interface Template { id: number; name: string; content: string; channel: string }
interface ReminderResult { invitation_id: number; guest_name: string; contact: string; channel: string; sms_sent: boolean; sms_status: string; sms_message: string }
interface Summary { total: number; sms_sent: number; sms_failed: number; sms_skipped: number }

export default function RemindersPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [reminderType, setReminderType] = useState<'event' | 'contribution'>('event')
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [guestFilter, setGuestFilter] = useState<{ channel?: string; status?: string }>({})
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<ReminderResult[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEvents()
    loadTemplates()
  }, [])

  async function loadEvents() {
    try {
      const res = await fetch('/api/events')
      if (!res.ok) {
        console.error('Failed to fetch events:', res.status)
        setError('Failed to load events')
        setEvents([])
        return
      }
      const data = await res.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error('Error loading events:', err)
      setError('Failed to load events')
      setEvents([])
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch('/api/templates?channel=sms')
      if (!res.ok) {
        console.error('Failed to fetch templates:', res.status)
        setTemplates([])
        return
      }
      const data = await res.json()
      setTemplates(Array.isArray(data.templates) ? data.templates : [])
    } catch (err) {
      console.error('Failed to load templates')
      setTemplates([])
    }
  }

  async function handleSendReminders() {
    if (!selectedEvent) {
      setError('Please select an event')
      return
    }

    setSending(true)
    setError('')
    setResults([])
    setSummary(null)

    try {
      const res = await fetch('/api/reminders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent,
          reminder_type: reminderType,
          template_id: selectedTemplate,
          guest_filter: guestFilter
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Failed to send reminders')
        return
      }

      setResults(data.results)
      setSummary(data.summary)
    } catch (err) {
      setError('Failed to send reminders')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-cream mb-2">Bulk Reminders</h1>
        <p className="text-cream/35 text-sm">Send SMS reminders to guests about events or contributions</p>
      </motion.div>

      <div className="grid gap-6 max-w-4xl">
        {/* Event Selection */}
        <div className="glass-gold p-6">
          <h3 className="font-display text-base font-semibold text-cream mb-4">Select Event</h3>
          <select
            value={selectedEvent || ''}
            onChange={(e) => setSelectedEvent(e.target.value ? Number(e.target.value) : null)}
            className="input w-full"
          >
            <option value="">Choose an event...</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.title} - {new Date(event.date).toLocaleDateString()}</option>
            ))}
          </select>
        </div>

        {/* Reminder Type */}
        <div className="glass-gold p-6">
          <h3 className="font-display text-base font-semibold text-cream mb-4">Reminder Type</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="event"
                checked={reminderType === 'event'}
                onChange={(e) => setReminderType(e.target.value as 'event' | 'contribution')}
                className="w-4 h-4"
              />
              <span className="text-cream">Event Reminder</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="contribution"
                checked={reminderType === 'contribution'}
                onChange={(e) => setReminderType(e.target.value as 'event' | 'contribution')}
                className="w-4 h-4"
              />
              <span className="text-cream">Contribution Reminder</span>
            </label>
          </div>
        </div>

        {/* Template Selection */}
        <div className="glass-gold p-6">
          <h3 className="font-display text-base font-semibold text-cream mb-4">SMS Template</h3>
          <select
            value={selectedTemplate || ''}
            onChange={(e) => setSelectedTemplate(e.target.value ? Number(e.target.value) : null)}
            className="input w-full"
          >
            <option value="">Use default template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
          {selectedTemplate && templates.find(t => t.id === selectedTemplate) && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <p className="text-cream/35 text-xs uppercase tracking-widest mb-1">Preview</p>
              <p className="text-cream/70 text-sm">{templates.find(t => t.id === selectedTemplate)?.content}</p>
            </div>
          )}
          <p className="text-cream/25 text-xs mt-2">Select a custom template or leave empty to use default reminder message</p>
        </div>

        {/* Guest Filter */}
        <div className="glass-gold p-6">
          <h3 className="font-display text-base font-semibold text-cream mb-4">Guest Filter (Optional)</h3>
          <div className="space-y-3">
            <div>
              <label className="text-cream/35 text-xs uppercase tracking-widest mb-2 block">Channel</label>
              <select
                value={guestFilter.channel || ''}
                onChange={(e) => setGuestFilter({...guestFilter, channel: e.target.value || undefined})}
                className="input w-full"
              >
                <option value="">All channels</option>
                <option value="sms">SMS only</option>
                <option value="whatsapp">WhatsApp only</option>
              </select>
            </div>
            <div>
              <label className="text-cream/35 text-xs uppercase tracking-widest mb-2 block">Status</label>
              <select
                value={guestFilter.status || ''}
                onChange={(e) => setGuestFilter({...guestFilter, status: e.target.value || undefined})}
                className="input w-full"
              >
                <option value="">All guests</option>
                <option value="not_sent">Not yet sent SMS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendReminders}
          disabled={sending || !selectedEvent}
          className="btn-gold w-full py-4"
        >
          {sending ? 'Sending Reminders...' : 'Send Bulk Reminders'}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {summary && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="glass-gold p-6">
            <h3 className="font-display text-base font-semibold text-cream mb-4">Send Summary</h3>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="font-display text-2xl font-bold text-cream">{summary.total}</p>
                <p className="text-cream/35 text-xs uppercase tracking-widest mt-1">Total</p>
              </div>
              <div className="text-center p-4 bg-teal/10 rounded-xl">
                <p className="font-display text-2xl font-bold text-teal">{summary.sms_sent}</p>
                <p className="text-teal/35 text-xs uppercase tracking-widest mt-1">Sent</p>
              </div>
              <div className="text-center p-4 bg-rose-500/10 rounded-xl">
                <p className="font-display text-2xl font-bold text-rose-400">{summary.sms_failed}</p>
                <p className="text-rose-400/35 text-xs uppercase tracking-widest mt-1">Failed</p>
              </div>
              <div className="text-center p-4 bg-amber-500/10 rounded-xl">
                <p className="font-display text-2xl font-bold text-amber-400">{summary.sms_skipped}</p>
                <p className="text-amber-400/35 text-xs uppercase tracking-widest mt-1">Skipped</p>
              </div>
            </div>

            <h4 className="font-display text-sm font-semibold text-cream mb-3">Detailed Results</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((result, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-cream text-sm font-medium">{result.guest_name}</p>
                    <p className="text-cream/35 text-xs">{result.contact}</p>
                  </div>
                  <div className="text-right">
                    {result.sms_sent ? (
                      <span className="text-teal text-xs">✓ Sent</span>
                    ) : result.sms_status === 'skipped' ? (
                      <span className="text-amber-400 text-xs">⊘ Skipped</span>
                    ) : (
                      <span className="text-rose-400 text-xs">✗ Failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
