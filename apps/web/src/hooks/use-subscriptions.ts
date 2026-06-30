import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreateReferralInput, UpdateReferralInput, UpdateSubscriptionInput } from "@hireflow/shared";

export function useCompanySubscription(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "subscription"],
    queryFn: async () => {
      const res = await api.get(`/api/subscriptions/companies/${companyId}`);
      return res.data.data;
    },
    enabled: !!companyId,
  });
}

export function useUpdateCompanySubscription(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateSubscriptionInput) => {
      const res = await api.patch(`/api/subscriptions/companies/${companyId}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", companyId, "subscription"] });
    },
  });
}

export function useCreateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateReferralInput) => {
      const res = await api.post("/api/subscriptions/referrals", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}

export function useMyReferrals() {
  return useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const res = await api.get("/api/subscriptions/referrals/my");
      return res.data.data;
    },
  });
}

export function useCompanyReferrals(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "referrals"],
    queryFn: async () => {
      const res = await api.get(`/api/subscriptions/referrals/companies/${companyId}`);
      return res.data.data;
    },
    enabled: !!companyId,
  });
}

export function useUpdateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReferralInput }) => {
      const res = await api.patch(`/api/subscriptions/referrals/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}
