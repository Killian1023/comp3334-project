import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { logs, admins } from '../../../../db/schema';
import { getUserById } from '../../../../lib/auth';
import { desc, eq } from 'drizzle-orm';
import { verifyToken } from '../../../../lib/auth';

/**
 * Check if a user is an admin by looking up the admins table
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    // Query the admins table to check if this user is an admin
    const adminRecord = await db.select()
      .from(admins)
      .where(eq(admins.userId, userId))
      .limit(1);
    
    return adminRecord && adminRecord.length > 0;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function GET(request: Request) {
  try {
    // Get the user ID from request headers that was set by middleware
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const userId = verifyToken(token);
    
    if (!userId) {
      // This shouldn't happen if middleware is working correctly
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Check if the user is an admin
    const adminUser = await isAdmin(userId);
    if (!adminUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get logs from the database
    const logEntries = await db.select()
      .from(logs)
      .orderBy(desc(logs.timestamp))
      .limit(100);  // Limit to most recent 100 logs
    
    const user = await getUserById(userId);
    
    return NextResponse.json({
      logs: logEntries
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred while fetching logs' },
      { status: 500 }
    );
  }
}