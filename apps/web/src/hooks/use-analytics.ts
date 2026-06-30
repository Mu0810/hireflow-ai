import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCompanyAnalytics(companyId: string) {
  return useQuery({
    queryKey: ["analytics", "companies", companyId],
    queryFn: async () => {
      const res = await api.get(`/api/analytics/companies/${companyId}`);
      return res.data.data;
    },
    enabled: !!companyId,
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["analytics", "admin"],
    queryFn: async () => {
      const res = await api.get("/api/analytics/admin");
      return res.data.data;
    },
  });
}
