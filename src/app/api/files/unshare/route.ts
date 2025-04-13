import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fileAccess, files } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';
import { logActionWithSignature } from '@/lib/logger';

interface User {
  id: string;
}

export async function POST(request: NextRequest) {
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
    const userResult = await verifyToken(token);
    if (!userResult) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    const user: User = { id: userResult };

    const body = await request.json();
    const { fileId, sharedWithUserId, actionSignature } = body;

    if (!fileId || !sharedWithUserId || !actionSignature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    await logActionWithSignature(
      'File unshare request',
      user.id,
      actionSignature,
      { fileId, sharedWithUserId, timestamp: new Date().toISOString() }
    );

    // Check if the file exists and is owned by the current user
    const [fileRecord] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 400 });
    }

    // 检查是否是文件所有者或被分享的用户
    const [fileAccessRecord] = await db
      .select()
      .from(fileAccess)
      .where(
        and(
          eq(fileAccess.fileId, fileId),
          eq(fileAccess.sharedWith, sharedWithUserId)
        )
      )
      .limit(1);

    if (!fileAccessRecord) {
      return NextResponse.json({ error: 'Share record not found' }, { status: 400 });
    }

    // 允许文件所有者或被分享的用户取消分享
    if (fileRecord.userId !== user.id && sharedWithUserId !== user.id) {
      return NextResponse.json({ error: 'You do not have permission to unshare this file' }, { status: 403 });
    }

    // Delete the file access record
    await db
      .delete(fileAccess)
      .where(
        and(
          eq(fileAccess.fileId, fileId),
          eq(fileAccess.sharedWith, sharedWithUserId)
        )
      );

    return NextResponse.json({
      message: 'File unshared successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error unsharing file:', error);
    return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
  }
} 