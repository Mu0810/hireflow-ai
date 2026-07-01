"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useMyCompanies } from "@/hooks/use-companies";
import { useUnreadNotifications } from "@/hooks/use-notifications";
import Link from "next/link";

export default function DashboardPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const { data: companies, isLoading } = useMyCompanies();
  const { data: unreadNotifications } = useUnreadNotifications();

  const handleLogout = async () => {
    await api.post("/api/auth/logout");
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/jobs">
            <Button variant="outline">Browse jobs</Button>
          </Link>
          <Link href="/interviews">
            <Button variant="outline">Interviews</Button>
          </Link>
          <Link href="/notifications">
            <Button variant="outline">
              Notifications{" "}
              {unreadNotifications?.length > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                  {unreadNotifications.length}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="outline">Analytics</Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline">My profile</Button>
          </Link>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      <p className="mt-4">Welcome, {user?.name || user?.email}</p>
      <p className="text-sm text-muted-foreground">Role: {user?.role}</p>

      <div className="mt-8 rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Your companies</h2>
          <Link href="/companies/new">
            <Button>Create company</Button>
          </Link>
        </div>

        {isLoading ? (
          <p className="mt-4 text-muted-foreground">Loading...</p>
        ) : companies?.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            You are not part of any company yet. Create one to get started.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies?.map((company: any) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="rounded-lg border p-4 transition-colors hover:bg-muted"
              >
                <h3 className="font-semibold">{company.name}</h3>
                <p className="text-sm text-muted-foreground">{company.slug}</p>
                <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-1 text-xs uppercase">
                  {company.memberRole}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Jobs", value: 0 },
          { label: "Applications", value: 0 },
          { label: "Interviews", value: 0 },
          { label: "Hired", value: 0 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
