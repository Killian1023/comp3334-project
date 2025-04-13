/**
 * File name security validation and sanitization utilities
 */

/**
 * Validate if a file name is safe
 * @param fileName The file name to validate
 * @returns Whether the file name is safe
 */
export const validateFileName = (fileName: string): boolean => {
  // Disallow path traversal characters
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return false;
  }
  
  // Limit file name length
  if (fileName.length > 255) {
    return false;
  }
  
  // Only allow specific characters
  const validChars = /^[a-zA-Z0-9\-_\.\s]+$/;
  return validChars.test(fileName);
};

/**
 * Sanitize file name by removing unsafe characters
 * @param fileName The file name to sanitize
 * @returns The sanitized file name
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove path traversal characters
  fileName = fileName.replace(/\.\./g, '');
  fileName = fileName.replace(/[\/\\]/g, '');
  
  // Limit length
  fileName = fileName.substring(0, 255);
  
  // Only keep allowed characters
  fileName = fileName.replace(/[^a-zA-Z0-9\-_\.\s]/g, '');
  
  // Use default name if sanitized name is empty
  if (!fileName) {
    fileName = 'unnamed_file';
  }
  
  return fileName;
};