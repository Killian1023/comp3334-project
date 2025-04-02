import { NextResponse } from 'next/server';
import { getUserByUsername, hashPassword } from '../../../../lib/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { logAction, logError } from '../../../../lib/logger';

export async function POST(request: Request) {
  try {
    await logAction('Registration request received');
    
    const { username, password } = await request.json();
    
    // Validation
    if (!username || !password) {
      await logAction('Registration validation failed', { reason: 'Missing fields' });
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }
    
    // Check if username is already taken
    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      await logAction('Registration failed - username taken', { username });
      return NextResponse.json({ message: 'Username is already taken' }, { status: 409 });
    }
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    await logAction('Password hashed for registration');
    
    // Create the user
    const now = new Date().toISOString();
    const userId = uuidv4();
    
    await db.insert(users).values({
      id: userId,
      username,
      email: `${username}@example.com`, // Dummy email since schema requires it
      passwordHash,
      createdAt: now,
      updatedAt: now
    });
    
    await logAction(`User registered successfully, preparing for automatic login`, { 
      userId, 
      username,
      registrationTime: now 
    });
    
    return NextResponse.json({ 
      message: 'Registration successful',
      userId,
      username
    }, { status: 201 });
    
  } catch (error) {
    await logError(error as Error, 'user-registration');
    return NextResponse.json({ 
      message: 'An error occurred during registration' 
    }, { status: 500 });
  }
}