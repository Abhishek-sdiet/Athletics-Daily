import { z } from 'zod';
import { insertUserSchema, insertQuestionSchema, questions, users, gameResults } from './schema.js';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    }
  },
  game: {
    today: {
      method: 'GET' as const,
      path: '/api/game/today' as const,
      responses: {
        200: z.object({
          question: z.string(),
          length: z.number(),
          date: z.string(),
          gameState: z.object({
            guesses: z.array(z.string()),
            evaluations: z.array(z.array(z.enum(['correct', 'present', 'absent']))),
            isSolved: z.boolean(),
            isGameOver: z.boolean()
          }).nullable()
        }),
        404: errorSchemas.notFound,
      }
    },
    submit: {
      method: 'POST' as const,
      path: '/api/game/submit' as const,
      input: z.object({ guess: z.string(), date: z.string() }),
      responses: {
        200: z.object({
          evaluation: z.array(z.enum(['correct', 'present', 'absent'])),
          isSolved: z.boolean(),
          isGameOver: z.boolean(),
          guesses: z.array(z.string()),
          evaluations: z.array(z.array(z.enum(['correct', 'present', 'absent'])))
        }),
        400: errorSchemas.validation,
      }
    },
    stats: {
      method: 'GET' as const,
      path: '/api/game/stats' as const,
      responses: {
        200: z.object({
          gamesPlayed: z.number(),
          wins: z.number(),
          winRate: z.number(),
          bestAttempt: z.number().nullable(),
          currentStreak: z.number(),
        }),
        401: errorSchemas.unauthorized,
      }
    }
  },
  admin: {
    uploadWeek: {
      method: 'POST' as const,
      path: '/api/admin/upload-week' as const,
      input: z.array(insertQuestionSchema),
      responses: {
        201: z.object({ message: z.string(), count: z.number() }),
        401: errorSchemas.unauthorized,
      }
    },
    questions: {
      method: 'GET' as const,
      path: '/api/admin/questions' as const,
      responses: {
        200: z.array(z.custom<typeof questions.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    deleteQuestion: {
      method: 'DELETE' as const,
      path: '/api/admin/questions/:id' as const,
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
