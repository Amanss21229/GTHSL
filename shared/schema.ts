import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").default("student"),
});

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  section: text("section").notNull(),
  subsection: text("subsection").notNull(), 
  duration: integer("duration").notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  questionNumber: integer("question_number").notNull(),
  imageUrl: text("image_url").notNull(),
  correctOption: integer("correct_option").notNull(),
});

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  testId: integer("test_id").notNull(),
  score: integer("score").notNull(),
  correctCount: integer("correct_count").notNull(),
  wrongCount: integer("wrong_count").notNull(),
  unattemptedCount: integer("unattempted_count").notNull(),
  answers: json("answers").notNull(),
  timeSpent: integer("time_spent").notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTestSchema = createInsertSchema(tests).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertAttemptSchema = createInsertSchema(attempts).omit({ id: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Test = typeof tests.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
