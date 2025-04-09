import { db } from '../db';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { logAction, logError } from './logger';

/**
 * Get all files for a specific user
 */
export const getFilesByUserId = async (userId: string) => {
  try {
    const files = await db.select()
      .from(schema.files)
      .where(eq(schema.files.userId, userId));
    
    return files;
  } catch (error) {
    await logError(error as Error, 'getFilesByUserId');
    throw error;
  }
};

/**
 * Get a specific file by ID
 */
export const getFileById = async (id: string) => {
  try {
    const results = await db.select().from(schema.files).where(eq(schema.files.id, id));
    return results[0];
  } catch (error) {
    await logError(error as Error, 'getFileById');
    throw error;
  }
};

/**
 * Delete a file (checks ownership first)
 */
export const deleteFile = async (id: string, userId: string) => {
  try {
    // First check if file exists and belongs to the user
    const file = await getFileById(id);
    if (!file) {
      throw new Error('File not found');
    }
    
    if (file.userId !== userId) {
      await logAction(`Unauthorized file deletion attempt: ${id}`, { userId });
      throw new Error('Unauthorized to delete this file');
    }
    
    // Remove from database
    await db.delete(schema.files).where(eq(schema.files.id, id));
    
    await logAction(`File deleted: ${id}`, { userId });
    
    return true;
  } catch (error) {
    await logError(error as Error, 'deleteFile');
    throw error;
  }
};

/**
 * Save an uploaded encrypted file
 */
export const saveEncryptedFile = async (
  fileBuffer: Buffer, 
  userId: string,
  metadata: {
    iv: string;
    fileKey: string;
    originalName: string;
    originalType: string;
    size: number;
  }
) => {
  try {
    // Generate a unique ID for the file
    const fileId = uuidv4();
    
    // Store file data and metadata in the database
    await db.insert(schema.files).values({
      id: fileId,
      userId: userId,
      originalName: metadata.originalName,
      originalType: metadata.originalType,
      size: metadata.size,
      iv: metadata.iv,
      fileKey: metadata.fileKey,
      fileData: fileBuffer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    await logAction(`File uploaded: ${fileId}`, { userId, size: metadata.size });
    
    return {
      fileId
    };
  } catch (error) {
    await logError(error as Error, 'saveEncryptedFile');
    throw error;
  }
};

/**
 * Check if a user is authorized to access a file
 */
export const isAuthorizedForFile = async (fileId: string, userId: string): Promise<boolean> => {
  try {
    const file = await getFileById(fileId);
    return file && file.userId === userId;
  } catch (error) {
    await logError(error as Error, 'isAuthorizedForFile');
    return false;
  }
};

/**
 * Read an encrypted file from storage
 */
export const readEncryptedFile = async (fileId: string, userId: string) => {
  try {
    // Get file metadata and data
    const file = await getFileById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }
    
    if (file.userId !== userId) {
      await logAction(`Unauthorized file access attempt: ${fileId}`, { userId });
      throw new Error('Unauthorized access');
    }
    
    await logAction(`File downloaded: ${fileId}`, { userId });
    
    return {
      fileBuffer: file.fileData, // Get file data directly from database
      metadata: {
        iv: file.iv,
        fileKey: file.fileKey, // Include fileKey in the response
        originalName: file.originalName,
        originalType: file.originalType,
        size: file.size
      }
    };
  } catch (error) {
    await logError(error as Error, 'readEncryptedFile');
    throw error;
  }
};
