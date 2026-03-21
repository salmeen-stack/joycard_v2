'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res  = await fetch('/api/auth/admin-login', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        setLoading(false)
        return
      }

      toast.success(`Welcome, ${data.user.name}!`)
      window.location.href = '/admin'

    } catch {
      toast.error('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 right-0 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px]" />
        <div className="absolute bottom-0 -left-40 w-[400px] h-[400px] rounded-full bg-gold/3 blur-[80px]" />
      </div>

      <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.65}}
        className="relative z-10 w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/"><span className="font-display text-3xl text-gold font-semibold tracking-widest">joycard</span></Link>
          <p className="text-cream/30 text-xs mt-2 tracking-widest uppercase">Admin Portal</p>
        </div>

        <div className="glass-gold p-9">
          {/* Gold shield icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center">
              <span className="text-2xl">🛡️</span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold text-cream mb-1 text-center">Admin Access</h1>
          <p className="text-cream/40 text-sm mb-7 text-center">Restricted to administrators only</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Admin Email</label>
              <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="admin@joycard.com" className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••" className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 mt-1">
              {loading ? 'Verifying…' : 'Enter Admin Dashboard'}
            </button>
          </form>

          <div className="divider" />
          <div className="text-center space-y-1">
            <p className="text-cream/20 text-xs">Default: admin@joycard.com / Admin@1234</p>
            <p className="text-cream/25 text-xs">
              Not admin?{' '}
              <Link href="/login" className="text-teal/60 hover:text-teal underline underline-offset-2">
                Team Portal →
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-cream/15 text-xs mt-6 tracking-widest">
          © {new Date().getFullYear()} joycard
        </p>
      </motion.div>
    </div>
  )
}
