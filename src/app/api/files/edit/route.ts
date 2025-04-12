import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { updateEncryptedFile } from '@/lib/file';
import { logActionWithSignature } from '@/lib/logger';

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
    const fileId = formData.get('fileId') as string;
    const iv = formData.get('iv') as string;
    const fileKey = formData.get('fileKey') as string;
    const originalName = formData.get('originalName') as string;
    const originalType = formData.get('originalType') as string;
    const size = parseInt(formData.get('size') as string, 10);
    const actionSignature = formData.get('actionSignature') as string;
    
    if (!file || !iv || !originalName || !fileKey || !fileId || !actionSignature) {
      return NextResponse.json({ error: 'Missing required file data' }, { status: 400 });
    }
    
    // Read the encrypted file
    const buffer = Buffer.from(await file.arrayBuffer());

    await logActionWithSignature(
      'File update request',
      userId,
      actionSignature,
      { fileId, timestamp: new Date().toISOString() }
    );
    
    // Update the file using our helper
    await updateEncryptedFile(buffer, fileId, userId, {
      iv, 
      fileKey,
      originalName,
      originalType, 
      size
    });
    
    
    return NextResponse.json({
      success: true,
      fileId: fileId,
      message: 'File updated successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}
