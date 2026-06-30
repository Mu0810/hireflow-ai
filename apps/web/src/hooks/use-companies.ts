import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreateCompanyInput, InviteMemberInput } from "@hireflow/shared";

export function useMyCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await api.get("/api/companies/my");
      return res.data.data;
    },
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: async () => {
      const res = await api.get(`/api/companies/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCompanyInput) => {
      const res = await api.post("/api/companies", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}

export function useInviteMember(companyId: string) {
  return useMutation({
    mutationFn: async (data: InviteMemberInput) => {
      const res = await api.post(`/api/companies/${companyId}/invite`, data);
      return res.data;
    },
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post("/api/companies/accept-invite", { token });
      return res.data;
    },
  });
}
