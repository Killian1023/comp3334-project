import { NextResponse } from 'next/server';
import { getUserByUsername, hashPassword } from '../../../../lib/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { logAction, logError } from '../../../../lib/logger';
import jwt from 'jsonwebtoken';

// Use the same JWT settings as the login route
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development-only';
const JWT_EXPIRES_IN = '24h';

/**
 * Generate a JWT token for authentication
 */
const generateToken = (userId: string): string => {
  return jwt.sign(
    { 
      sub: userId,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

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
    
    await logAction(`User registered successfully`, { 
      userId, 
      username,
      registrationTime: now 
    });
    
    // Generate JWT token for the newly registered user
    const token = generateToken(userId);
    
    return NextResponse.json({ 
      message: 'Registration successful',
      userId,
      username,
      token,
      expiresIn: JWT_EXPIRES_IN
    }, { status: 201 });
    
  } catch (error) {
    await logError(error as Error, 'user-registration');
    return NextResponse.json({ 
      message: 'An error occurred during registration' 
    }, { status: 500 });
  }
}