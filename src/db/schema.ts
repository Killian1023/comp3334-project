import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
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

export const logs = sqliteTable('logs', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'),
  level: text('level').default('info').notNull(),
});
