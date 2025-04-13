import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the user to retrieve their current counter
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult[0];
    
    const currentCounter = user.counter || 0;
    const nextCounter = currentCounter + 1;
    
    // Update the counter in the database
    await db.update(users)
      .set({ counter: nextCounter })
      .where(eq(users.id, userId))
      .execute();
    
    return NextResponse.json({ counter: nextCounter });
  } catch (error) {
    return NextResponse.json(
      { message: 'An error occurred while getting counter' },
      { status: 500 }
    );
  }
}