import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    console.log('Test upload endpoint hit');
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      console.error('No file provided');
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    console.log('Test upload - file received:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      console.log('Starting test Cloudinary upload...');
      
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'test',
          format: 'auto'
        },
        (error: any, result: any) => {
          console.log('Test Cloudinary callback:', { error: !!error, result: !!result });
          if (error) {
            console.error('Test upload error:', error);
            reject(error);
          } else if (result) {
            console.log('Test upload success:', result);
            resolve(result);
          } else {
            reject(new Error('No result from Cloudinary'));
          }
        }
      );
      
      uploadStream.end(buffer);
    });

    const result = await uploadPromise;
    
    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id
    });

  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed',
      details: {
        envCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
        envApiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
        envApiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
      }
    }, { status: 500 });
  }
}
