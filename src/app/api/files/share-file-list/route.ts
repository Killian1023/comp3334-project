import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSharedFilesForUser } from '@/lib/file';

/**
 * Get the list of files shared with the current user
 * 
 * Authentication:
 * - Requires Bearer token for authentication
 * 
 * Returns a list of all files shared with the current user
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify user identity
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const userId = verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // 2. Get the list of files shared with the current user
    const sharedFiles = await getSharedFilesForUser(userId);

    // 3. Log the operation and return the file list
    return NextResponse.json({ files: sharedFiles });
    
  } catch (error) {
    return NextResponse.json({ error: 'Failed to obtain the shared file list' }, { status: 500 });
  }
}