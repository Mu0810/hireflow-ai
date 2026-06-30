import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreateJobInput, ApplyToJobInput } from "@hireflow/shared";

export function useOpenJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await api.get("/api/jobs");
      return res.data.data;
    },
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: async () => {
      const res = await api.get(`/api/jobs/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCompanyJobs(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "jobs"],
    queryFn: async () => {
      const res = await api.get(`/api/companies/${companyId}/jobs`);
      return res.data.data;
    },
    enabled: !!companyId,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateJobInput) => {
      const res = await api.post("/api/jobs", data);
      return res.data.data;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ["companies", data.companyId, "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ApplyToJobInput) => {
      const res = await api.post("/api/jobs/apply", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useMyApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const res = await api.get("/api/jobs/my");
      return res.data.data;
    },
  });
}
