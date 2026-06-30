"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useCodingTest, useStartSubmission, useSubmitCodingTest } from "@/hooks/use-coding";
import { Button } from "@/components/ui/button";

export default function TakeCodingTestPage() {
  const { id: testId } = useParams<{ id: string }>();
  const { data: test, isLoading } = useCodingTest(testId);
  const start = useStartSubmission(testId);
  const submit = useSubmitCodingTest(testId);
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (test && code === "") {
      setCode(test.starterCode || "");
    }
  }, [test, code]);

  async function handleStart() {
    const submission = await start.mutateAsync();
    if (submission.code) {
      setCode(submission.code);
    }
  }

  async function handleSubmit() {
    const result = await submit.mutateAsync({ testId, code });
    setSubmitted(true);
  }

  if (isLoading) {
    return <div className="p-8">Loading test...</div>;
  }

  if (!test) {
    return <div className="p-8">Test not found</div>;
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{test.title}</h1>
            <p className="text-muted-foreground">
              {test.language} · {test.timeLimitMinutes} minutes
            </p>
          </div>
          <Button onClick={handleStart} disabled={start.isPending || submit.isPending}>
            {start.isPending ? "Starting..." : "Start / reset"}
          </Button>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{test.description}</p>

        <div className="mt-6">
          <label htmlFor="code" className="text-sm font-medium">
            Your solution
          </label>
          <textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={20}
            className="mt-2 flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="mt-4 w-full"
          disabled={submit.isPending || submitted}
        >
          {submit.isPending ? "Running tests..." : submitted ? "Submitted" : "Submit solution"}
        </Button>

        {submit.data && (
          <div className="mt-6 rounded-lg border p-6">
            <p className="text-lg font-bold">
              Score: {submit.data.score}% · {submit.data.status}
            </p>
            {submit.data.results && (
              <ul className="mt-4 space-y-2">
                {JSON.parse(submit.data.results).map((r: any, i: number) => (
                  <li
                    key={i}
                    className={`rounded-md border p-3 ${
                      r.passed ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    <p className="font-medium">
                      Test {i + 1}: {r.passed ? "Passed" : "Failed"}
                    </p>
                    <p className="text-sm text-muted-foreground">Input: {r.input}</p>
                    <p className="text-sm text-muted-foreground">Expected: {r.expectedOutput}</p>
                    {r.actualOutput && (
                      <p className="text-sm text-muted-foreground">Actual: {r.actualOutput}</p>
                    )}
                    {r.error && <p className="text-sm text-red-600">Error: {r.error}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
