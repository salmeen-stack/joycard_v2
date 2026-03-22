'use client'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

interface ScanResult { valid:boolean; alreadyScanned:boolean; message:string; guest?:{name:string;card_type:string;dress_code:string;event_title:string;scanned_at?:string} }
interface Recent { name:string; card_type:string; time:string }

function Content() {
  const sp = useSearchParams()
  const eventId = sp.get('event')
  const [scanning, setScanning] = useState(false)
  const [result,   setResult]   = useState<ScanResult|null>(null)
  const [recent,   setRecent]   = useState<Recent[]>([])
  const [count,    setCount]    = useState(0)
  const [error,    setError]    = useState('')
  const scanRef  = useRef<{stop:()=>Promise<void>}|null>(null)
  const busy     = useRef(false)

  const handleScan = useCallback(async (token: string) => {
    if (busy.current) return
    busy.current = true
    try {
      const r = await fetch(`/api/invitations/verify/${token}`,{method:'POST'})
      const d: ScanResult = await r.json()
      setResult(d)
      if (d.valid && d.guest) {
        setCount(c=>c+1)
        setRecent(prev=>[{name:d.guest!.name, card_type:d.guest!.card_type, time:new Date().toLocaleTimeString()},...prev.slice(0,9)])
      }
      setTimeout(()=>{ setResult(null); busy.current=false }, 4000)
    } catch { busy.current=false }
  },[])

  const start = useCallback(async () => {
    setScanning(true); setError('')
    
    try {
      // ✅ Production-safe HTTPS check
      const isSecureContext = location.protocol === 'https:' || 
                             location.hostname === 'localhost' || 
                             location.hostname === '127.0.0.1'
      
      if (!isSecureContext) {
        throw new Error('Camera access requires HTTPS in production. Please ensure your site is served over HTTPS.')
      }
      
      // ✅ Enhanced camera permission check
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (permissions.state === 'denied') {
          throw new Error('Camera access denied. Please enable camera permissions in your browser settings.')
        }
      } catch (permError) {
        console.warn('Permission query failed, continuing:', permError)
      }
      
      console.log('Requesting camera access...')
      
      // ✅ Enhanced camera API support check
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported')
        throw new Error('Camera API not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.')
      }
      
      // ✅ Production-safe import with error handling
      let Html5Qrcode
      try {
        const module = await import('html5-qrcode')
        Html5Qrcode = module.Html5Qrcode
        console.log('Html5Qrcode imported successfully')
      } catch (importError) {
        console.error('Failed to import html5-qrcode:', importError)
        throw new Error('Failed to load QR scanner library. Please refresh the page and try again.')
      }
      
      // ✅ Create scanner with error handling
      let scanner
      try {
        scanner = new Html5Qrcode('qr-reader')
        scanRef.current = scanner
        console.log('Scanner instance created')
      } catch (scannerError) {
        console.error('Failed to create scanner:', scannerError)
        throw new Error('Failed to initialize QR scanner. Please refresh the page and try again.')
      }
      
      // ✅ Production-safe camera configuration with fallback
      const getCameraConfig = () => {
        // ✅ Create config object with exactly one key, no spreading, no merging
        const config = Object.freeze({ facingMode: 'environment' })
        
        // Log for debugging
        console.log('Generated camera config:', config)
        console.log('Config keys:', Object.keys(config))
        console.log('Config validation:', Object.keys(config).length === 1)
        console.log('Config type:', typeof config)
        console.log('Config frozen:', Object.isFrozen(config))
        
        return config
      }
      
      const cameraConfig = getCameraConfig()
      
      // ✅ Double validation before starting
      console.log('Final camera config before start:', cameraConfig)
      console.log('Final config keys:', Object.keys(cameraConfig))
      console.log('Final config length:', Object.keys(cameraConfig).length)
      
      // ✅ Validate config before starting
      if (typeof cameraConfig !== 'object' || Object.keys(cameraConfig).length !== 1) {
        console.error('Invalid camera config:', cameraConfig)
        throw new Error('Invalid camera configuration detected. Please refresh the page.')
      }
      
      console.log('Starting scanner with validated config...')
      
      // ✅ Enhanced scanner start with comprehensive error handling
      await scanner.start(
        cameraConfig, // ✅ Exactly one key
        { 
          fps: 10, 
          qrbox: { width: 260, height: 260 },
          // ✅ Additional production-safe options
          disableFlip: false
        },
        async (text) => {
          try {
            const m = text.match(/\/invite\/([a-f0-9-]{36})/)||text.match(/\/verify\/([a-f0-9-]{36})/)
            await handleScan(m?m[1]:text)
          } catch (scanError) {
            console.error('Scan processing error:', scanError)
          }
        },
        (errorMessage) => {
          // ✅ Enhanced error filtering
          if (!errorMessage.includes('No QR code found') && 
              !errorMessage.includes('NotFoundException') &&
              !errorMessage.includes('MultiFormatReader') &&
              !errorMessage.includes('NotFoundException') &&
              !errorMessage.includes('No barcode or QR code detected')) {
            console.log('Scanner error:', errorMessage)
          }
        }
      )
      
      console.log('Scanner started successfully')
      setScanning(false)
      
    } catch (err) {
      console.error('Scanner start failed:', err)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      
      // ✅ Enhanced production error messages
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        setError('📷 Camera access denied. Please allow camera access and try again.')
      } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('no camera')) {
        setError('📷 No camera found. Please ensure your device has a camera.')
      } else if (errorMsg.includes('NotReadableError') || errorMsg.includes('already in use')) {
        setError('📷 Camera is already in use by another application.')
      } else if (errorMsg.includes('HTTPS') || errorMsg.includes('secure')) {
        setError('🔒 Camera requires HTTPS connection. Please ensure your site is served over HTTPS.')
      } else if (errorMsg.includes('not supported') || errorMsg.includes('getUserMedia')) {
        setError('🌐 Camera API not supported. Please use Chrome, Firefox, or Safari on a mobile device.')
      } else if (errorMsg.includes('object should have exactly 1 key')) {
        setError('🔧 Camera configuration error. Please refresh the page and try again.')
      } else if (errorMsg.includes('Failed to load') || errorMsg.includes('Failed to initialize')) {
        setError('🔧 Scanner library error. Please refresh the page and try again.')
      } else {
        setError(`📷 Camera error: ${errorMsg}`)
      }
      setScanning(false)
    }
  }, [handleScan])

  async function stop() {
    if (scanRef.current) { 
      try { 
        await scanRef.current.stop() 
      } catch {} 
      scanRef.current = null 
    }
    setScanning(false)
    setResult(null)
  }

  useEffect(()=>()=>{ if(scanRef.current) scanRef.current.stop().catch(()=>{}) },[])

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-8">
        <p className="text-cream/30 text-xs tracking-widest uppercase mb-1">Staff · Check-In</p>
        <h1 className="font-display text-4xl font-semibold text-cream">QR Scanner</h1>
        {eventId && <p className="text-cream/35 text-sm mt-1">Event #{eventId}</p>}
      </motion.div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 stat-card"><p className="font-display text-2xl font-bold text-teal">{count}</p><p className="text-cream/30 text-xs uppercase tracking-widest mt-1">This Session</p></div>
        <div className="flex-1 stat-card"><p className={`font-display text-2xl font-bold ${scanning?'text-teal':'text-cream/40'}`}>{scanning?'Active':'Stopped'}</p><p className="text-cream/30 text-xs uppercase tracking-widest mt-1">Scanner</p></div>
      </div>

      <div className="glass-gold p-6 mb-5">
        <div id="qr-reader" className={`w-full rounded-xl overflow-hidden ${!scanning?'hidden':''}`} style={{minHeight:300}} />
        {!scanning && (
          <div className="flex flex-col items-center py-10">
            <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-6 float">
              <span className="text-3xl">📱</span>
            </div>
            <h3 className="font-display text-xl text-cream mb-2">Camera Ready</h3>
            <p className="text-cream/35 text-sm text-center mb-6">Press start to activate the QR scanner.</p>
            {error && (
              <div className="mb-6">
                <p className="text-rose-400 text-sm bg-rose-400/10 border border-rose-400/20 rounded-xl px-4 py-2 mb-4 text-center">{error}</p>
                <div className="text-center">
                  <p className="text-cream/35 text-xs mb-3">Having camera issues?</p>
                  <a href={`/staff/scan-manual${eventId ? '?event=' + eventId : ''}`} className="text-gold hover:text-gold/70 text-sm underline">
                    Try Manual Entry Instead
                  </a>
                </div>
              </div>
            )}
            <button onClick={start} className="btn-gold px-12 py-4">Start Scanner</button>
          </div>
        )}
        {scanning && <div className="flex justify-center mt-4"><button onClick={stop} className="btn-ghost px-8">Stop</button></div>}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{opacity:0,y:20,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-20,scale:.95}}
            className={`p-5 rounded-2xl border mb-5 ${result.valid?'bg-teal/10 border-teal/30':result.alreadyScanned?'bg-amber-500/10 border-amber-500/30':'bg-rose-500/10 border-rose-500/30'}`}>
            <div className="flex items-start gap-4">
              <span className="text-2xl">{result.valid?'✅':result.alreadyScanned?'⚠️':'❌'}</span>
              <div>
                <p className={`font-semibold mb-2 ${result.valid?'text-teal':result.alreadyScanned?'text-amber-400':'text-rose-400'}`}>{result.message}</p>
                {result.guest && (
                  <div className="space-y-1">
                    <p className="text-cream font-display text-lg">{result.guest.name}</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="badge badge-slate">{result.guest.card_type} entry</span>
                      <span className="badge badge-gold">{result.guest.dress_code}</span>
                    </div>
                    {result.alreadyScanned && result.guest.scanned_at && (
                      <p className="text-amber-400/55 text-xs">First scan: {format(new Date(result.guest.scanned_at),'h:mm a')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {recent.length>0 && (
        <div className="glass-gold p-5">
          <h3 className="font-display text-base font-semibold text-cream mb-4">Recent Check-ins</h3>
          <div className="space-y-2">
            {recent.map((r,i)=>(
              <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div><p className="text-cream text-sm font-medium">{r.name}</p><p className="text-cream/30 text-xs">{r.card_type} entry</p></div>
                <p className="text-teal text-xs">{r.time}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StaffScan() {
  return <Suspense fallback={<div className="p-8 text-cream/30">Loading…</div>}><Content /></Suspense>
}
