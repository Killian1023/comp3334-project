import { NextResponse } from 'next/server';
import { verifyToken, getUserById } from '../../../../lib/auth';
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Query the admins table to check if this user is an admin
    const adminRecord = await db.select()
      .from(admins)
      .where(eq(admins.userId, userId))
      .limit(1);
    
    if (!adminRecord || adminRecord.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    
    return NextResponse.json({
      isAdmin: true,
      username: user.username,
      adminId: adminRecord[0].id
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}
