'use client'
import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

function ManualScanContent() {
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState<{valid: boolean; message: string; guest?: any} | null>(null)
  const sp = useSearchParams()
  const eventId = sp.get('event')

  async function handleManualScan() {
    const token = prompt('Enter 6-digit token or QR code:')
    if (!token) return
    
    setScanning(true)
    try {
      const res = await fetch(`/api/invitations/verify/${token}`, {
        method: 'POST'
      })
      const data = await res.json()
      
      setLastScan(data)
      
      if (data.valid) {
        toast.success(`✓ ${data.guest?.name || 'Guest'} checked in!`)
      } else {
        toast.error(data.message || 'Invalid token')
      }
    } catch (error) {
      toast.error('Failed to verify token')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-10">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Staff</p>
        <h1 className="font-display text-4xl font-semibold text-cream">Manual Entry</h1>
        <p className="text-cream/35 text-sm mt-1">Enter 6-digit token or QR code manually when camera access is not available</p>
      </motion.div>

      <div className="glass-gold p-6 mb-6">
        <div className="mb-4">
          <label className="label">Event ID</label>
          <input 
            className="input"
            value={eventId || ''}
            readOnly
            placeholder="Event ID will be set automatically"
          />
        </div>

        <button
          onClick={handleManualScan}
          disabled={scanning || !eventId}
          className="btn-gold w-full"
        >
          {scanning ? 'Verifying...' : '🔍 Verify Token'}
        </button>
      </div>

      {lastScan && (
        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          className={`glass-gold p-6 mb-4 border-l-2 ${
            lastScan.valid ? 'border-teal/20' : 'border-red-500/20'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-cream">
              {lastScan.valid ? '✅ Scan Successful' : '❌ Scan Failed'}
            </h3>
            <span className={`badge ${
              lastScan.valid ? 'badge-teal' : 'badge-red-400'
            }`}>
              {lastScan.valid ? 'Valid' : 'Invalid'}
            </span>
          </div>

          <div className="text-cream/80 text-sm mb-4">
            <p className="font-medium">{lastScan.message}</p>
            {lastScan.guest && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <h4 className="font-display text-cream mb-2">Guest Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-cream/45">Name:</span>
                    <p className="text-cream font-medium">{lastScan.guest.name}</p>
                  </div>
                  <div>
                    <span className="text-cream/45">Event:</span>
                    <p className="text-cream font-medium">{lastScan.guest.event_title}</p>
                  </div>
                  <div>
                    <span className="text-cream/45">Entry:</span>
                    <p className="text-cream font-medium">{lastScan.guest.card_type}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setLastScan(null)}
            className="btn-gold w-full"
          >
            Clear Result
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default function ManualScanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-cream">Loading...</div></div>}>
      <ManualScanContent />
    </Suspense>
  )
}
