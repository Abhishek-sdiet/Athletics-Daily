import { db } from "./db";
import { users, questions, gameResults, type User, type InsertUser, type Question, type InsertQuestion, type GameResult ,type InsertGameResult } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";


export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getQuestionByDate(date: string): Promise<Question | undefined>;
  getUpcomingQuestions(): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  deleteQuestion(id: number): Promise<void>;
  
  getGameResult(userId: number, date: string): Promise<GameResult | undefined>;
  saveGameResult(result: InsertGameResult): Promise<GameResult>;
  updateGameResult(id: number, guesses: string[], isSolved: boolean): Promise<GameResult>;
  getUserStats(userId: number): Promise<{ gamesPlayed: number, wins: number, winRate: number, bestAttempt: number | null, currentStreak: number }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser as any).returning();
    return user;
  }

  async getQuestionByDate(date: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.date, new Date(date)));
    return question;
  }

  async getUpcomingQuestions(): Promise<Question[]> {
    // Return future questions and today's question
    const today = new Date().toISOString().split('T')[0];
    return db.select().from(questions).where(sql`${questions.date} >= ${today}`).orderBy(questions.date);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question as any).returning();
    return newQuestion;
  }
  
  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async getGameResult(userId: number, date: string): Promise<GameResult | undefined> {
    const [result] = await db.select().from(gameResults).where(and(eq(gameResults.userId, userId), eq(gameResults.questionDate, new Date(date))));
    return result;
  }

  async saveGameResult(result: InsertGameResult): Promise<GameResult> {
  const [newResult] = await db.insert(gameResults).values(result).returning();
  return newResult;
}

  async updateGameResult(id: number, guesses: string[], isSolved: boolean): Promise<GameResult> {
  const [updated] = await db
    .update(gameResults)
    .set({ guesses , isSolved })
    .where(eq(gameResults.id, id))
    .returning();

  return updated;
}

  async getUserStats(userId: number) {
    const results = await db.select().from(gameResults).where(eq(gameResults.userId, userId)).orderBy(gameResults.questionDate);
    
    let gamesPlayed = results.length;
    let wins = 0;
    let bestAttempt: number | null = null;
    let currentStreak = 0;
    
    let lastDate = null;
    
    for (const r of results) {
      if (r.isSolved) {
        wins++;
        if (bestAttempt === null || r.guesses.length < bestAttempt) {
          bestAttempt = r.guesses.length;
        }
        
        // Calculate streak
        const rDate = new Date(r.questionDate);
        if (lastDate) {
          const diffTime = Math.abs(rDate.getTime() - lastDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
          } else if (diffDays > 1) {
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        lastDate = rDate;
      } else {
        currentStreak = 0; // Streak broken
      }
    }
    
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
    
    return { gamesPlayed, wins, winRate, bestAttempt, currentStreak };
  }
}

export const storage = new DatabaseStorage();
