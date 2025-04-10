import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { updateEncryptedFile } from '@/lib/file';
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
    const fileId = formData.get('fileId') as string;
    const iv = formData.get('iv') as string;
    const fileKey = formData.get('fileKey') as string;
    const originalName = formData.get('originalName') as string;
    const originalType = formData.get('originalType') as string;
    const size = parseInt(formData.get('size') as string, 10);
    
    if (!file || !iv || !originalName || !fileKey || !fileId) {
      return NextResponse.json({ error: 'Missing required file data' }, { status: 400 });
    }
    
    // Read the encrypted file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Update the file using our helper
    await updateEncryptedFile(buffer, fileId, userId, {
      iv, 
      fileKey,
      originalName,
      originalType, 
      size
    });
    
    await logAction(`File updated by user: ${userId}, fileId: ${fileId}`);
    
    return NextResponse.json({
      success: true,
      fileId: fileId,
      message: 'File updated successfully'
    });
  } catch (error) {
    await logError(error as Error, 'file-edit-api');
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}
