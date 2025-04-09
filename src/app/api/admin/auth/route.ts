import { NextResponse } from 'next/server';
import { verifyToken, getUserById } from '../../../../lib/auth';
import { logAction, logError } from '../../../../lib/logger';
import { db } from '../../../../db';
import { admins } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Extract and verify the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const userId = verifyToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if the user is in the admins table
    const user = await getUserById(userId);
    if (!user) {
      await logAction('Failed admin auth attempt - user not found', { userId });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Query the admins table to check if this user is an admin
    const adminRecord = await db.select()
      .from(admins)
      .where(eq(admins.userId, userId))
      .limit(1);
    
    if (!adminRecord || adminRecord.length === 0) {
      await logAction('Failed admin auth attempt - not in admin table', { userId, username: user.username });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await logAction('Admin authenticated', { userId, username: user.username });
    
    return NextResponse.json({
      isAdmin: true,
      username: user.username,
      adminId: adminRecord[0].id
    });
    
  } catch (error) {
    await logError(error as Error, 'admin-auth');
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}
