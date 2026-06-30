"use client";

import { useParams } from "next/navigation";
import { useJob, useApplyToJob } from "@/hooks/use-jobs";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id);
  const apply = useApplyToJob();
  const user = useAuthStore((s) => s.user);
  const [submitted, setSubmitted] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  if (isLoading) {
    return <div className="p-8">Loading job...</div>;
  }

  if (!job) {
    return <div className="p-8">Job not found</div>;
  }

  const hasApplied = job.applications?.length > 0;

  async function handleApply() {
    await apply.mutateAsync({ jobId: job.id, coverLetter });
    setSubmitted(true);
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <p className="text-lg text-muted-foreground">{job.company?.name}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {job.location && (
            <span className="rounded-full bg-secondary px-3 py-1 text-sm">{job.location}</span>
          )}
          {job.remote && (
            <span className="rounded-full bg-secondary px-3 py-1 text-sm">Remote</span>
          )}
          {job.salary && (
            <span className="rounded-full bg-secondary px-3 py-1 text-sm">{job.salary}</span>
          )}
          {job.experience && (
            <span className="rounded-full bg-secondary px-3 py-1 text-sm">{job.experience}</span>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <section>
            <h2 className="text-xl font-bold">Description</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{job.description}</p>
          </section>

          {job.benefits && (
            <section>
              <h2 className="text-xl font-bold">Benefits</h2>
              <p className="whitespace-pre-wrap text-muted-foreground">{job.benefits}</p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold">Skills</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.skills?.map((s: any) => (
                <span key={s.id} className="rounded-full border px-3 py-1 text-sm">
                  {s.skill.name}
                </span>
              ))}
            </div>
          </section>
        </div>

        {user && !hasApplied && !submitted && (
          <div className="mt-8 space-y-4 rounded-lg border p-6">
            <h2 className="text-xl font-bold">Apply now</h2>
            <textarea
              placeholder="Cover letter (optional)"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Button onClick={handleApply} disabled={apply.isPending}>
              {apply.isPending ? "Applying..." : "Apply"}
            </Button>
          </div>
        )}

        {(hasApplied || submitted) && (
          <p className="mt-8 rounded-lg bg-green-100 p-3 text-green-800">
            You have applied to this position.
          </p>
        )}
      </div>
    </div>
  );
}
