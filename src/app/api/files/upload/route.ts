import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { saveEncryptedFile } from '@/lib/file';
import { logActionWithSignature} from '@/lib/logger';
import { validateFileName, sanitizeFileName } from '@/app/utils/fileSecurity';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get the form data with encrypted file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const iv = formData.get('iv') as string;
    const fileKey = formData.get('fileKey') as string;
    let originalName = formData.get('originalName') as string;
    const originalType = formData.get('originalType') as string;
    const size = parseInt(formData.get('size') as string, 10);
    const actionSignature = formData.get('actionSignature') as string;
    
    if (!file || !iv || !originalName || !fileKey || !actionSignature) {
      return NextResponse.json({ error: 'Missing required file data' }, { status: 400 });
    }
    
    // Validate and sanitize file name
    if (!validateFileName(originalName)) {
      // If file name is unsafe, try to sanitize it
      const sanitizedName = sanitizeFileName(originalName);
      if (!sanitizedName) {
        return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
      }
      // Use the sanitized name
      originalName = sanitizedName;
    }
    
    console.log('File upload received with IV length:', iv.length);
    
    // Read the encrypted file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await logActionWithSignature(
      'File upload request',
      userId,
      actionSignature,
      { timestamp: new Date().toISOString() }
    );

    // Save the file using our helper
    const { fileId } = await saveEncryptedFile(buffer, userId, {
      iv, 
      fileKey,
      originalName,
      originalType, 
      size
    });
    
    return NextResponse.json({
      success: true,
      fileId: fileId,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to process file upload' }, { status: 500 });
  }
}