import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { z } from "zod";

// USERS TABLE
export const users = pgTable("users", {
id: serial("id").primaryKey(),
username: text("username").notNull().unique(),
email: text("email").notNull().unique(),
password: text("password").notNull(),
isAdmin: boolean("is_admin").default(false),
createdAt: timestamp("created_at").defaultNow(),
});

// QUESTIONS TABLE
export const questions = pgTable("questions", {
id: serial("id").primaryKey(),
questionText: text("question_text").notNull(),
answer: text("answer").notNull(),
date: date("date").notNull().unique(), // YYYY-MM-DD
category: text("category").default("athletics"),
createdAt: timestamp("created_at").defaultNow(),
});

// GAME RESULTS TABLE
export const gameResults = pgTable("game_results", {
id: serial("id").primaryKey(),
userId: integer("user_id").notNull(),
questionDate: date("question_date").notNull(),
guesses: text("guesses").array().notNull().default([]),
isSolved: boolean("is_solved").notNull().default(false),
playedAt: timestamp("played_at").defaultNow(),
});

// ZOD SCHEMAS (for API validation)

export const insertUserSchema = z.object({
username: z.string().min(3).max(30),
email: z.string().email(),
password: z.string().min(6),
});

export const insertQuestionSchema = z.object({
questionText: z.string().min(3),
answer: z.string().min(1),
date: z.string(),
category: z.string().optional(),
});

// TYPES

export type User = typeof users.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type GameResult = typeof gameResults.$inferSelect;
export type InsertGameResult = typeof gameResults.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
