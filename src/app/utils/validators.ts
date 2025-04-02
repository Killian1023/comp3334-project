import { z } from 'zod';

export const registerValidator = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(100),
});

export const loginValidator = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(100),
});

export const resetPasswordValidator = z.object({
  newPassword: z.string().min(8).max(100),
});

export const fileUploadValidator = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
});

/**
 * Validates if a string is a properly formatted email address
 * @param email The email string to validate
 * @returns boolean indicating if the email is valid
 */
export const validateEmail = (email: string): boolean => {
  // Use the same email validation logic as Zod for consistency
  try {
    z.string().email().parse(email);
    return true;
  } catch (error) {
    return false;
  }
};