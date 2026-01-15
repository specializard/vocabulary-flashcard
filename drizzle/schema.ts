import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Vocabulary lists created by users.
 * Each user can create multiple vocabulary lists.
 */
export const vocabularyLists = mysqlTable("vocabulary_lists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VocabularyList = typeof vocabularyLists.$inferSelect;
export type InsertVocabularyList = typeof vocabularyLists.$inferInsert;

/**
 * Individual vocabulary items (words and their meanings).
 * Each item belongs to a vocabulary list.
 */
export const vocabularyItems = mysqlTable("vocabulary_items", {
  id: int("id").autoincrement().primaryKey(),
  listId: int("listId").notNull(),
  word: varchar("word", { length: 255 }).notNull(),
  meaning: text("meaning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VocabularyItem = typeof vocabularyItems.$inferSelect;
export type InsertVocabularyItem = typeof vocabularyItems.$inferInsert;

/**
 * Learning records for tracking user progress.
 * Records whether a user got a word correct or incorrect.
 */
export const learningRecords = mysqlTable("learning_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  listId: int("listId").notNull(),
  isCorrect: int("isCorrect").notNull(), // 1 for correct, 0 for incorrect
  userAnswer: text("userAnswer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LearningRecord = typeof learningRecords.$inferSelect;
export type InsertLearningRecord = typeof learningRecords.$inferInsert;