import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getFilesByUserId } from '@/lib/file';
import { logAction, logError } from '@/lib/logger';

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
    
    // Get all files for this user using our helper
    const userFiles = await getFilesByUserId(userId);
    
    await logAction(`Files listed by user: ${userId}`);
    
    interface FileResponse {
      id: string;
      encryptedName: string;
      size: number;
      createdAt: Date;
      iv: string;
    }

    return NextResponse.json({ 
      files: userFiles.map((file) => ({
        id: file.id,
        encryptedName: file.encryptedName,
        size: file.size,
        createdAt: new Date(file.createdAt),
        iv: file.iv
      } as FileResponse))
    });
  } catch (error) {
    await logError(error as Error, 'list-files-api');
    return NextResponse.json({ error: 'Failed to retrieve files' }, { status: 500 });
  }
}
