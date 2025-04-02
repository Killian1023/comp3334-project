import { NextResponse } from 'next/server';
import { verifyToken, getUserById } from '../../../../lib/auth';
import { logAction, logError } from '../../../../lib/logger';

const ADMIN_USERNAMES = ['admin'];  // List of admin usernames

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
    const user = await getUserById(userId);
    if (!user || !ADMIN_USERNAMES.includes(user.username)) {
      await logAction('Failed admin auth attempt', { userId });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await logAction('Admin authenticated', { userId });
    
    return NextResponse.json({
      isAdmin: true,
      username: user.username
    });
    
  } catch (error) {
    await logError(error as Error, 'admin-auth');
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}
