"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCompany, useInviteMember } from "@/hooks/use-companies";
import { useCompanyJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMemberSchema, InviteMemberInput } from "@hireflow/shared";
import { useState } from "react";

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: company, isLoading } = useCompany(id);
  const { data: jobs } = useCompanyJobs(id);
  const inviteMember = useInviteMember(id);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
  });

  const onSubmit = async (data: InviteMemberInput) => {
    try {
      setInviteError(null);
      setInviteSuccess(false);
      await inviteMember.mutateAsync(data);
      setInviteSuccess(true);
      reset();
    } catch (err: any) {
      setInviteError(err.response?.data?.error || "Failed to send invite");
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!company) {
    return <div className="p-8">Company not found</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="text-primary underline">
              {company.website}
            </a>
          )}
          {company.description && <p className="mt-2 text-muted-foreground">{company.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/companies/${id}/subscription`}>
            <Button variant="outline" size="sm">Subscription</Button>
          </Link>
          {company.verified && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Verified
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Open positions</h2>
          <Link href={`/companies/${id}/jobs/new`}>
            <Button variant="outline">Post a job</Button>
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {jobs?.map((job: any) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted"
            >
              <Link href={`/jobs/${job.id}`} className="flex-1">
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-muted-foreground">
                  {job.location} · {job.remote ? "Remote" : "On-site"} · {job._count?.applications} applications
                </p>
              </Link>
              <div className="flex items-center gap-2">
                <Link href={`/jobs/${job.id}/coding-tests`}>
                  <Button variant="ghost" size="sm">Tests</Button>
                </Link>
                <Link href={`/jobs/${job.id}/applications`}>
                  <Button variant="ghost" size="sm">Applications</Button>
                </Link>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${
                    job.status === "OPEN"
                      ? "bg-green-100 text-green-800"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {job.status}
                </span>
              </div>
            </div>
          ))}
          {jobs?.length === 0 && <p className="text-sm text-muted-foreground">No jobs posted yet.</p>}
        </div>
      </div>

      <div className="mt-8 rounded-lg border p-6 shadow">
        <h2 className="text-xl font-bold">Team members</h2>
        <div className="mt-4 space-y-2">
          {company.members?.map((member: any) => (
            <div key={member.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{member.user.name || member.user.email}</p>
                <p className="text-sm text-muted-foreground">{member.user.email}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-lg border p-6 shadow">
        <h2 className="text-xl font-bold">Invite a team member</h2>
        {inviteSuccess && <p className="mt-2 text-sm text-green-600">Invitation sent</p>}
        {inviteError && <p className="mt-2 text-sm text-red-500">{inviteError}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              {...register("role")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="RECRUITER">Recruiter</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send invite"}
          </Button>
        </form>
      </div>
    </div>
  );
}
