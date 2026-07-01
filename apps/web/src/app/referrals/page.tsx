"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReferralSchema, CreateReferralInput } from "@hireflow/shared";
import { useMyCompanies } from "@/hooks/use-companies";
import { useMyReferrals, useCreateReferral } from "@/hooks/use-subscriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReferralsPage() {
  const { data: companies } = useMyCompanies();
  const { data: referrals, isLoading } = useMyReferrals();
  const createReferral = useCreateReferral();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateReferralInput>({
    resolver: zodResolver(createReferralSchema),
    defaultValues: {
      companyId: "",
      candidateEmail: "",
      candidateName: "",
      jobId: "",
      notes: "",
    },
  });

  async function onSubmit(data: CreateReferralInput) {
    try {
      setError(null);
      setSuccess(false);
      await createReferral.mutateAsync(data);
      setSuccess(true);
      reset();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit referral");
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Referrals</h1>

        <div className="mt-6 rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-bold">Submit a referral</h2>
          {success && <p className="mt-2 text-green-600">Referral submitted!</p>}
          {error && <p className="mt-2 text-red-600">{error}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="companyId">Company</Label>
              <select
                id="companyId"
                {...register("companyId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select company</option>
                {companies?.map((company: any) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.companyId && <p className="text-sm text-red-600">{errors.companyId.message}</p>}
            </div>
            <div>
              <Label htmlFor="candidateName">Candidate name</Label>
              <Input id="candidateName" {...register("candidateName")} />
            </div>
            <div>
              <Label htmlFor="candidateEmail">Candidate email</Label>
              <Input id="candidateEmail" type="email" {...register("candidateEmail")} />
              {errors.candidateEmail && <p className="text-sm text-red-600">{errors.candidateEmail.message}</p>}
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...register("notes")} />
            </div>
            <Button type="submit" disabled={createReferral.isPending}>
              {createReferral.isPending ? "Submitting..." : "Submit referral"}
            </Button>
          </form>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold">My referrals</h2>
          <div className="mt-4 space-y-3">
            {referrals?.map((referral: any) => (
              <div key={referral.id} className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{referral.candidateName || referral.candidateEmail}</p>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase">
                    {referral.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {referral.company.name} {referral.job && `· ${referral.job.title}`}
                </p>
                {referral.notes && <p className="text-sm text-muted-foreground">{referral.notes}</p>}
              </div>
            ))}
            {referrals?.length === 0 && <p className="text-muted-foreground">No referrals yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
