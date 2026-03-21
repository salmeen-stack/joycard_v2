'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CameraSetupPage() {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4 py-12">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-8 text-center">
        <h1 className="font-display text-3xl font-semibold text-cream mb-2">📱 Camera Setup Guide</h1>
        <p className="text-cream/35 text-sm">Enable camera access for QR scanning</p>
      </motion.div>

      <div className="w-full max-w-2xl space-y-6">
        {/* Step 1: HTTPS */}
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:.1}} className="glass-gold p-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-sm font-bold">1</span>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-cream mb-2">Use HTTPS Connection</h3>
              <p className="text-cream/35 text-sm mb-4">
                Camera access requires a secure HTTPS connection. For local development, use ngrok:
              </p>
              <div className="bg-black/20 p-4 rounded-lg font-mono text-xs text-cream/60">
                <p>npm install -g ngrok</p>
                <p>ngrok http 3000</p>
                <p>Use the https://ngrok.io URL on your phone</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step 2: Browser Permissions */}
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:.2}} className="glass-gold p-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-sm font-bold">2</span>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-cream mb-2">Allow Camera Permission</h3>
              <p className="text-cream/35 text-sm mb-4">
                When you access the scanner, your browser will ask for camera permission:
              </p>
              <ul className="space-y-2 text-cream/35 text-sm">
                <li>• Click "Allow" when prompted</li>
                <li>• If blocked, check browser settings</li>
                <li>• Refresh the page after enabling</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Step 3: Test Camera */}
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:.3}} className="glass-gold p-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-sm font-bold">3</span>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-cream mb-2">Test Camera Access</h3>
              <p className="text-cream/35 text-sm mb-4">
                Test if your camera is working before using the QR scanner:
              </p>
              <div className="flex gap-3">
                <Link href="/test-camera" className="btn-gold flex-1 text-center">
                  📸 Test Camera
                </Link>
                <Link href="/staff/scan-manual" className="btn-ghost flex-1 text-center">
                  ⌨️ Manual Entry
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Troubleshooting */}
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:.4}} className="glass-gold p-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-sm font-bold">!</span>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-cream mb-2">Troubleshooting</h3>
              <div className="space-y-3 text-cream/35 text-sm">
                <div>
                  <p className="font-medium text-cream/60 mb-1">Camera not working?</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Use Chrome or Safari browser</li>
                    <li>• Check phone settings for camera permissions</li>
                    <li>• Close other apps using the camera</li>
                    <li>• Restart your browser</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-cream/60 mb-1">Still having issues?</p>
                  <p className="text-xs">Use the manual QR entry option as a backup.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5}} className="text-center">
          <div className="flex gap-3 justify-center">
            <Link href="/staff/scan" className="btn-gold">
              🎯 Try Scanner
            </Link>
            <Link href="/staff/dashboard" className="btn-ghost">
              📊 Staff Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
