import {
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar('password', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const filesTable = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  path: varchar({ length: 255 }).notNull(),
  userId: uuid('user_id').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatsTable = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messagesTable = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chatsTable.id),
  content: text('content').notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chunksTable = pgTable('chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').references(() => filesTable.id),
  content: text('content').notNull(),
  embedding: real('embedding').array().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
