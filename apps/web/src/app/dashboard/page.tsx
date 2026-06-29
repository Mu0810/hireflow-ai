"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await api.post("/api/auth/logout");
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <p className="mt-4">Welcome, {user?.name || user?.email}</p>
      <p className="text-sm text-muted-foreground">Role: {user?.role}</p>
    </div>
  );
}
