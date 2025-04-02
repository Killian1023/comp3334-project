import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { verifyToken, getUserById } from '../../../../lib/auth';
import { logAction, logError } from '../../../../lib/logger';

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
      await logAction('Unauthorized access to admin user list', { userId });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get users from the database
    const usersList = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      createdAt: users.createdAt
    })
    .from(users);
    
    await logAction('Admin viewed user list', { userId });
    
    return NextResponse.json({
      users: usersList
    });
    
  } catch (error) {
    await logError(error as Error, 'admin-users');
    return NextResponse.json(
      { error: 'An error occurred while fetching users' },
      { status: 500 }
    );
  }
}
