"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@hireflow/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError(null);
      await api.post("/api/auth/register", data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-lg border p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-muted-foreground">
            We sent a verification link to your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Create an account</h1>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              {...register("role")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="CANDIDATE">Candidate</option>
              <option value="RECRUITER">Recruiter</option>
              <option value="COMPANY_ADMIN">Company Admin</option>
            </select>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <OAuthButtons />
        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
