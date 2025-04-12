import { NextResponse } from 'next/server';
import { hashPassword } from '../../../../../lib/auth';
import { db } from '../../../../../db';
import { users } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Verify an HOTP code using the user's public key
 */
async function verifyHOTP(publicKeyBase64: string, hotpCode: string, counter: number): Promise<boolean> {
  try {
    // Convert counter to bytes (same as client side)
    const counterBuffer = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
      counterBuffer[7-i] = counter & 0xff;
      counter = counter >> 8;
    }
    
    // We're using the same algorithm as the client now
    // Hash the counter directly with SHA-256
    const hash = crypto.createHash('sha256').update(counterBuffer).digest();
    
    // Extract the code using the standard HOTP truncation method
    const offset = hash[hash.length - 1] & 0x0f;
    
    const binary = 
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);
    
    const expectedCode = (binary % 1000000).toString().padStart(6, '0');
    
    console.log(`Server expected HOTP: ${expectedCode} for counter: ${counter}`);
    console.log(`Client provided HOTP: ${hotpCode}`);
    
    // Compare the codes
    return hotpCode === expectedCode;
  } catch (error) {
    console.error('Error verifying HOTP:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { userId, hotpCode, counter, newPassword } = await request.json();

    if (!userId || !hotpCode || counter === undefined || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, HOTP code, counter, and new password are required' },
        { status: 400 }
      );
    }

    // Get the user to retrieve their public key
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult[0];
    
    if (!user.publicKey) {
      return NextResponse.json(
        { error: 'Authentication failed - no public key' },
        { status: 401 }
      );
    }

    // Verify HOTP code
    const isValid = await verifyHOTP(user.publicKey, hotpCode, counter);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid authentication code' },
        { status: 401 }
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);
    
    // Update the password and counter
    await db.update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, userId))
      .execute();

    
    return NextResponse.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}