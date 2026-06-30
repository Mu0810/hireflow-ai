import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreateInterviewInput, SendMessageInput } from "@hireflow/shared";

export function useMyInterviews() {
  return useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const res = await api.get("/api/interviews/my");
      return res.data.data;
    },
  });
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: ["interviews", id],
    queryFn: async () => {
      const res = await api.get(`/api/interviews/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInterviewInput) => {
      const res = await api.post("/api/interviews", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
  });
}

export function useSendMessage(interviewId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SendMessageInput) => {
      const res = await api.post("/api/interviews/messages", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews", interviewId] });
    },
  });
}
