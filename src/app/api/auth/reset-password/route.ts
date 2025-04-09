import { NextResponse } from 'next/server';
import { getUserByUsername, getUserByEmail } from '../../../../lib/auth';
import { logAction, logError } from '../../../../lib/logger';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { usernameOrEmail } = await request.json();

    if (!usernameOrEmail) {
      return NextResponse.json(
        { error: 'Username or email is required' },
        { status: 400 }
      );
    }

    // Check if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    let user;

    if (isEmail) {
      user = await getUserByEmail(usernameOrEmail);
    } else {
      user = await getUserByUsername(usernameOrEmail);
    }

    if (!user) {
      await logAction('Password reset requested for non-existent user', { usernameOrEmail });
      // Don't reveal that the user doesn't exist
      return NextResponse.json(
        { message: 'If your account exists, you will be able to reset your password.' },
        { status: 200 }
      );
    }

    // Get user's current counter
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .execute();

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userResult[0];
    const counter = userData.counter || 0;
    const nextCounter = counter + 1;
    
    // Update the counter in the database
    await db.update(users)
      .set({ counter: nextCounter })
      .where(eq(users.id, user.id))
      .execute();

    await logAction('Password reset requested', { userId: user.id });
    
    return NextResponse.json({
      message: 'If your account exists, you will be able to reset your password.',
      userId: user.id,
      counter: nextCounter
    });
  } catch (error) {
    await logError(error as Error, 'password-reset-request');
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}