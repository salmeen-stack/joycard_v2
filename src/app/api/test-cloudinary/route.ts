import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

export async function GET() {
  try {
    // Test Cloudinary configuration
    const config = cloudinary.config();
    
    return NextResponse.json({
      success: true,
      config: {
        cloud_name: config.cloud_name ? 'Set' : 'Missing',
        api_key: config.api_key ? 'Set' : 'Missing',
        api_secret: config.api_secret ? 'Set' : 'Missing',
        secure: config.secure
      },
      test: 'Cloudinary configuration loaded successfully'
    });
  } catch (error) {
    console.error('Cloudinary test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        envCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
        envApiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
        envApiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
      }
    }, { status: 500 });
  }
}
