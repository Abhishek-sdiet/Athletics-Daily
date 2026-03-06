import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  answer: text("answer").notNull(),
  date: date("date").notNull().unique(), // YYYY-MM-DD
  category: text("category").default('athletics'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameResults = pgTable("game_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questionDate: date("question_date").notNull(),
  guesses: text("guesses").array().notNull().default([]),
  isSolved: boolean("is_solved").notNull().default(false),
  playedAt: timestamp("played_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true, email: true, password: true
});
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type GameResult = typeof gameResults.$inferSelect;
