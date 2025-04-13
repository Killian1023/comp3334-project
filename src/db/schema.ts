import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { count } from 'console';


// Add a public key to the User table

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  publicKey: text('public_key').notNull(), // User's public key
  counter: integer('counter').default(0).notNull(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});


export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  originalName: text('original_name').notNull(),
  originalType: text('original_type').notNull(),
  size: integer('size').notNull(),
  iv: text('iv').notNull(), // Store initialization vector for decryption
  fileKey: text('file_key').notNull(), // Store the encrypted file key
  fileData: blob('file_data').notNull(), // Add file data column to store binary blob
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Add File Access table with: 1. Shared user 2. Owner 3. Shared user's encrypted file key 4. FileID
// One record per shared user per file
export const fileAccess = sqliteTable('file_access', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id),
  sharedWith: text('shared_with').notNull(), // Individual shared user
  ownerId: text('owner_id').notNull().references(() => users.id), // Owner of the file
  encryptedFileKey: text('encrypted_file_key').notNull(), // Encrypted file key for the shared user
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const logs = sqliteTable('logs', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  message: text('message').notNull(),
  userId: text('user_id'),
  signature: text('signature'),
  metadata: text('metadata'),
  level: text('level').default('info').notNull(),
});

export const admins = sqliteTable('admins', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id).unique(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});