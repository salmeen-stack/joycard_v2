'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface User {
  id: number;
  name: string;
  email: string;
  role: 'staff' | 'organizer';
  verified: boolean;
  created_at: string;
}

export default function VerifyUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleVerification(userId: number, verified: boolean) {
    try {
      const res = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, verified })
      })

      if (res.ok) {
        fetchUsers() // Refresh list
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update verification')
      }
    } catch (error) {
      console.error('Failed to update verification:', error)
      alert('Failed to update verification')
    }
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    if (filter === 'pending') return !user.verified
    if (filter === 'verified') return user.verified
    return true
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-8">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Admin · User Management</p>
        <h1 className="font-display text-4xl font-semibold text-cream">Verify Users</h1>
        <p className="text-cream/35 text-sm mt-1">Manage staff and organizer account verification</p>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.1}} className="flex gap-2 mb-6">
        {(['all', 'pending', 'verified'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-gold text-navy-900'
                : 'bg-white/10 text-cream/60 hover:bg-white/20'
            }`}
          >
            {f === 'all' && 'All Users'}
            {f === 'pending' && 'Pending Verification'}
            {f === 'verified' && 'Verified'}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-gold p-6 h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-gold p-16 text-center">
          <p className="text-4xl mb-4">👥</p>
          <h3 className="font-display text-xl text-cream mb-2">No Users Found</h3>
          <p className="text-cream/35 text-sm">No users match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map(user => (
            <motion.div
              key={user.id}
              initial={{opacity:0,x:-20}}
              animate={{opacity:1,x:0}}
              transition={{delay:.1 * users.indexOf(user)}}
              className="glass-gold p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display text-lg font-semibold text-cream">{user.name}</h3>
                    <span className={`badge ${user.verified ? 'badge-teal' : 'badge-orange'} text-xs`}>
                      {user.verified ? 'Verified' : 'Pending'}
                    </span>
                    <span className="badge badge-slate text-xs">{user.role}</span>
                  </div>
                  <p className="text-cream/35 text-sm">{user.email}</p>
                  <p className="text-cream/20 text-xs mt-1">
                    Joined {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {user.verified ? (
                    <button
                      onClick={() => toggleVerification(user.id, false)}
                      className="btn-ghost px-4 py-2 text-sm"
                    >
                      🚫 Revoke Access
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleVerification(user.id, true)}
                      className="btn-gold px-4 py-2 text-sm"
                    >
                      ✅ Verify Account
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
