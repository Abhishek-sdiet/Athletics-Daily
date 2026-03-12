import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";

const PostgresStore = connectPgSimple(session);

function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'athletics-game-secret',
    resave: false,
    saveUninitialized: false,
    store: new PostgresStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
   cookie: {
  secure: false,
  maxAge: 30 * 24 * 60 * 60 * 1000,
}
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
          return done(null, false, { message: "Invalid credentials" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

function evaluateGuess(guess: string, answer: string): ('correct' | 'present' | 'absent')[] {
  const evalResult: ('correct' | 'present' | 'absent')[] = Array(guess.length).fill('absent');
  const answerChars = answer.split('');
  const guessChars = guess.split('');

  // First pass: correct letters in correct positions
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === answerChars[i]) {
      evalResult[i] = 'correct';
      answerChars[i] = '#'; // Mark as used
      guessChars[i] = '*';  // Mark as matched
    }
  }

  // Second pass: correct letters in wrong positions
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] !== '*') {
      const index = answerChars.indexOf(guessChars[i]);
      if (index !== -1) {
        evalResult[i] = 'present';
        answerChars[index] = '#'; // Mark as used
      }
    }
  }

  return evalResult;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.isAdmin) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser({
        ...input,
        // First user gets admin privileges
        // In a real app, you'd manage this differently
      });
      
      // Auto login after register
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      next(err);
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get(api.auth.me.path, requireAuth, (req, res) => {
    res.status(200).json(req.user);
  });

  // Game Routes
  app.get(api.game.today.path, requireAuth, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const question = await storage.getQuestionByDate(today);
    
    if (!question) {
      return res.status(404).json({ message: "No game scheduled for today" });
    }

    const userId = (req.user as any).id;
    const gameResult = await storage.getGameResult(userId, today);
    
    let gameState = null;
    if (gameResult) {
      const evaluations = gameResult.guesses.map(g => evaluateGuess(g, question.answer));
      gameState = {
        guesses: gameResult.guesses,
        evaluations,
        isSolved: gameResult.isSolved,
        isGameOver: gameResult.isSolved || gameResult.guesses.length >= 6
      };
    }

    res.status(200).json({
      question: question.questionText,
      length: question.answer.length,
      date: question.date,
      gameState
    });
  });

  app.post(api.game.submit.path, requireAuth, async (req, res) => {
    try {
      const { guess, date } = api.game.submit.input.parse(req.body);
      const question = await storage.getQuestionByDate(date);
      
      if (!question) {
        return res.status(400).json({ message: "Invalid game date" });
      }
      
      const upperGuess = guess.toUpperCase();
      if (upperGuess.length !== question.answer.length) {
        return res.status(400).json({ message: `Guess must be ${question.answer.length} letters` });
      }

      const userId = (req.user as any).id;
      let gameResult = await storage.getGameResult(userId, date);
      
      if (gameResult && (gameResult.isSolved || gameResult.guesses.length >= 6)) {
        return res.status(400).json({ message: "Game already over" });
      }

      const evalResult = evaluateGuess(upperGuess, question.answer);
      const isSolved = upperGuess === question.answer;

      if (!gameResult) {
        gameResult = await storage.saveGameResult({
          userId,
          questionDate: date,
          guesses: [upperGuess],
          isSolved
        });
      } else {
        const newGuesses = [...gameResult.guesses, upperGuess];
        gameResult = await storage.updateGameResult(gameResult.id, newGuesses, isSolved);
      }

      const evaluations = gameResult.guesses.map(g => evaluateGuess(g, question.answer));

      res.status(200).json({
        evaluation: evalResult,
        isSolved,
        isGameOver: isSolved || gameResult.guesses.length >= 6,
        guesses: gameResult.guesses,
        evaluations
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.game.stats.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).id;
    const stats = await storage.getUserStats(userId);
    res.status(200).json(stats);
  });

  // Admin Routes
  app.post(api.admin.uploadWeek.path, requireAdmin, async (req, res) => {
    try {
      const questions = api.admin.uploadWeek.input.parse(req.body);
      let count = 0;
      for (const q of questions) {
        q.answer = q.answer.toUpperCase();
        // check if exists
        const existing = await storage.getQuestionByDate(q.date);
        if (!existing) {
          await storage.createQuestion(q);
          count++;
        }
      }
      res.status(201).json({ message: "Questions uploaded", count });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input format" });
      }
      throw err;
    }
  });

  app.get(api.admin.questions.path, requireAdmin, async (req, res) => {
    const questions = await storage.getUpcomingQuestions();
    res.status(200).json(questions);
  });
  
  app.delete(api.admin.deleteQuestion.path, requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    await storage.deleteQuestion(id);
    res.status(200).json({ message: "Question deleted" });
  });

  return httpServer;
}
