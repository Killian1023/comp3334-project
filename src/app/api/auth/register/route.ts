import { NextResponse } from 'next/server';
import { getUserByUsername, hashPassword } from '../../../../lib/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { logAction, logError } from '../../../../lib/logger';
import jwt from 'jsonwebtoken';
import { generateKeyPairECC } from '@/app/utils/clientencryption';

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
    
    const { username, password, email } = await request.json();
    
    // Validation
    if (!username || !password || !email) {
      await logAction('Registration validation failed', { reason: 'Missing fields' });
      return NextResponse.json({ 
        message: 'Username, password and email are required',
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Check if username is already taken
    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      await logAction('Registration failed - username taken', { username });
      return NextResponse.json({ 
        message: 'Username is already taken',
        error: 'Username taken'
      }, { status: 409 });
    }
    
    try {
      // 生成ECC密钥对
      const { publicKey, privateKey } = await generateKeyPairECC();
      
      // Hash the password
      const passwordHash = await hashPassword(password);
      await logAction('Password hashed for registration');
      
      // Create the user
      const now = new Date().toISOString();
      const userId = uuidv4();
      
      const newUser = await db.insert(users).values({
        id: userId,
        username,
        email,
        passwordHash,
        publicKey,
        createdAt: now,
        updatedAt: now
      }).returning();
      
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
        privateKey, // 返回私钥给用户
        expiresIn: JWT_EXPIRES_IN
      }, { status: 201 });
      
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      await logError(dbError as Error, 'user-registration-db');
      return NextResponse.json({ 
        message: 'Database error during registration',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    await logError(error as Error, 'user-registration');
    return NextResponse.json({ 
      message: 'An error occurred during registration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}