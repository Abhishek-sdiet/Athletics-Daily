import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import passport from "passport";
import session from "express-session";
import { Strategy as LocalStrategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";

const PostgresStore = connectPgSimple(session);

function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "athletics-secret",
    resave: false,
    saveUninitialized: false,
    store: new PostgresStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);

        if (!user || user.password !== password) {
          return done(null, false);
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  });
}

function evaluateGuess(guess: string, answer: string) {
  const result: string[] = [];

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      result.push("correct");
    } else if (answer.includes(guess[i])) {
      result.push("present");
    } else {
      result.push("absent");
    }
  }

  return result;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  setupAuth(app);

  const requireAuth = (req: any, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // REGISTER
  app.post(api.auth.register.path, async (req: Request, res: Response) => {
    const input = req.body;

    const existing = await storage.getUserByUsername(input.username);

    if (existing) {
      return res.status(400).json({ message: "Username exists" });
    }

    const user = await storage.createUser(input);

    return res.json(user);
  });

  // LOGIN
  app.post(
    api.auth.login.path,
    passport.authenticate("local"),
    (req: any, res: Response) => {
      return res.json(req.user);
    }
  );

  // TODAY QUESTION
  app.get(api.game.today.path, requireAuth, async (req: any, res: Response) => {
    const today = new Date().toISOString().split("T")[0];

    const question = await storage.getQuestionByDate(today);

    if (!question) {
      return res.status(404).json({ message: "No game today" });
    }

    return res.json({
      question: question.questionText,
      length: question.answer.length,
      date: question.date,
    });
  });

  // SUBMIT GUESS
  app.post(api.game.submit.path, requireAuth, async (req: any, res: Response) => {

    const { guess, date } = req.body;

    const question = await storage.getQuestionByDate(date);

    if (!question) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const evaluation = evaluateGuess(
      guess.toUpperCase(),
      question.answer
    );

    return res.json({
      evaluation,
      solved: guess.toUpperCase() === question.answer,
    });

  });

  return httpServer;
}
