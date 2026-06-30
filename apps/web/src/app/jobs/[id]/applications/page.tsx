"use client";

import { useParams } from "next/navigation";
import { useJobApplications, useScreenApplication } from "@/hooks/use-jobs";
import { useCreateInterview } from "@/hooks/use-interviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function JobApplicationsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const { data: applications, isLoading } = useJobApplications(jobId);
  const screen = useScreenApplication();
  const createInterview = useCreateInterview();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<"PHONE" | "VIDEO" | "IN_PERSON">("VIDEO");
  const [notes, setNotes] = useState("");

  async function updateStatus(applicationId: string, status: string) {
    setUpdatingId(applicationId);
    await api.patch("/api/jobs/applications/status", { applicationId, status });
    queryClient.invalidateQueries({ queryKey: ["jobs", jobId, "applications"] });
    setUpdatingId(null);
  }

  if (isLoading) {
    return <div className="p-8">Loading applications...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Applications</h1>

      <div className="mt-6 space-y-4">
        {applications?.map((app: any) => (
          <div key={app.id} className="rounded-lg border p-6 shadow">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{app.candidate.name || app.candidate.email}</h2>
                <p className="text-sm text-muted-foreground">{app.candidate.email}</p>
                <p className="mt-1 text-sm">Status: <span className="font-medium">{app.status}</span></p>
              </div>
              {app.aiMatchScore !== null && app.aiMatchScore !== undefined && (
                <div
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    app.aiMatchScore >= 75
                      ? "bg-green-100 text-green-800"
                      : app.aiMatchScore >= 50
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {app.aiMatchScore}% match
                </div>
              )}
            </div>

            {app.aiNotes && (
              <p className="mt-3 text-sm text-muted-foreground">{app.aiNotes}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => screen.mutate(app.id)}
                disabled={screen.isPending}
              >
                {screen.isPending ? "Screening..." : "AI Screen"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus(app.id, "INTERVIEW")}
                disabled={updatingId === app.id}
              >
                Interview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSchedulingId(app.id)}
                disabled={schedulingId === app.id}
              >
                Schedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus(app.id, "OFFER")}
                disabled={updatingId === app.id}
              >
                Offer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus(app.id, "HIRED")}
                disabled={updatingId === app.id}
              >
                Hire
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => updateStatus(app.id, "REJECTED")}
                disabled={updatingId === app.id}
              >
                Reject
              </Button>
            </div>

            {schedulingId === app.id && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await createInterview.mutateAsync({
                    applicationId: app.id,
                    scheduledAt: new Date(scheduledAt).toISOString(),
                    durationMinutes: duration,
                    type,
                    notes,
                  });
                  setSchedulingId(null);
                  setScheduledAt("");
                  setNotes("");
                }}
                className="mt-4 rounded-md border p-4"
              >
                <p className="mb-2 font-medium">Schedule interview</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Date & time</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      min={15}
                      max={240}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="PHONE">Phone</option>
                      <option value="VIDEO">Video</option>
                      <option value="IN_PERSON">In person</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <Label>Notes</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Meeting link, location, etc."
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="submit" size="sm" disabled={createInterview.isPending}>
                    {createInterview.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSchedulingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        ))}

        {applications?.length === 0 && (
          <p className="text-center text-muted-foreground">No applications yet.</p>
        )}
      </div>
    </div>
  );
}
