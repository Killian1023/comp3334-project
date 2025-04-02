export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
export const FILE_UPLOAD_LIMIT = 5 * 1024 * 1024; // 5 MB
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 20;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 15;
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];