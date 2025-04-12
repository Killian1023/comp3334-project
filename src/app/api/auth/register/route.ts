import { NextResponse } from 'next/server';
import { getUserByUsername, hashPassword } from '../../../../lib/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { v4 as uuidv4 } from 'uuid';
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
    
    // 接收客户端发送的公钥
    const { username, password, email, publicKey } = await request.json();
    
    // Validation
    if (!username || !password || !email || !publicKey) {
      return NextResponse.json({ 
        message: 'Username, password, email and public key are required',
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Check if username is already taken
    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json({ 
        message: 'Username is already taken',
        error: 'Username taken'
      }, { status: 409 });
    }
    
    try {
      // 不再生成密钥对，使用客户端提供的公钥
      // const { publicKey, privateKey } = await generateKeyPairECC();
      
      // Hash the password
      const passwordHash = await hashPassword(password);
      
      // Create the user
      const now = new Date().toISOString();
      const userId = uuidv4();
      
      const newUser = await db.insert(users).values({
        id: userId,
        username,
        email,
        passwordHash,
        publicKey, // 使用客户端生成的公钥
        createdAt: now,
        updatedAt: now
      }).returning();
      
      
      // Generate JWT token for the newly registered user
      const token = generateToken(userId);
      
      return NextResponse.json({ 
        message: 'Registration successful',
        userId,
        username,
        token,
        // 不再返回私钥和公钥，客户端已经有了
        expiresIn: JWT_EXPIRES_IN
      }, { status: 201 });
      
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      return NextResponse.json({ 
        message: 'Database error during registration',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      message: 'An error occurred during registration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}