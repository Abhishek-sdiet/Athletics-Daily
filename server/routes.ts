import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
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
secret: process.env.SESSION_SECRET || "athletics-game-secret",
resave: false,
saveUninitialized: false,
store: new PostgresStore({
conString: process.env.DATABASE_URL,
createTableIfMissing: true,
}),
cookie: {
secure: false,
maxAge: 30 * 24 * 60 * 60 * 1000,
},
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

function evaluateGuess(
guess: string,
answer: string
): ("correct" | "present" | "absent")[] {
const result: ("correct" | "present" | "absent")[] = Array(
guess.length
).fill("absent");

const answerChars = answer.split("");
const guessChars = guess.split("");

for (let i = 0; i < guess.length; i++) {
if (guessChars[i] === answerChars[i]) {
result[i] = "correct";
answerChars[i] = "#";
guessChars[i] = "*";
}
}

for (let i = 0; i < guess.length; i++) {
if (guessChars[i] !== "*") {
const index = answerChars.indexOf(guessChars[i]);
if (index !== -1) {
result[i] = "present";
answerChars[index] = "#";
}
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
if (req.isAuthenticated()) return next();
res.status(401).json({ message: "Unauthorized" });
};

// REGISTER
app.post(api.auth.register.path, async (req: Request, res: Response) => {
try {
const input = api.auth.register.input.parse(req.body);

```
  const existing = await storage.getUserByUsername(input.username);
  if (existing) {
    return res.status(400).json({ message: "Username exists" });
  }

  const user = await storage.createUser(input);
  res.status(201).json(user);
} catch (err) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ message: err.errors[0].message });
  }
  res.status(500).json({ message: "Server error" });
}
```

});

// LOGIN
app.post(api.auth.login.path, passport.authenticate("local"), (req: any, res: Response) => {
res.json(req.user);
});

// TODAY GAME
app.get(api.game.today.path, requireAuth, async (req: any, res: Response) => {
const today = new Date().toISOString().split("T")[0];

```
const question = await storage.getQuestionByDate(today);

if (!question) {
  return res.status(404).json({ message: "No game today" });
}

res.json({
  question: question.questionText,
  length: question.answer.length,
  date: question.date,
});
```

});

// SUBMIT GUESS
app.post(api.game.submit.path, requireAuth, async (req: any, res: Response) => {
try {
const { guess, date } = api.game.submit.input.parse(req.body);

```
  const question = await storage.getQuestionByDate(date);

  if (!question) {
    return res.status(400).json({ message: "Invalid date" });
  }

  const result = evaluateGuess(guess.toUpperCase(), question.answer);

  res.json({
    evaluation: result,
    solved: guess.toUpperCase() === question.answer,
  });
} catch {
  res.status(400).json({ message: "Invalid input" });
}
```

});

return httpServer;
}
