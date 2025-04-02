import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { saveEncryptedFile } from '@/lib/file';
import { logAction, logError } from '@/lib/logger';

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
    const encryptedName = formData.get('encryptedName') as string;
    const originalType = formData.get('originalType') as string;
    const size = parseInt(formData.get('size') as string, 10);
    
    if (!file || !iv || !encryptedName) {
      return NextResponse.json({ error: 'Missing required file data' }, { status: 400 });
    }
    
    console.log('File upload received with IV length:', iv.length);
    
    // Read the encrypted file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Save the file using our helper
    const { fileId } = await saveEncryptedFile(buffer, userId, {
      iv, 
      encryptedName, 
      originalType, 
      size
    });
    
    return NextResponse.json({
      success: true,
      fileId: fileId,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    await logError(error as Error, 'file-upload-api');
    return NextResponse.json({ error: 'Failed to process file upload' }, { status: 500 });
  }
}