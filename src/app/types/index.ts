// This file exports TypeScript types and interfaces used throughout the application.

export interface User {
    id: string;
    username: string;
    passwordHash: string;
    email: string;
<<<<<<< HEAD
    publicKey: string; // User's public key
=======
    publicKey: string;
>>>>>>> origin/master
    createdAt: Date;
    updatedAt: Date;
}

export interface File {
    id: string;
    userId: string;
    fileName: string;
    filePath: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface PasswordResetRequest {
    email: string;
}

export interface FileUploadResponse {
    fileId: string;
    fileName: string;
}