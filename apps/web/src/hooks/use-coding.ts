import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreateCodingTestInput, SubmitCodingTestInput } from "@hireflow/shared";

export function useJobCodingTests(jobId: string) {
  return useQuery({
    queryKey: ["jobs", jobId, "coding-tests"],
    queryFn: async () => {
      const res = await api.get(`/api/coding/jobs/${jobId}/tests`);
      return res.data.data;
    },
    enabled: !!jobId,
  });
}

export function useCodingTest(testId: string) {
  return useQuery({
    queryKey: ["coding-tests", testId],
    queryFn: async () => {
      const res = await api.get(`/api/coding/tests/${testId}`);
      return res.data.data;
    },
    enabled: !!testId,
  });
}

export function useCreateCodingTest(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCodingTestInput) => {
      const res = await api.post("/api/coding/tests", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId, "coding-tests"] });
    },
  });
}

export function useStartSubmission(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/coding/tests/${testId}/start`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coding-tests", testId, "submission"] });
    },
  });
}

export function useSubmitCodingTest(testId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SubmitCodingTestInput) => {
      const res = await api.post(`/api/coding/tests/${testId}/submit`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coding-tests", testId, "submission"] });
    },
  });
}

export function useMySubmissions(jobId: string) {
  return useQuery({
    queryKey: ["jobs", jobId, "my-submissions"],
    queryFn: async () => {
      const res = await api.get(`/api/coding/jobs/${jobId}/submissions`);
      return res.data.data;
    },
    enabled: !!jobId,
  });
}
