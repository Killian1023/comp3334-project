import { db } from '../db';
import { eq, ne, and, not, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { logAction, logError } from './logger';
import { get } from 'http';

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
 * Update an existing encrypted file
 */
export const updateEncryptedFile = async (
  fileBuffer: Buffer, 
  fileId: string,
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
    // First check if file exists and belongs to the user
    const file = await getFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    
    if (file.userId !== userId) {
      await logAction(`Unauthorized file edit attempt: ${fileId}`, { userId });
      throw new Error('Unauthorized to edit this file');
    }
    
    // Update file data and metadata in the database
    await db.update(schema.files)
      .set({
        originalName: metadata.originalName,
        originalType: metadata.originalType,
        size: metadata.size,
        iv: metadata.iv,
        fileKey: metadata.fileKey,
        fileData: fileBuffer,
        updatedAt: new Date().toISOString()
      })
      .where(eq(schema.files.id, fileId));
    
    await logAction(`File updated: ${fileId}`, { userId, size: metadata.size });
    
    return {
      fileId
    };
  } catch (error) {
    await logError(error as Error, 'updateEncryptedFile');
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

export const getFileKeyById = async (fileId: string) => {
  try {
    const file = await getFileById(fileId);
    return file.fileKey;
  } catch (error) {
    await logError(error as Error, 'getFileKeyById');
    throw error;
  }
}

export const getShareList = async (fileId: string) => {
  try {
    // Get the information of the current file and ensure that the file exists
    const file = await getFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    
    // Get the list of user IDs that have shared
    const sharedAccessRecords = await db
      .select()
      .from(schema.fileAccess)
      .where(eq(schema.fileAccess.fileId, fileId));
    
    const sharedUserIds = sharedAccessRecords.map(record => record.sharedWith);
    
    // Basic query conditions: Exclude file owners
    let conditions = ne(schema.users.id, file.userId);
    
    // If there are shared users, add conditions to exclude these users
    if (sharedUserIds.length > 0) {
      const newConditions = and(
        conditions,
        not(inArray(schema.users.id, sharedUserIds))
      );
      if (newConditions !== undefined) {
        conditions = newConditions;
      }
    }
    
    // Get all users who can share
    const availableUsers = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email
      })
      .from(schema.users)
      .where(conditions);
    
    await logAction(`Retrieved share list for file: ${fileId}`, {
      fileId,
      availableUserCount: availableUsers.length
    });
    
    return availableUsers;
    
  } catch (error) {
    await logError(error as Error, 'getShareList');
    throw error;
  }
}

export const getEncryptedFileKey = async (fileId: string) => {
  try {
    const file = await getFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    
    return file.fileKey;
  } catch (error) {
    await logError(error as Error, 'getEncryptedFileKey');
    throw error;
  }
}

/**
 * Return files shared to a specific user based on fileAccess
 * This function reads the file content shared with the user and the key used to encrypt it
 */
export const readSharedFile = async (fileId: string, userId: string) => {
  try {
    // Check if the user has permission to access the shared file
    const accessRecords = await db
      .select()
      .from(schema.fileAccess)
      .where(
        and(
          eq(schema.fileAccess.fileId, fileId),
          eq(schema.fileAccess.sharedWith, userId)
        )
      );
      
    if (accessRecords.length === 0) {
      await logAction(`Unauthorized shared file access attempt: ${fileId}`, { userId });
      throw new Error('Unauthorized access to this shared file');
    }
    
    const accessRecord = accessRecords[0];
    
    // Get file data
    const file = await getFileById(fileId);
    
    if (!file) {
      throw new Error('Shared file not found');
    }
    
    await logAction(`Shared file accessed: ${fileId}`, { userId, ownerId: accessRecord.ownerId });
    
    // Returns the file contents and the user-specific encrypted file key
    return {
      fileBuffer: file.fileData,
      metadata: {
        iv: file.iv,
        fileKey: accessRecord.encryptedFileKey,
        originalName: file.originalName,
        originalType: file.originalType,
        size: file.size,
        ownerId: accessRecord.ownerId
      }
    };
    
  } catch (error) {
    await logError(error as Error, 'readSharedFile');
    throw error;
  }
};

/**
 * Get a list of all files shared with a specified user
 */
export const getSharedFilesForUser = async (userId: string) => {
  try {
    // Combine the fileAccess and files tables to get all files shared with the user.
    const sharedFiles = await db
      .select({
        id: schema.files.id,
        ownerId: schema.fileAccess.ownerId,
        originalName: schema.files.originalName,
        originalType: schema.files.originalType,
        size: schema.files.size,
        encryptedFileKey: schema.fileAccess.encryptedFileKey,
        createdAt: schema.files.createdAt,
        updatedAt: schema.files.updatedAt
      })
      .from(schema.fileAccess)
      .innerJoin(schema.files, eq(schema.fileAccess.fileId, schema.files.id))
      .where(eq(schema.fileAccess.sharedWith, userId));
    
    await logAction(`Retrieved shared files list for user: ${userId}`, { 
      count: sharedFiles.length 
    });
    
    return sharedFiles;
    
  } catch (error) {
    await logError(error as Error, 'getSharedFilesForUser');
    throw error;
  }
};
