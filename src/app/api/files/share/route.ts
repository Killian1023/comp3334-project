import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fileAccess, files, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { verifyToken } from '@/lib/auth';

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
    const user = await verifyToken(token);
    if (!user) {
        return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
        );
    }

    const body = await request.json();
    const { fileId, ownerId, sharedWithUserId, encryptedFileKey } = body;

    if (!fileId || !sharedWithUserId || !encryptedFileKey) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check if the file exists and is owned by the current user
    const [fileRecord] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 400 });
    }

    if (fileRecord.userId !== ownerId) {
      return NextResponse.json({ error: 'You do not have permission to share this file' }, { status: 403 });
    }

    // Get the shared user's information
    const [sharedWithUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, sharedWithUserId))
      .limit(1);

    if (!sharedWithUser) {
      return NextResponse.json({ error: 'The user to whom the share was sent could not be found' }, { status: 400 });
    }

    // Check if the file has been shared with this users
    const existingAccess = await db
      .select()
      .from(fileAccess)
      .where(
        and(
          eq(fileAccess.fileId, fileId),
          eq(fileAccess.sharedWith, sharedWithUser.id)
        )
      );

    if (existingAccess.length > 0) {
      return NextResponse.json({ error: 'File is shared with this user' }, { status: 400 });
    }

    // Create a new file access record
    const newFileAccess = {
      id: nanoid(),
      fileId: fileId,
      sharedWith: sharedWithUser.id,
      ownerId: ownerId,
      encryptedFileKey: encryptedFileKey,
    };

    // Insert records into database
    await db.insert(fileAccess).values(newFileAccess);

    return NextResponse.json({
      message: 'File sharing successful',
      accessId: newFileAccess.id,
    }, { status: 200 });

  } catch (error) {
    console.error('Error sharing file:', error);
    return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
  }
}