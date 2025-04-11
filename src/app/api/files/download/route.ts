import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { readEncryptedFile, readSharedFile } from '@/lib/file';
import { logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
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
    
    // Get file ID from the request
    const fileId = request.nextUrl.searchParams.get('id');
    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    const isShare = request.nextUrl.searchParams.get('isShare');
    if (!isShare) {
      return NextResponse.json({ error: 'isShare is required' }, { status: 400 });
    }
    
    let fileBuffer;
    let metadata;
    
    if (isShare === 'false') {
      // Get the file using our helper
      const result = await readEncryptedFile(fileId, userId);
      fileBuffer = result.fileBuffer;
      metadata = result.metadata;
    } else {
      // Get the file using our helper
      const result = await readSharedFile(fileId, userId);
      fileBuffer = result.fileBuffer;
      metadata = result.metadata;
    }
    
    // Log the metadata to ensure it's correct
    console.log('Sending file download with metadata:', {
      fileId,
      iv: metadata.iv,
      ivLength: metadata.iv?.length,
      fileKey: metadata.fileKey ? 'present' : 'missing',
      originalName: metadata.originalName,
      type: metadata.originalType
    });
    
    // Return the encrypted file with metadata needed for decryption
    return new NextResponse(fileBuffer as Buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${fileId}.enc`,
        'X-Encryption-IV': metadata.iv,
        'X-File-Key': metadata.fileKey,
        'X-Original-Name': metadata.originalName,
        'X-Original-Type': metadata.originalType,
        // Adding cache control to prevent caching issues
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    await logError(error as Error, 'file-download-api');
    if ((error as Error).message === 'Unauthorized access') {
      return NextResponse.json({ error: 'Unauthorized access to file' }, { status: 403 });
    } else if ((error as Error).message === 'File not found') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to process file download' }, { status: 500 });
  }
}