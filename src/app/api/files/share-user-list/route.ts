import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getShareList, getAllUsers } from '@/lib/file';

export async function GET(request: NextRequest) {
  try {
    // Get file ID parameter
    const fileId = request.nextUrl.searchParams.get('fileId');
    if (!fileId) {
      return NextResponse.json(
        { message: 'File ID is required' },
        { status: 400 }
      );
    }
    
    // Get query type parameter
    const type = request.nextUrl.searchParams.get('type') || 'shared';
    
    // Verify identity
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
    
    // Get different user lists based on type parameter
    let users;
    if (type === 'all') {
      // Get all users that can be shared with 
      users = await getAllUsers(fileId, userId);
    } else {
      // Get list of users the file is already shared with
      users = await getShareList(fileId);
    }
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in share-list API:', error);
    return NextResponse.json(
      { message: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}