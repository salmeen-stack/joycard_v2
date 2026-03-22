import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/cloudinary'
import { requireRole } from '@/lib/apiAuth'

// Cloudinary response types
interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
}

interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  resource_type: string
  format: string
  bytes: number
  etag: string
  url: string
  version: number
  signature: string
  created_at: string
  tags?: string[]
}

export async function POST(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' 
      }, { status: 400 })
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large. Maximum size is 20MB' 
      }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to Cloudinary using centralized config
    const uploadPromise = new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'invitations',
          use_filename: true,
          unique_filename: false
        },
        (error: any, result: any) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id
            })
          } else {
            reject(new Error('Upload failed: No result returned from Cloudinary'))
          }
        }
      )

      uploadStream.end(buffer)
    })

    const result = await uploadPromise
    
    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    })

  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = requireRole(req, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  
  try {
    const { searchParams } = new URL(req.url)
    const publicId = searchParams.get('publicId')
    
    if (!publicId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Public ID is required' 
      }, { status: 400 })
    }

    // Delete from Cloudinary using centralized config
    const deletePromise = new Promise<{ result: string }>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error: any, result: any) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })

    await deletePromise
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    }, { status: 500 })
  }
}
