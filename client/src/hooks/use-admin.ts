import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useAdminQuestions() {
  return useQuery({
    queryKey: [api.admin.questions.path],
    queryFn: async () => {
      const res = await fetch(api.admin.questions.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return parseWithLogging(api.admin.questions.responses[200], await res.json(), "admin.questions");
    },
  });
}

export function useUploadWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.admin.uploadWeek.input>) => {
      const res = await fetch(api.admin.uploadWeek.path, {
        method: api.admin.uploadWeek.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || "Failed to upload");
      return parseWithLogging(api.admin.uploadWeek.responses[201], responseData, "admin.uploadWeek");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.questions.path] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.admin.deleteQuestion.path, { id });
      const res = await fetch(url, {
        method: api.admin.deleteQuestion.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.questions.path] });
    },
  });
}
