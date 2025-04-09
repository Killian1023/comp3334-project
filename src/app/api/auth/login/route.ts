import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../lib/auth';
import { logAction } from '../../../../lib/logger';
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
    const { usernameOrEmail, password, publicKey } = await request.json();

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { message: 'Username/email and password are required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(usernameOrEmail, password);
    
    if (!user) {
      await logAction('Failed login attempt', { usernameOrEmail });
      // Don't specify whether the username or password was incorrect
      // for security reasons
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // 如果提供了公钥，验证它是否匹配
    if (publicKey && user.publicKey !== publicKey) {
      await logAction('Login failed: public key mismatch', { userId: user.id });
      
      // 对用户来说，他们的私钥可能已经失效或不匹配
      // 如果客户端提供了公钥但与存储的不匹配，则更新数据库中的公钥
      await db.update(users)
        .set({ publicKey })
        .where(eq(users.id, user.id))
        .execute();
      
      await logAction('User public key updated', { 
        userId: user.id,
        oldPublicKey: user.publicKey?.substring(0, 10) + '...',
        newPublicKey: publicKey.substring(0, 10) + '...'
      });
      
      // 更新用户对象以反映新的公钥
      user.publicKey = publicKey;
    }

    // Generate JWT token with the user ID
    const token = generateToken(user.id);

    await logAction(`User logged in: ${user.id}`, { username: user.username });

    // Return the token and user info (excluding sensitive data)
    const { passwordHash, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      token,
      user: userWithoutPassword,
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    await logAction('Login error', { error: (error as Error).message });
    return NextResponse.json(
      { message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}