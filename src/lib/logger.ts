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
export const logAction = async (message: string, metadata?: Record<string, any>): Promise<void> => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
    level: 'info'
  };
  
  // Log to console
  console.log(`[LOG] ${timestamp} - ${message}`, metadata || '');
  
  // Store in database
  try {
    await createLog(logEntry);
  } catch (error) {
    console.error('Failed to write log to database:', error);
  }
};

/**
 * Log an error with stack trace
 */
export const logError = async (error: Error, context?: string): Promise<void> => {
  const timestamp = new Date().toISOString();
  const contextMessage = context ? ` [${context}]` : '';
  const message = `${contextMessage} - ${error.message}`;
  
  console.error(`[ERROR]${contextMessage} ${timestamp} - ${error.message}`, error.stack);
  
  // Store in database
  try {
    await createLog({
      timestamp,
      message,
      metadata: JSON.stringify({ stack: error.stack }),
      level: 'error'
    });
  } catch (dbError) {
    console.error('Failed to write error log to database:', dbError);
  }
};
