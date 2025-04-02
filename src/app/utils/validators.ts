import { z } from 'zod';

export const registerValidator = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(100),
  email: z.string().email(),
});

export const loginValidator = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(100),
});

export const resetPasswordValidator = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8).max(100),
});

export const fileUploadValidator = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
});