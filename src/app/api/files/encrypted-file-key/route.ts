import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getEncryptedFileKey, isAuthorizedForFile } from '@/lib/file';
import { logAction, logError } from '@/lib/logger';

export async function GET(
  request: Request,
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
        return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
        );
    }
    
    const token = authHeader.substring(7);
    const userId = await verifyToken(token);
    if (!userId) {
        return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
        );
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { error: 'The required fileId parameter is missing' },
        { status: 400 }
      );
    }

    // Check if the user has permission to access the file
    const isAuthorized = await isAuthorizedForFile(fileId, userId);
    if (!isAuthorized) {
      await logAction(`Unauthorized file key access attempt: ${fileId}`, { userId: userId });
      return NextResponse.json(
        { error: 'You do not have permission to access this file' },
        { status: 403 }
      );
    }

    // Get the key to encrypt the file
    const encryptedFileKey = await getEncryptedFileKey(fileId);
    
    await logAction(`File key obtained: ${fileId}`, { userId: userId });

    return NextResponse.json({ encryptedFileKey });
  } catch (error) {
    await logError(error as Error, 'getEncryptedFileKey API');
    return NextResponse.json(
      { error: 'An error occurred while getting the file key' },
      { status: 500 }
    );
  }
}