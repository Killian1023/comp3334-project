import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../lib/auth';
import { logActionWithSignature } from '../../../../lib/logger';
import jwt from 'jsonwebtoken';
import { db } from '../../../../db';
import { eq } from 'drizzle-orm';
import { users } from '../../../../db/schema';

// In a real application, store this in environment variables
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
    const { usernameOrEmail, password, publicKey, actionSignature } = await request.json();

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { message: 'Username/email and password are required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(usernameOrEmail, password);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // 如果提供了公钥，验证它是否匹配
    if (publicKey && user.publicKey !== publicKey) {
      
      // 对用户来说，他们的私钥可能已经失效或不匹配
      // 如果客户端提供了公钥但与存储的不匹配，则更新数据库中的公钥
      await db.update(users)
        .set({ publicKey })
        .where(eq(users.id, user.id))
        .execute();
      
      
      // 更新用户对象以反映新的公钥
      user.publicKey = publicKey;
    }

    // Generate JWT token with the user ID
    const token = generateToken(user.id);

    await logActionWithSignature(`User logged in: ${user.username}`, user.id, actionSignature);

    // Return the token and user info (excluding sensitive data)
    const { passwordHash, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      token,
      user: userWithoutPassword,
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}