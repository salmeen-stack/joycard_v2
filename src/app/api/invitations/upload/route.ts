import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/apiAuth'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg',
  'image/png': 'png', 'image/webp': 'webp',
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  try {
    const fd   = await req.formData()
    const file = fd.get('card') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = ALLOWED[file.type]
    if (!ext) return NextResponse.json({ error: 'Only JPEG, PNG, WebP allowed' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: 'Max file size 10 MB' }, { status: 400 })

    // Try Cloudinary first (for production)
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      try {
        return await uploadToCloudinary(file)
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed, falling back to local storage:', cloudinaryError)
      }
    }

    // Fallback to local storage (for development)
    return await uploadToLocal(file)

  } catch (err) { 
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 }) 
  }
}

async function uploadToCloudinary(file: File) {
  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')
  const dataURI = `data:${file.type};base64,${base64}`
  
  // Upload to Cloudinary
  const timestamp = Math.round(new Date().getTime() / 1000)
  const publicId = `${uuidv4()}`
  const signature = require('crypto')
    .createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
    .digest('hex')
  
  const formData = new FormData()
  formData.append('file', dataURI)
  formData.append('api_key', CLOUDINARY_API_KEY!)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('folder', 'joycard/invitations')
  formData.append('public_id', publicId)

  const cloudinaryRes = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  const cloudinaryData = await cloudinaryRes.json()
  
  if (cloudinaryData.error) {
    throw new Error(`Cloudinary error: ${JSON.stringify(cloudinaryData.error)}`)
  }

  return NextResponse.json({ 
    card_url: cloudinaryData.secure_url,
    public_id: cloudinaryData.public_id,
    upload_method: 'cloudinary',
    message: '✅ Image uploaded successfully using Cloudinary!'
  }, { status: 201 })
}

async function uploadToLocal(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${uuidv4()}.${ALLOWED[file.type]}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  
  // Create directory if it doesn't exist
  await mkdir(uploadDir, { recursive: true })
  
  // Write file
  await writeFile(path.join(uploadDir, filename), buffer)
  
  const cardUrl = `/uploads/${filename}`
  
  return NextResponse.json({ 
    card_url: cardUrl,
    public_id: filename,
    upload_method: 'local',
    message: '✅ Image uploaded successfully using local storage!'
  }, { status: 201 })
}
