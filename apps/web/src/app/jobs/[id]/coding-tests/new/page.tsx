"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCodingTestSchema, CreateCodingTestInput } from "@hireflow/shared";
import { useCreateCodingTest } from "@/hooks/use-coding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function NewCodingTestPage() {
  const { id: jobId } = useParams<{ id: string }>();
  const router = useRouter();
  const createTest = useCreateCodingTest(jobId);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCodingTestInput>({
    resolver: zodResolver(createCodingTestSchema),
    defaultValues: {
      jobId,
      title: "",
      description: "",
      timeLimitMinutes: 30,
      language: "JAVASCRIPT",
      starterCode: "function solution(input) {\n  // write your solution\n}",
      testCases: [{ input: "", expectedOutput: "" }],
    },
  });

  const testCases = useFieldArray({ control, name: "testCases" });

  async function onSubmit(data: CreateCodingTestInput) {
    try {
      setError(null);
      await createTest.mutateAsync(data);
      router.push(`/jobs/${jobId}/coding-tests`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create test");
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Create coding test</h1>

        {error && <p className="mt-4 rounded-lg bg-red-100 p-3 text-red-800">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="timeLimitMinutes">Time limit (minutes)</Label>
              <Input
                id="timeLimitMinutes"
                type="number"
                min={5}
                max={180}
                {...register("timeLimitMinutes", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                {...register("language")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="JAVASCRIPT">JavaScript</option>
                <option value="TYPESCRIPT">TypeScript</option>
                <option value="PYTHON">Python</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="starterCode">Starter code</Label>
            <textarea
              id="starterCode"
              {...register("starterCode")}
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
          </div>

          <div>
            <Label>Test cases</Label>
            <div className="mt-2 space-y-3">
              {testCases.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder='Input (JSON, e.g. [1,2,3])' {...register(`testCases.${index}.input`)} />
                  <Input placeholder="Expected output (JSON)" {...register(`testCases.${index}.expectedOutput`)} />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => testCases.append({ input: "", expectedOutput: "" })}
              >
                Add test case
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={createTest.isPending}>
            {createTest.isPending ? "Creating..." : "Create test"}
          </Button>
        </form>
      </div>
    </div>
  );
}
