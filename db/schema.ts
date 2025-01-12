import { InferSelectModel, relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  vector,
} from 'drizzle-orm/pg-core';

export type User = InferSelectModel<typeof usersTable> & {
  files?: File[];
  chats?: Chat[];
};
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar('password', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userRelations = relations(usersTable, ({ many }) => ({
  files: many(filesTable),
  chats: many(chatsTable),
}));

export type File = InferSelectModel<typeof filesTable> & {
  chunks?: Chunk[];
  user?: User;
};
export const filesTable = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  path: varchar({ length: 255 }).notNull(),
  userId: uuid('user_id').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const fileRelations = relations(filesTable, ({ many, one }) => ({
  chunks: many(chunksTable),
  user: one(usersTable, {
    fields: [filesTable.userId],
    references: [usersTable.id],
  }),
}));

export type Chat = InferSelectModel<typeof chatsTable> & {
  messages?: Omit<Message, 'id' | 'createdAt' | 'chatId'>[];
  user?: User;
};
export const chatsTable = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chatRelations = relations(chatsTable, ({ many, one }) => ({
  messages: many(messagesTable),
  user: one(usersTable, {
    fields: [chatsTable.userId],
    references: [usersTable.id],
  }),
}));

export type Message = InferSelectModel<typeof messagesTable> & {
  chat?: Chat;
};
export const messagesTable = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chatsTable.id),
  content: text('content').notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messageRelations = relations(messagesTable, ({ one }) => ({
  chat: one(chatsTable, {
    fields: [messagesTable.chatId],
    references: [chatsTable.id],
  }),
}));

export type Chunk = InferSelectModel<typeof chunksTable> & {
  file?: File;
};
export const chunksTable = pgTable(
  'chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fileId: uuid('file_id').references(() => filesTable.id),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    embeddingIndex: index('embeddingIndex').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
  })
);

export const chunkRelations = relations(chunksTable, ({ one }) => ({
  file: one(filesTable, {
    fields: [chunksTable.fileId],
    references: [filesTable.id],
  }),
}));
