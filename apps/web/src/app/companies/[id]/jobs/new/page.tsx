"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJobSchema, CreateJobInput } from "@hireflow/shared";
import { useCreateJob } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function NewJobPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const router = useRouter();
  const createJob = useCreateJob();
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: "",
      description: "",
      experience: "",
      salary: "",
      location: "",
      remote: false,
      deadline: "",
      benefits: "",
      openings: 1,
      skills: [],
    },
  });

  function addSkill() {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const updated = [...skills, skillInput.trim()];
      setSkills(updated);
      setValue("skills", updated);
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    const updated = skills.filter((s) => s !== skill);
    setSkills(updated);
    setValue("skills", updated);
  }

  async function onSubmit(data: CreateJobInput) {
    try {
      setError(null);
      await createJob.mutateAsync({ ...data, companyId });
    // companyId injected above
      router.push(`/companies/${companyId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create job");
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Post a new job</h1>

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
              rows={6}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="experience">Experience</Label>
              <Input id="experience" {...register("experience")} />
            </div>
            <div>
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" {...register("salary")} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} />
            </div>
            <div>
              <Label htmlFor="deadline">Application deadline</Label>
              <Input id="deadline" type="date" {...register("deadline")} />
            </div>
            <div>
              <Label htmlFor="openings">Openings</Label>
              <Input id="openings" type="number" min={1} {...register("openings", { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <Label htmlFor="benefits">Benefits</Label>
            <textarea
              id="benefits"
              {...register("benefits")}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="remote" type="checkbox" {...register("remote")} />
            <Label htmlFor="remote">Remote</Label>
          </div>

          <div>
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addSkill}>
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || createJob.isPending}>
            {createJob.isPending ? "Posting..." : "Post job"}
          </Button>
        </form>
      </div>
    </div>
  );
}
