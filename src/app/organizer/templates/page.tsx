'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface Template {
  id: number
  name: string
  subject: string
  body: string
  organizer_id: number | null
  created_at: string
  updated_at: string
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', body: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/organizer/templates')
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
      const body = editingTemplate 
        ? { id: editingTemplate.id, ...form }
        : form
      
      const res = await fetch('/api/organizer/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (res.ok) {
        toast.success(editingTemplate ? 'Template updated!' : 'Template created!')
        setShowModal(false)
        setEditingTemplate(null)
        setForm({ name: '', subject: '', body: '' })
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
      const res = await fetch('/api/organizer/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
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
      subject: template.subject,
      body: template.body
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
          <h1 className="font-display text-4xl font-semibold text-cream">Email Templates</h1>
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
                <p className="text-gold/60 text-sm mb-1">Subject: {template.subject}</p>
                {template.organizer_id ? (
                  <span className="badge badge-teal text-xs">Your Template</span>
                ) : (
                  <span className="badge badge-slate text-xs">System Template</span>
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
                {template.body.substring(0, 150)}...
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
          <p className="text-4xl mb-4">📧</p>
          <h3 className="font-display text-xl text-cream mb-2">No Templates Yet</h3>
          <p className="text-cream/35 text-sm mb-6">Create your first email template to get started.</p>
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
                    placeholder="Wedding Invitation"
                  />
                </div>
                
                <div>
                  <label className="label">Email Subject</label>
                  <input
                    className="input"
                    required
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="You are invited to our wedding!"
                  />
                </div>
                
                <div>
                  <label className="label">Email Body</label>
                  <textarea
                    className="input resize-none"
                    rows={8}
                    required
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Dear {{guest_name}},&#10;&#10;You are cordially invited...&#10;&#10;Best regards,&#10;{{organizer_name}}"
                  />
                  <p className="text-cream/25 text-xs mt-2">
                    Available variables: {'{{guest_name}}'}, {'{{event_title}}'}, {'{{event_date}}'}, {'{{event_location}}'}, {'{{dress_code}}'}, {'{{organizer_name}}'}, {'{{rsvp_date}}'}
                  </p>
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
                      setForm({ name: '', subject: '', body: '' })
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
