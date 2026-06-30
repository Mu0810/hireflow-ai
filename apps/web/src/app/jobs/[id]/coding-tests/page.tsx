"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useJobCodingTests } from "@/hooks/use-coding";
import { Button } from "@/components/ui/button";

export default function CodingTestsPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const { data: tests, isLoading } = useJobCodingTests(jobId);

  if (isLoading) {
    return <div className="p-8">Loading tests...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coding tests</h1>
        <Link href={`/jobs/${jobId}/coding-tests/new`}>
          <Button>Create test</Button>
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {tests?.map((test: any) => (
          <div
            key={test.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div>
              <p className="font-medium">{test.title}</p>
              <p className="text-sm text-muted-foreground">
                {test.language} · {test.timeLimitMinutes} minutes
              </p>
            </div>
            <Link href={`/coding/tests/${test.id}`}>
              <Button variant="outline" size="sm">Take test</Button>
            </Link>
          </div>
        ))}
        {tests?.length === 0 && <p className="text-muted-foreground">No tests yet.</p>}
      </div>
    </div>
  );
}
