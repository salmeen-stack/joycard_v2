'use client'
import { useEffect, useState } from 'react'

export default function DebugInvitePage({ params }: { params: { token: string } }) {
  const [flipped, setFlipped] = useState(false)
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/invitations/verify/${params.token}`)
        if (!r.ok) { console.error('Invitation not found'); return }
        const d = await r.json()
        console.log('Invitation data:', d.invitation)
        
        const QR = (await import('qrcode')).default
        const url = `${window.location.origin}/invite/${params.token}`
        const qrDataUrl = await QR.toDataURL(url, { 
          errorCorrectionLevel: 'H', 
          width: 280, 
          margin: 2, 
          color: { dark: '#0F172A', light: '#F8FAFC' } 
        })
        console.log('QR URL generated:', qrDataUrl.substring(0, 50) + '...')
        setQrUrl(qrDataUrl)
      } catch (error) {
        console.error('Failed to load invitation:', error)
      }
    }
    load()
  }, [params.token])

  return (
    <div className="min-h-screen bg-navy-900 p-8">
      <h1 className="text-white text-2xl mb-4">Debug Invitation Page</h1>
      
      <div className="mb-4">
        <p className="text-white mb-2">Token: {params.token}</p>
        <p className="text-white mb-2">Flipped: {flipped ? 'YES' : 'NO'}</p>
        <p className="text-white mb-2">QR URL: {qrUrl ? 'GENERATED' : 'NOT GENERATED'}</p>
      </div>

      <button 
        onClick={() => setFlipped(!flipped)}
        className="bg-gold text-navy-900 px-6 py-3 rounded-lg font-semibold mb-4"
      >
        {flipped ? 'SHOW FRONT' : 'SHOW QR'}
      </button>

      {qrUrl && (
        <div className="bg-white p-4 rounded-lg max-w-sm">
          <img src={qrUrl} alt="QR Code" className="w-full" />
        </div>
      )}
    </div>
  )
}
