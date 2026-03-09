 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useTodayGame() {
  return useQuery({
    queryKey: [api.game.today.path],
    queryFn: async () => {
      const res = await fetch(api.game.today.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch game");
      return parseWithLogging(api.game.today.responses[200], await res.json(), "game.today");
    },
  });
}

export function useSubmitGuess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.game.submit.input>) => {
      const res = await fetch(api.game.submit.path, {
        method: api.game.submit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Failed to submit guess");
      }
      return parseWithLogging(api.game.submit.responses[200], responseData, "game.submit");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.game.today.path] });
      queryClient.invalidateQueries({ queryKey: [api.game.stats.path] });
    },
  });
}

export function useGameStats() {
  return useQuery({
    queryKey: [api.game.stats.path],
    queryFn: async () => {
      const res = await fetch(api.game.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return parseWithLogging(api.game.stats.responses[200], await res.json(), "game.stats");
    },
  });
}
