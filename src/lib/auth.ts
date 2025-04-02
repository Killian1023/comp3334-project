import { db } from '../db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../db/schema';
import { User } from '../app/types';
import { logAction, logError } from './logger';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

/**
 * Converts database user object with string dates to User type with Date objects
 */
const convertToUserType = (dbUser: any): User => {
  if (!dbUser) return null as any;
  
  return {
    ...dbUser,
    createdAt: dbUser.createdAt ? new Date(dbUser.createdAt) : new Date(),
    updatedAt: dbUser.updatedAt ? new Date(dbUser.updatedAt) : new Date(),
  };
};

/**
 * User authentication and management functions
 */

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0] ? convertToUserType(result[0]) : undefined;
  } catch (error) {
    await logError(error as Error, 'getUserById');
    throw error;
  }
};

/**
 * Get user by username
 */
export const getUserByUsername = async (username: string): Promise<User | undefined> => {
  try {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0] ? convertToUserType(result[0]) : undefined;
  } catch (error) {
    await logError(error as Error, 'getUserByUsername');
    throw error;
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  try {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return result[0] ? convertToUserType(result[0]) : undefined;
  } catch (error) {
    await logError(error as Error, 'getUserByEmail');
    throw error;
  }
};

/**
 * Update user data
 */
export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  try {
    // Prepare data for database - convert Date objects to ISO strings if present
    const dataToUpdate: any = { ...userData };
    if (userData.updatedAt instanceof Date) {
      dataToUpdate.updatedAt = userData.updatedAt.toISOString();
    } else {
      dataToUpdate.updatedAt = new Date().toISOString();
    }
    
    await db.update(schema.users)
      .set(dataToUpdate)
      .where(eq(schema.users.id, id));
    
    // Get the updated user
    const user = await getUserById(id);
    if (!user) {
      throw new Error('User not found after update');
    }
    
    await logAction(`User updated: ${id}`, { fields: Object.keys(userData) });
    return user;
  } catch (error) {
    await logError(error as Error, 'updateUser');
    throw error;
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string): Promise<void> => {
  try {
    await db.delete(schema.users).where(eq(schema.users.id, id));
    await logAction(`User deleted: ${id}`);
  } catch (error) {
    await logError(error as Error, 'deleteUser');
    throw error;
  }
};

/**
 * Create a new user
 */
export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  try {
    const now = new Date().toISOString();
    // Create DB representation with string dates
    const dbUser = {
      id: uuidv4(),
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    
    await db.insert(schema.users).values(dbUser);
    
    // Convert to User type with Date objects before returning
    const newUser: User = {
      ...dbUser,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
    
    await logAction(`User created: ${newUser.id}`, { username: userData.username });
    return newUser;
  } catch (error) {
    await logError(error as Error, 'createUser');
    throw error;
  }
};

/**
 * Verify if a password matches the stored hash
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    await logError(error as Error, 'verifyPassword');
    return false;
  }
};

/**
 * Hash a password 
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Authenticate a user with username/email and password
 */
export const authenticateUser = async (
  usernameOrEmail: string, 
  password: string
): Promise<User | null> => {
  try {
    // Check if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    
    let user;
    if (isEmail) {
      user = await getUserByEmail(usernameOrEmail);
    } else {
      user = await getUserByUsername(usernameOrEmail);
    }
    
    if (!user) {
      await logAction(`Failed login attempt: ${usernameOrEmail} (user not found)`);
      return null;
    }
    
    // Verify the password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await logAction(`Failed login attempt: ${usernameOrEmail} (invalid password)`);
      return null;
    }
    
    await logAction(`User authenticated: ${user.id}`);
    return user;
  } catch (error) {
    await logError(error as Error, 'authenticateUser');
    return null;
  }
};

/**
 * Verify JWT token and extract user ID
 */
export const verifyToken = (token: string): string | null => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development-only';
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    return decoded.sub;
  } catch (error) {
    return null;
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<boolean> => {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return false;
    }
    
    // In a real app, you would generate a token and send an email here
    await logAction(`Password reset requested for user: ${user.id}`);
    return true;
  } catch (error) {
    await logError(error as Error, 'requestPasswordReset');
    return false;
  }
};

/**
 * Validate and process password reset
 */
export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
  try {
    // In a real app, you would validate the token and update the password
    await logAction(`Password reset processed with token: ${token.substring(0, 8)}...`);
    return true;
  } catch (error) {
    await logError(error as Error, 'resetPassword');
    return false;
  }
};
