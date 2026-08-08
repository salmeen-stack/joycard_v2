'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface Template {
  id: number
  name: string
  channel: string
  content: string
  is_default: boolean
  organizer_id: number | null
  created_at: string
  updated_at: string
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: '', channel: 'sms', content: '', is_default: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    try {
      const method = editingTemplate ? 'PUT' : 'POST'
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates'
      const body = editingTemplate 
        ? { ...form }
        : form
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (res.ok) {
        toast.success(editingTemplate ? 'Template updated!' : 'Template created!')
        setShowModal(false)
        setEditingTemplate(null)
        setForm({ name: '', channel: 'sms', content: '', is_default: false })
        loadTemplates()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to save template')
      }
    } catch (error) {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTemplate(id: number, name: string) {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return
    
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast.success('Template deleted')
        loadTemplates()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete template')
      }
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  function openEditModal(template: Template) {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      channel: template.channel,
      content: template.content,
      is_default: template.is_default
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-gold p-6 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="flex items-center justify-between mb-10">
        <div>
          <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Organizer</p>
          <h1 className="font-display text-4xl font-semibold text-cream">Message Templates</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-gold">
          + Create Template
        </button>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            transition={{delay:index * 0.1}}
            className="glass-gold p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-display text-xl font-semibold text-cream mb-2">
                  {template.name}
                </h3>
                <p className={`text-sm mb-1 ${template.channel === 'sms' ? 'text-gold/60' : 'text-teal/60'}`}>
                  {template.channel === 'sms' ? '📱 SMS' : '💬 WhatsApp'}
                </p>
                {template.is_default ? (
                  <span className="badge badge-emerald text-xs">Default</span>
                ) : (
                  <span className="badge badge-slate text-xs">Custom</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(template)}
                  className="btn-ghost text-xs py-1 px-2"
                >
                  Edit
                </button>
                {template.organizer_id && (
                  <button
                    onClick={() => deleteTemplate(template.id, template.name)}
                    className="btn-ghost text-xs py-1 px-2 text-red-400"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-white/5 p-3 rounded-lg">
              <p className="text-cream/35 text-xs mb-2">Preview:</p>
              <p className="text-cream/60 text-sm line-clamp-3">
                {template.content.substring(0, 150)}...
              </p>
            </div>
            
            <div className="mt-4 text-cream/25 text-xs">
              Created: {new Date(template.created_at).toLocaleDateString()}
            </div>
          </motion.div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="glass-gold p-16 text-center">
          <p className="text-4xl mb-4">�</p>
          <h3 className="font-display text-xl text-cream mb-2">No Templates Yet</h3>
          <p className="text-cream/35 text-sm mb-6">Create your first message template for SMS or WhatsApp invitations.</p>
          <button onClick={() => setShowModal(true)} className="btn-gold">
            Create Template
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showModal || editingTemplate) && (
          <motion.div
            initial={{opacity:0}}
            animate={{opacity:1}}
            exit={{opacity:0}}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-navy-900/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{scale:.95,y:20}}
              animate={{scale:1,y:0}}
              exit={{scale:.95}}
              className="glass-gold p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="font-display text-2xl font-semibold text-cream mb-6">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              
              <form onSubmit={saveTemplate} className="space-y-4">
                <div>
                  <label className="label">Template Name</label>
                  <input
                    className="input"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Birthday Invitation"
                  />
                </div>
                
                <div>
                  <label className="label">Channel</label>
                  <select
                    className="input"
                    value={form.channel}
                    onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                  >
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                
                <div>
                  <label className="label">Content</label>
                  <textarea
                    className="input resize-none"
                    rows={8}
                    required
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder={form.channel === 'sms' 
                      ? "Hi {guest_name}! You're invited to {event_title}. Your invitation token: {invite_token}"
                      : "Hi {guest_name}! You're invited to {event_title}. View your invitation: {invite_url}"
                    }
                  />
                  <p className="text-cream/25 text-xs mt-2">
                    {form.channel === 'sms' 
                      ? "SMS variables: {guest_name}, {event_title}, {invite_token}"
                      : "WhatsApp variables: {guest_name}, {event_title}, {event_date}, {event_location}, {card_type}, {dress_code}, {invite_url}"
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={form.is_default}
                    onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                    className="cursor-pointer"
                  />
                  <label htmlFor="is_default" className="text-cream/60 text-sm">
                    Set as default for this channel
                  </label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-gold flex-1"
                  >
                    {saving ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTemplate(null)
                      setForm({ name: '', channel: 'sms', content: '', is_default: false })
                    }}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
