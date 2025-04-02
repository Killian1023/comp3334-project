import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../lib/auth';
import { logAction } from '../../../../lib/logger';
import jwt from 'jsonwebtoken';

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
    const { usernameOrEmail, password } = await request.json();

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