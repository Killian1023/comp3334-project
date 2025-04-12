/**
 * Logger module for application action logging
 */

import { db } from '../db';
import * as schema from '../db/schema';

/**
 * Create a log entry in the database
 */
export const createLog = async (logData: {
  timestamp: string;
  message: string;
  metadata?: string;
  level?: string;
}) => {
  try {
    return await db.insert(schema.logs).values(logData);
  } catch (error) {
    console.error('Failed to write log to database:', error);
  }
};

/**
 * Log an action with timestamp and optional metadata
 * @param message - Description of the action
 * @param metadata - Optional additional data about the action
 */
export const logActionWithSignature = async (
  message: string, 
  userId: string,
  signature: string,
  metadata?: Record<string, any>
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    userId,
    signature,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
    level: 'info'
  };
  
  console.log(`[LOG] ${timestamp} - ${message}`, metadata || '');
  
  try {
    await createLog(logEntry);
  } catch (error) {
    console.error('Failed to write log to database:', error);
  }
};