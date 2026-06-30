"use client";

import { useState } from "react";
import { useMyCompanies } from "@/hooks/use-companies";
import { useCompanyAnalytics, useAdminAnalytics } from "@/hooks/use-analytics";

export default function AnalyticsPage() {
  const { data: companies } = useMyCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const { data: companyAnalytics } = useCompanyAnalytics(selectedCompanyId);
  const { data: adminAnalytics } = useAdminAnalytics();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Total users</p>
          <p className="text-3xl font-bold">{adminAnalytics?.totalUsers || 0}</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Total companies</p>
          <p className="text-3xl font-bold">{adminAnalytics?.totalCompanies || 0}</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Total jobs</p>
          <p className="text-3xl font-bold">{adminAnalytics?.totalJobs || 0}</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Total applications</p>
          <p className="text-3xl font-bold">{adminAnalytics?.totalApplications || 0}</p>
        </div>
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Total interviews</p>
          <p className="text-3xl font-bold">{adminAnalytics?.totalInterviews || 0}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Company analytics</h2>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="mt-2 flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select a company</option>
          {companies?.map((company: any) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        {companyAnalytics && (
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Total jobs</p>
              <p className="text-3xl font-bold">{companyAnalytics.totalJobs}</p>
            </div>
            <div className="rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Total applications</p>
              <p className="text-3xl font-bold">{companyAnalytics.totalApplications}</p>
            </div>
            <div className="rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Average AI match</p>
              <p className="text-3xl font-bold">
                {Math.round(companyAnalytics.averageAiMatchScore)}%
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <p className="text-sm text-muted-foreground">Total interviews</p>
              <p className="text-3xl font-bold">{companyAnalytics.totalInterviews}</p>
            </div>
          </div>
        )}

        {companyAnalytics?.applicationsByStatus && (
          <div className="mt-6 rounded-lg border p-6">
            <h3 className="font-bold">Applications by status</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {Object.entries(companyAnalytics.applicationsByStatus).map(([status, count]) => (
                <div key={status} className="rounded-md bg-muted p-3">
                  <p className="text-xs uppercase text-muted-foreground">{status}</p>
                  <p className="text-xl font-bold">{count as number}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
