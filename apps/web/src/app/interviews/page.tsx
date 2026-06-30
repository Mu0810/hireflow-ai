"use client";

import Link from "next/link";
import { useMyInterviews } from "@/hooks/use-interviews";

export default function InterviewsPage() {
  const { data: interviews, isLoading } = useMyInterviews();

  if (isLoading) {
    return <div className="p-8">Loading interviews...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Interviews</h1>

      <div className="mt-6 space-y-3">
        {interviews?.map((interview: any) => (
          <Link
            key={interview.id}
            href={`/interviews/${interview.id}`}
            className="block rounded-lg border p-6 shadow transition-colors hover:bg-muted"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{interview.application.job.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {interview.application.job.company.name} · {" "}
                  {interview.application.candidate.name || interview.application.candidate.email}
                </p>
                <p className="mt-1 text-sm">
                  {new Date(interview.scheduledAt).toLocaleString()} · {interview.durationMinutes} min ·{" "}
                  {interview.type}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${
                  interview.status === "SCHEDULED"
                    ? "bg-blue-100 text-blue-800"
                    : interview.status === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {interview.status}
              </span>
            </div>
          </Link>
        ))}
        {interviews?.length === 0 && (
          <p className="text-center text-muted-foreground">No interviews scheduled.</p>
        )}
      </div>
    </div>
  );
}
