import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { logs } from '../../../../db/schema';
import { verifyToken, getUserById } from '../../../../lib/auth';
import { logAction, logError } from '../../../../lib/logger';
import { desc } from 'drizzle-orm';

const ADMIN_USERNAMES = ['admin'];  // List of admin usernames

/**
 * Check if a user is an admin
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await getUserById(userId);
    return user ? ADMIN_USERNAMES.includes(user.username) : false;
  } catch (error) {
    return false;
  }
}

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

    // Check if the user is an admin
    const adminUser = await isAdmin(userId);
    if (!adminUser) {
      await logAction('Unauthorized access to admin logs', { userId });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get logs from the database
    const logEntries = await db.select()
      .from(logs)
      .orderBy(desc(logs.timestamp))
      .limit(100);  // Limit to most recent 100 logs
    
    await logAction('Admin viewed logs', { userId });
    
    return NextResponse.json({
      logs: logEntries
    });
    
  } catch (error) {
    await logError(error as Error, 'admin-logs');
    return NextResponse.json(
      { error: 'An error occurred while fetching logs' },
      { status: 500 }
    );
  }
}
