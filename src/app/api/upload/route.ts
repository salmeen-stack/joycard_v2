import { NextRequest, NextResponse } from 'next/server';
import { handleUpload } from '@vercel/blob/client';
import { requireRole } from '@/lib/apiAuth';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = requireRole(request, 'admin', 'organizer')
  if (auth instanceof NextResponse) return auth
  
  const body = await request.json();
 
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Verify user is authenticated before allowing upload
        const user = auth.user;
        if (!user) {
          throw new Error('Unauthorized');
        }
        
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          tokenPayload: JSON.stringify({
            userId: user.id,
            userRole: user.role
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs AFTER the file is safely in the cloud
        console.log('Upload completed:', blob.url);
        console.log('Uploaded by:', JSON.parse(tokenPayload || '{}'));
        
        // You could update your database here if needed
        // For now, we'll just log it since the URL is returned to client
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload token generation failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 400 });
  }
}
