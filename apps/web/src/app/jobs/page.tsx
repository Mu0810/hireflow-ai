"use client";

import { useOpenJobs } from "@/hooks/use-jobs";
import Link from "next/link";

export default function JobsPage() {
  const { data: jobs, isLoading } = useOpenJobs();

  if (isLoading) {
    return <div className="p-8">Loading jobs...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Open positions</h1>
      <p className="text-muted-foreground">Browse and apply to jobs from top startups.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs?.map((job: any) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="rounded-lg border p-6 shadow transition-colors hover:bg-muted"
          >
            <h2 className="text-xl font-bold">{job.title}</h2>
            <p className="text-sm text-muted-foreground">{job.company?.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.location && (
                <span className="rounded-full bg-secondary px-2 py-1 text-xs">{job.location}</span>
              )}
              {job.remote && (
                <span className="rounded-full bg-secondary px-2 py-1 text-xs">Remote</span>
              )}
              {job.salary && (
                <span className="rounded-full bg-secondary px-2 py-1 text-xs">{job.salary}</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {job.skills?.slice(0, 5).map((s: any) => (
                <span
                  key={s.id}
                  className="rounded-full border px-2 py-0.5 text-xs"
                >
                  {s.skill.name}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {jobs?.length === 0 && (
        <p className="mt-8 text-center text-muted-foreground">No open jobs right now.</p>
      )}
    </div>
  );
}
