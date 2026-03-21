'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'organizer' | 'staff'>('organizer')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        setLoading(false)
        return
      }

      toast.success(`Welcome, ${data.user.name}!`)

      // Redirect based on role
      window.location.href = data.user.role === 'organizer' ? '/organizer' : '/staff'

    } catch (error) {
      toast.error('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-teal/5 blur-[80px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.65 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-display text-3xl text-gold font-semibold tracking-widest">joycard</span>
          </Link>
          <p className="text-cream/30 text-xs mt-2 tracking-widest uppercase">Team Portal</p>
        </div>

        <div className="glass-gold p-9">
          <h1 className="font-display text-2xl font-semibold text-cream mb-1">Sign In</h1>
          <p className="text-cream/40 text-sm mb-7">Access your dashboard</p>

          {/* Role Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
            {(['organizer', 'staff'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-semibold tracking-wide transition-all ${
                  role === r 
                    ? 'bg-gold text-navy-900' 
                    : 'bg-transparent text-cream/40 hover:text-cream'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-gold w-full py-3.5 mt-1"
            >
              {loading ? 'Signing in…' : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </button>
          </form>

          <div className="divider" />
          <div className="space-y-2">
            <p className="text-center text-cream/25 text-xs">
              Don't have an account?{' '}
              <Link href="/signup" className="text-gold/60 hover:text-gold underline underline-offset-2">
                Sign up →
              </Link>
            </p>
            <p className="text-center text-cream/25 text-xs">
              Admin?{' '}
              <Link href="/admin/login" className="text-gold/60 hover:text-gold underline underline-offset-2">
                Admin Portal →
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
