'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'organizer' | 'staff'>('organizer')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Client-side validation
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Signup failed')
        setLoading(false)
        return
      }

      toast.success(`Welcome to Joycard, ${data.user.name}!`)

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
          <p className="text-cream/30 text-xs mt-2 tracking-widest uppercase">Create Account</p>
        </div>

        <div className="glass-gold p-9">
          <h1 className="font-display text-2xl font-semibold text-cream mb-1">Sign Up</h1>
          <p className="text-cream/40 text-sm mb-7">Join the event management team</p>

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
              <label className="label">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="input"
              />
            </div>
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
              <label className="label">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1234567890"
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
                minLength={6}
              />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                minLength={6}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-gold w-full py-3.5 mt-1"
            >
              {loading ? 'Creating account…' : `Sign up as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </button>
          </form>

          <div className="divider" />
          <p className="text-center text-cream/25 text-xs">
            Already have an account?{' '}
            <Link href="/login" className="text-gold/60 hover:text-gold underline underline-offset-2">
              Sign in →
            </Link>
          </p>
        </div>

        <p className="text-center text-cream/15 text-xs mt-6 tracking-widest">
          © {new Date().getFullYear()} joycard
        </p>
      </motion.div>
    </div>
  )
}
