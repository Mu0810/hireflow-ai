"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCompanySchema, CreateCompanyInput } from "@hireflow/shared";
import { useCreateCompany } from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCompanyPage() {
  const router = useRouter();
  const createCompany = useCreateCompany();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema),
  });

  const onSubmit = async (data: CreateCompanyInput) => {
    try {
      setError(null);
      const company = await createCompany.mutateAsync(data);
      router.push(`/companies/${company.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create company");
    }
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-xl rounded-lg border p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Create a company</h1>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="name">Company name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register("slug")} placeholder="acme-inc" />
            {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input id="website" {...register("website")} placeholder="https://example.com" />
            {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create company"}
          </Button>
        </form>
      </div>
    </div>
  );
}
