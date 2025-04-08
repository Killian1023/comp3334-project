import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';


// User表加一個public key

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  publicKey: text('public_key').notNull(), // 用戶的公鑰
  email: text('email').notNull().unique(),
  publicKey: text('public_key').notNull(),
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
  encryptedName: text('encrypted_name').notNull(),
  originalType: text('original_type').notNull(),
  size: integer('size').notNull(),
  iv: text('iv').notNull(), // Store initialization vector for decryption
  fileData: blob('file_data').notNull(), // Add file data column to store binary blob
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// 新增File Access表，1. 共享人 2. Owner 3. 共享人的encrypted file key 4. FileID
// 一個共享人一個文件一條記錄
export const fileAccess = sqliteTable('file_access', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().references(() => files.id),
  sharedWith: text('shared_with').notNull(), // 單個共享人
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
  metadata: text('metadata'),
  level: text('level').default('info').notNull(),
});
